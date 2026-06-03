import crypto from "crypto";
import pool from "@/src/lib/db";
import { createPaymentTransaction, getOrderForPayment, makeAbsoluteUrl, makeIdempotencyKey, markPaymentTransaction, normalizeProviderStatus, updateOrderPaymentStatus } from "@/src/lib/payments/common";
import { ensurePaymentSchema } from "@/src/lib/payments/schema";
import type { PaymentCreateInput, PaymentCreateResult } from "@/src/lib/payments/types";

let tokenCache: { accessToken: string; tokenType: string; expiresAt: number } | null = null;

type PaymentTransactionStatus = Parameters<typeof markPaymentTransaction>[0]["status"];
type PaymentTransactionLookupRow = {
  id?: number | string;
  order_number?: string | null;
  provider_payment_id?: string | null;
  provider_checkout_id?: string | null;
};

type MaibRefundOrderRow = {
  id: number | string;
  order_number: string;
  total_amount: number | string;
  currency: string | null;
  payment_method: string | null;
  payment_status: string | null;
};

function maibBaseUrl() {
  return (process.env.MAIB_API_BASE_URL || "https://api.maibmerchants.md").replace(/\/$/, "");
}

function maibCredentials() {
  const clientId = process.env.MAIB_CLIENT_ID;
  const clientSecret = process.env.MAIB_CLIENT_SECRET;
  const signatureKey = process.env.MAIB_SIGNATURE_KEY;
  if (!clientId || !clientSecret) throw new Error("MAIB_CLIENT_ID and MAIB_CLIENT_SECRET are required");
  return { clientId, clientSecret, signatureKey };
}

async function fetchMaibToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 20_000) return tokenCache;

  const { clientId, clientSecret } = maibCredentials();
  const response = await fetch(`${maibBaseUrl()}/v2/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  const result = data?.result || data;
  if (!response.ok || !result?.accessToken) {
    throw new Error(data?.message || data?.error || "MAIB auth failed");
  }

  tokenCache = {
    accessToken: String(result.accessToken),
    tokenType: String(result.tokenType || "Bearer"),
    expiresAt: now + Math.max(60, Number(result.expiresIn || 300) - 20) * 1000,
  };

  return tokenCache;
}

export async function createMaibPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
  const order = await getOrderForPayment(input.orderId);
  if (!order) return { success: false, message: "Заказ не найден" };
  if (order.totalAmount <= 0) return { success: false, message: "Некорректная сумма заказа" };

  const deliveryAmount = order.deliveryAmount > 0 ? order.deliveryAmount : null;

  const idempotencyKey = makeIdempotencyKey("maib", order.orderNumber);
  const payload = {
    amount: order.totalAmount,
    currency: order.currency,
    orderInfo: {
      id: order.orderNumber,
      description: `Kimramen order ${order.orderNumber}`,
      date: new Date().toISOString(),
      orderAmount: order.subtotalAmount,
      orderCurrency: order.currency,
      deliveryAmount,
      deliveryCurrency: deliveryAmount === null ? null : order.currency,
      items: order.items.map((item, index) => ({
        externalId: item.sku || String(item.productId || index + 1),
        title: item.productName,
        amount: item.unitPrice,
        currency: item.currency || order.currency,
        quantity: item.quantity,
        displayOrder: index + 1,
      })),
    },
    payerInfo: {
      name: order.customerName,
      email: order.customerEmail || undefined,
      phone: order.customerPhone,
      ip: input.customerIp || undefined,
      userAgent: input.userAgent || undefined,
    },
    language: input.language || "ru",
    callbackUrl: makeAbsoluteUrl("/api/payments/maib/callback", input.publicBaseUrl),
    successUrl: makeAbsoluteUrl(`/api/payments/return?provider=maib&order=${encodeURIComponent(order.orderNumber)}`, input.publicBaseUrl),
    failUrl: makeAbsoluteUrl(`/api/payments/return?provider=maib&order=${encodeURIComponent(order.orderNumber)}&failed=1`, input.publicBaseUrl),
  };

  const transactionId = await createPaymentTransaction({ order, provider: "maib", idempotencyKey, requestPayload: payload });

  try {
    const token = await fetchMaibToken();
    const response = await fetch(`${maibBaseUrl()}/v2/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `${token.tokenType} ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    const checkoutId = data?.result?.checkoutId ? String(data.result.checkoutId) : null;
    const checkoutUrl = data?.result?.checkoutUrl ? String(data.result.checkoutUrl) : null;

    if (!response.ok || !data?.ok || !checkoutUrl) {
      await markPaymentTransaction({ transactionId, status: "failed", responsePayload: data, failureReason: data?.errors ? JSON.stringify(data.errors) : "MAIB checkout creation failed" });
      return { success: false, message: "maib не создал checkout-сессию", orderNumber: order.orderNumber, provider: "maib" };
    }

    await markPaymentTransaction({ transactionId, status: "redirected", providerCheckoutId: checkoutId, redirectUrl: checkoutUrl, responsePayload: data });
    return { success: true, redirectUrl: checkoutUrl, orderNumber: order.orderNumber, transactionId, provider: "maib", checkoutId };
  } catch (error) {
    await markPaymentTransaction({ transactionId, status: "failed", failureReason: error instanceof Error ? error.message : "MAIB unknown error" });
    throw error;
  }
}

export function verifyMaibCallback(rawBody: string, signatureHeader: string | null, timestampHeader: string | null) {
  const { signatureKey } = maibCredentials();
  if (!signatureKey) return false;
  if (!signatureHeader || !timestampHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() - timestamp) > 10 * 60 * 1000) return false;

  const received = signatureHeader.replace(/^sha256=/i, "").trim();
  const message = `${rawBody}.${timestampHeader}`;
  const expectedBase64 = crypto.createHmac("sha256", signatureKey).update(message).digest("base64");
  const expectedHex = crypto.createHmac("sha256", signatureKey).update(message).digest("hex");

  const a = Buffer.from(received);
  const b64 = Buffer.from(expectedBase64);
  const hex = Buffer.from(expectedHex);
  return (a.length === b64.length && crypto.timingSafeEqual(a, b64)) || (a.length === hex.length && crypto.timingSafeEqual(a, hex));
}

export async function handleMaibCallback(rawBody: string, headers: Headers) {
  if (!verifyMaibCallback(rawBody, headers.get("x-signature"), headers.get("x-signature-timestamp"))) {
    return { success: false, status: 401, message: "Invalid maib signature" };
  }

  const payload = JSON.parse(rawBody || "{}");
  const orderNumber = String(payload.orderId || "");
  const providerStatus = normalizeProviderStatus("maib", payload.paymentStatus || payload.checkoutStatus);
  const reference = payload.paymentId || payload.checkoutId || null;

  if (!orderNumber) return { success: false, status: 400, message: "Missing orderId" };

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<PaymentTransactionLookupRow[]>(
      `SELECT id FROM payment_transactions WHERE provider = 'maib' AND order_number = ? ORDER BY id DESC LIMIT 1`,
      [orderNumber]
    );
    if (rows[0]?.id) {
      await markPaymentTransaction({
        transactionId: Number(rows[0].id),
        status: providerStatus as PaymentTransactionStatus,
        providerCheckoutId: payload.checkoutId || null,
        providerPaymentId: payload.paymentId || null,
        callbackPayload: payload,
      });
    }
  } finally {
    conn.release();
  }

  await updateOrderPaymentStatus(orderNumber, "maib", providerStatus, reference);
  return { success: true, status: 200 };
}

export async function refreshMaibPaymentFromCheckout(checkoutId: string) {
  const token = await fetchMaibToken();
  const response = await fetch(`${maibBaseUrl()}/v2/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `${token.tokenType} ${token.accessToken}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  return response.json().catch(() => null);
}

export async function refreshMaibPaymentStatus(checkoutId: string, fallbackOrderNumber?: string | null) {
  const data = await refreshMaibPaymentFromCheckout(checkoutId);
  if (!data?.ok || !data?.result) return { success: false, data };

  const checkout = data.result;
  const payment = checkout.payment || {};
  const orderNumber = String(checkout.order?.id || fallbackOrderNumber || "");
  const providerStatus = normalizeProviderStatus("maib", payment.status || checkout.status);
  const providerPaymentId = payment.paymentId || payment.PaymentId || null;

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<PaymentTransactionLookupRow[]>(
      `
      SELECT id, order_number
      FROM payment_transactions
      WHERE provider = 'maib' AND (provider_checkout_id = ? OR order_number = ?)
      ORDER BY id DESC
      LIMIT 1
      `,
      [checkoutId, orderNumber]
    );

    if (rows[0]?.id) {
      await markPaymentTransaction({
        transactionId: Number(rows[0].id),
        status: providerStatus as PaymentTransactionStatus,
        providerCheckoutId: checkoutId,
        providerPaymentId,
        responsePayload: data,
      });
    }

    const resolvedOrderNumber = orderNumber || String(rows[0]?.order_number || "");
    if (resolvedOrderNumber) {
      await updateOrderPaymentStatus(resolvedOrderNumber, "maib", providerStatus, providerPaymentId || checkoutId);
    }
  } finally {
    conn.release();
  }

  return { success: true, data: checkout, providerStatus, reference: providerPaymentId || checkoutId, orderNumber };
}

async function getMaibPaymentReference(orderNumber: string) {
  await ensurePaymentSchema();
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<PaymentTransactionLookupRow[]>(
      `
      SELECT id, provider_payment_id, provider_checkout_id
      FROM payment_transactions
      WHERE provider = 'maib' AND order_number = ?
      ORDER BY
        CASE WHEN provider_payment_id IS NOT NULL AND provider_payment_id <> '' THEN 0 ELSE 1 END,
        CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
        id DESC
      LIMIT 1
      `,
      [orderNumber]
    );

    const transaction = rows[0];
    if (!transaction) return null;
    if (transaction.provider_payment_id) return transaction;

    if (transaction.provider_checkout_id) {
      await refreshMaibPaymentStatus(transaction.provider_checkout_id, orderNumber);
      const refreshed = await conn.query<PaymentTransactionLookupRow[]>(
        `
        SELECT id, provider_payment_id, provider_checkout_id
        FROM payment_transactions
        WHERE provider = 'maib' AND order_number = ?
        ORDER BY
          CASE WHEN provider_payment_id IS NOT NULL AND provider_payment_id <> '' THEN 0 ELSE 1 END,
          CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
          id DESC
        LIMIT 1
        `,
        [orderNumber]
      );
      return refreshed[0] || transaction;
    }

    return transaction;
  } finally {
    conn.release();
  }
}

async function getMaibRefundOrder(params: { orderId?: number; orderNumber?: string }) {
  await ensurePaymentSchema();

  const orderNumber = typeof params.orderNumber === "string" ? params.orderNumber.trim() : "";
  if (!params.orderId && !orderNumber) return null;

  const conn = await pool.getConnection();
  try {
    const orders = await conn.query<MaibRefundOrderRow[]>(
      `
      SELECT id, order_number, total_amount, currency, payment_method, payment_status
      FROM orders
      WHERE ${params.orderId ? "id = ?" : "order_number = ?"}
      LIMIT 1
      `,
      [params.orderId || orderNumber]
    );

    return orders[0] || null;
  } finally {
    conn.release();
  }
}

export async function refundMaibPaymentForOrder(params: { orderId?: number; orderNumber?: string; amount?: number; reason?: string }) {
  const order = await getMaibRefundOrder(params);
  if (!order) return { success: false as const, message: "Заказ не найден" };
  if (order.payment_method !== "maib") return { success: false as const, message: "Заказ оплачен не через maib" };
  if (order.payment_status !== "paid") return { success: false as const, message: "Возврат доступен только для оплаченного maib-заказа" };

  const reference = await getMaibPaymentReference(order.order_number);
  const paymentId = reference?.provider_payment_id;
  if (!paymentId) return { success: false as const, message: "У заказа нет maib paymentId для возврата" };

  const refundAmount = params.amount ?? Number(order.total_amount || 0);
  const amount = Number(refundAmount.toFixed(2));
  if (!Number.isFinite(amount) || amount <= 0) return { success: false as const, message: "Некорректная сумма возврата" };

  const token = await fetchMaibToken();
  const payload = {
    amount,
    reason: (params.reason || `Refund for Kimramen order ${order.order_number}`).slice(0, 500),
  };

  const response = await fetch(`${maibBaseUrl()}/v2/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: {
      Authorization: `${token.tokenType} ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    return {
      success: false as const,
      message: data?.errors ? JSON.stringify(data.errors) : "maib не выполнил возврат",
      data,
    };
  }

  if (reference?.id) {
    await markPaymentTransaction({
      transactionId: Number(reference.id),
      status: "refunded",
      providerPaymentId: paymentId,
      responsePayload: data,
    });
  }

  const refundId = data?.result?.refundId ? String(data.result.refundId) : paymentId;
  await updateOrderPaymentStatus(order.order_number, "maib", "refunded", refundId);

  return {
    success: true as const,
    orderNumber: order.order_number,
    paymentId,
    refundId,
    amount,
    currency: order.currency || "MDL",
    data,
  };
}
