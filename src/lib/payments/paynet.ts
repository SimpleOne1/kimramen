import crypto from "crypto";
import pool from "@/src/lib/db";
import {
  createPaymentTransaction,
  getOrderForPayment,
  makeAbsoluteUrl,
  makeIdempotencyKey,
  markPaymentTransaction,
  normalizeProviderStatus,
  updateOrderPaymentStatus,
} from "@/src/lib/payments/common";
import type { PaymentCreateInput, PaymentCreateResult, PaymentProviderOrder } from "@/src/lib/payments/types";

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

const CURRENCY_CODE: Record<string, number> = {
  MDL: 498,
  USD: 840,
  EUR: 978,
};

function paynetApiBaseUrl() {
  return (process.env.PAYNET_API_BASE_URL || "https://ecom-api-test.paynet.md").replace(/\/$/, "");
}

function paynetCheckoutUrl() {
  return process.env.PAYNET_CHECKOUT_URL || "https://test.paynet.md/acquiring/setecom";
}

function credentials() {
  const username = process.env.PAYNET_USERNAME;
  const password = process.env.PAYNET_PASSWORD;
  const merchantId = process.env.PAYNET_MERCHANT_ID || process.env.PAYNET_MERCHANT_CODE || "";
  const secretKey = process.env.PAYNET_SECRET_KEY || "";
  const customerCode = process.env.PAYNET_CUSTOMER_CODE || "";
  const saleAreaCode = process.env.PAYNET_SALE_AREA_CODE || "";

  if (!username || !password) throw new Error("PAYNET_USERNAME and PAYNET_PASSWORD are required");

  return { username, password, merchantId, secretKey, customerCode, saleAreaCode };
}

function toPaynetLang(language?: string) {
  if (language === "ro") return "ro-RO";
  if (language === "en") return "en-US";
  return "ru-RU";
}

function currencyCode(currency: string) {
  return CURRENCY_CODE[String(currency || "MDL").toUpperCase()] || 498;
}

function cents(value: number) {
  return Math.round(Number(value || 0) * 100);
}

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function numericOrderId(order: PaymentProviderOrder) {
  const digits = order.orderNumber.replace(/\D/g, "");
  const suffix = String(order.id).slice(-4).padStart(4, "0");
  return Number(`${digits}${suffix}`.slice(-12));
}

function splitCustomerName(name: string) {
  const parts = clean(name, "Kimramen Customer").split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Kimramen",
    lastName: parts.slice(1).join(" ") || "Customer",
  };
}

function paynetSignature(params: {
  order: PaymentProviderOrder;
  expiryDate: string;
  amountInCents: number;
  firstServiceName: string;
}) {
  const { merchantId, secretKey, customerCode } = credentials();
  if (!secretKey) return "";

  const raw = [
    currencyCode(params.order.currency),
    "",
    customerCode,
    "Kimramen",
    params.expiryDate,
    params.order.orderNumber,
    merchantId,
    params.amountInCents,
    params.firstServiceName,
    params.firstServiceName,
    secretKey,
  ].join("");

  return crypto.createHash("md5").update(raw, "utf8").digest("base64");
}

async function fetchPaynetToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 20_000) return tokenCache.accessToken;

  const { username, password } = credentials();
  const payload = {
    grantType: process.env.PAYNET_GRANT_TYPE || "password",
    username,
    password,
  };

  const response = await fetch(`${paynetApiBaseUrl()}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  const token = data?.access_token || data?.accessToken || data?.token || data?.AccessToken;
  if (!response.ok || !token) throw new Error(data?.message || data?.error || "Paynet auth failed");

  tokenCache = {
    accessToken: String(token),
    expiresAt: now + Math.max(60, Number(data?.expires_in || data?.expiresIn || data?.ExpiresIn || 900) - 30) * 1000,
  };

  return tokenCache.accessToken;
}

function makeReturnUrl(orderNumber: string, failed = false, baseUrl?: string | null) {
  return makeAbsoluteUrl(`/api/payments/return?provider=paynet&order=${encodeURIComponent(orderNumber)}${failed ? "&failed=1" : ""}`, baseUrl);
}

function buildPaynetForm(order: PaymentProviderOrder, language?: string, baseUrl?: string | null) {
  const { merchantId, customerCode } = credentials();
  const amountInCents = cents(order.totalAmount);
  const expiryDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 19);
  const firstServiceName = order.items[0]?.productName || `Kimramen order ${order.orderNumber}`;
  const signature = paynetSignature({ order, expiryDate, amountInCents, firstServiceName });
  const successUrl = makeReturnUrl(order.orderNumber, false, baseUrl);
  const cancelUrl = makeReturnUrl(order.orderNumber, true, baseUrl);

  const fields: Record<string, string | number> = {
    ExternalDate: new Date().toISOString().slice(0, 19),
    ExternalID: order.orderNumber,
    Currency: currencyCode(order.currency),
    Merchant: merchantId,
    "Customer.Code": customerCode,
    "Customer.Name": "Kimramen",
    LinkUrlSuccess: successUrl,
    LinkUrlCancel: cancelUrl,
    ExpiryDate: expiryDate,
    Lang: toPaynetLang(language),
  };

  if (signature) fields.Signature = signature;

  fields["Services[0][Name]"] = firstServiceName;
  fields["Services[0][Description]"] = firstServiceName;
  fields["Services[0][Amount]"] = amountInCents;

  order.items.forEach((item, index) => {
    const code = clean(item.sku || item.productId || index + 1);
    fields[`Services[0][Products][${index}][LineNo]`] = index;
    fields[`Services[0][Products][${index}][Code]`] = code;
    fields[`Services[0][Products][${index}][Name]`] = clean(item.productName, "Kimramen product");
    fields[`Services[0][Products][${index}][Description]`] = clean(item.productName, "Kimramen product");
    fields[`Services[0][Products][${index}][Quantity]`] = item.quantity;
    fields[`Services[0][Products][${index}][UnitPrice]`] = cents(item.unitPrice);
  });

  return {
    redirectUrl: makeAbsoluteUrl(`/api/payments/paynet/redirect?order=${encodeURIComponent(order.orderNumber)}`, baseUrl),
    checkoutUrl: paynetCheckoutUrl(),
    fields,
    successUrl,
    cancelUrl,
  };
}

function buildApiPayload(order: PaymentProviderOrder, input: PaymentCreateInput) {
  const { customerCode, saleAreaCode } = credentials();
  const { firstName, lastName } = splitCustomerName(order.customerName);
  const fallbackSaleAreaCode = process.env.PAYNET_DEFAULT_SALE_AREA_CODE || "onlidocumentation_md";

  return {
    Order: numericOrderId(order),
    SaleAreaCode: saleAreaCode || fallbackSaleAreaCode,
    LinkUrlSuccess: makeReturnUrl(order.orderNumber, false, input.publicBaseUrl),
    LinkUrlCancel: makeReturnUrl(order.orderNumber, true, input.publicBaseUrl),
    MoneyType: process.env.PAYNET_MONEY_TYPE || "All",
    Customer: {
      Code: customerCode || order.customerPhone,
      NameFirst: firstName,
      NameLast: lastName,
      email: order.customerEmail || undefined,
      PhoneNumber: order.customerPhone,
    },
    Currency: currencyCode(order.currency),
    ExpiryDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    Lang: toPaynetLang(input.language).slice(0, 2).toUpperCase(),
    Services: [
      {
        Name: order.items[0]?.productName || `Kimramen order ${order.orderNumber}`,
        Description: `Kimramen order ${order.orderNumber}`,
        Amount: cents(order.totalAmount),
        Products: order.items.map((item, index) => ({
          LineNo: index,
          Code: item.sku || String(item.productId || index + 1),
          Name: item.productName,
          Description: item.productName,
          Quantity: item.quantity,
          UnitPrice: cents(item.unitPrice),
          Amount: cents(item.totalPrice),
          TotalAmount: cents(item.totalPrice),
        })),
      },
    ],
  };
}

async function tryServerSideCreate(order: PaymentProviderOrder, input: PaymentCreateInput, token: string) {
  const paths = (process.env.PAYNET_CREATE_PAYMENT_PATHS || process.env.PAYNET_CREATE_PAYMENT_PATH || "/api/order")
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);

  const payload = buildApiPayload(order, input);
  let lastData: unknown = null;
  let lastStatus = 0;

  for (const path of paths) {
    const url = `${paynetApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    lastData = { path, status: response.status, data };
    lastStatus = response.status;

    const redirectUrl =
      data?.redirectUrl ||
      data?.paymentUrl ||
      data?.paymentLink ||
      data?.url ||
      data?.LinkUrl ||
      data?.PaymentUrl ||
      data?.result?.redirectUrl ||
      data?.result?.paymentUrl ||
      data?.result?.paymentLink ||
      data?.object?.redirectUrl ||
      data?.object?.paymentUrl;
    const providerOrderId = data?.id || data?.paymentId || data?.order || data?.operationId || data?.OperationId || data?.result?.id || data?.object?.OperationId || null;

    if (response.ok && redirectUrl) {
      return { success: true as const, redirectUrl: String(redirectUrl), providerOrderId, payload, responsePayload: { path, data } };
    }
  }

  return { success: false as const, payload, status: lastStatus, responsePayload: lastData };
}

export async function createPaynetPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
  const order = await getOrderForPayment(input.orderId);
  if (!order) return { success: false, message: "Заказ не найден" };
  if (order.totalAmount <= 0) return { success: false, message: "Некорректная сумма заказа" };

  const formRedirect = buildPaynetForm(order, input.language, input.publicBaseUrl);
  const idempotencyKey = makeIdempotencyKey("paynet", order.orderNumber);
  const transactionId = await createPaymentTransaction({ order, provider: "paynet", idempotencyKey, requestPayload: formRedirect });

  try {
    const token = await fetchPaynetToken();

    if (process.env.PAYNET_USE_API_CREATE === "1") {
      const apiCreate = await tryServerSideCreate(order, input, token);
      if (apiCreate.success) {
        await markPaymentTransaction({
          transactionId,
          status: "redirected",
          providerOrderId: apiCreate.providerOrderId,
          redirectUrl: apiCreate.redirectUrl,
          responsePayload: apiCreate.responsePayload,
        });
        return { success: true, redirectUrl: apiCreate.redirectUrl, orderNumber: order.orderNumber, transactionId, provider: "paynet" };
      }

      await markPaymentTransaction({
        transactionId,
        status: "pending",
        responsePayload: apiCreate.responsePayload,
        failureReason: "Paynet API create did not return redirect URL; falling back to hosted form redirect",
      });
    }

    await markPaymentTransaction({
      transactionId,
      status: "redirected",
      providerOrderId: order.orderNumber,
      redirectUrl: formRedirect.redirectUrl,
      responsePayload: { auth: "ok", mode: "hosted_form_redirect", checkoutUrl: formRedirect.checkoutUrl },
    });

    return { success: true, redirectUrl: formRedirect.redirectUrl, orderNumber: order.orderNumber, transactionId, provider: "paynet" };
  } catch (error) {
    await markPaymentTransaction({ transactionId, status: "failed", failureReason: error instanceof Error ? error.message : "Paynet unknown error" });
    throw error;
  }
}

export async function getPaynetRedirectForm(orderNumber: string, baseUrl?: string | null) {
  const orderRows = await pool.query<any[]>(`SELECT id FROM orders WHERE order_number = ? LIMIT 1`, [orderNumber]);
  const orderId = Number(orderRows[0]?.id || 0);
  if (!orderId) return null;
  const order = await getOrderForPayment(orderId);
  if (!order) return null;
  return buildPaynetForm(order, "ru", baseUrl);
}

export async function refreshPaynetPaymentStatus(orderNumber: string) {
  const token = await fetchPaynetToken();
  const response = await fetch(`${paynetApiBaseUrl()}/api/Payments?ExternalID=${encodeURIComponent(orderNumber)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return { success: false, data, status: response.status };

  const payment = Array.isArray(data) ? data[0] : data;
  const rawStatus = payment?.Status ?? payment?.status ?? payment?.State ?? payment?.state;
  const providerStatus = normalizeProviderStatus("paynet", String(rawStatus || ""));
  const reference = payment?.OperationId || payment?.operationId || payment?.PaymentId || payment?.paymentId || null;

  if (rawStatus !== undefined) {
    await updateOrderPaymentStatus(orderNumber, "paynet", providerStatus, reference);
  }

  return { success: true, data: payment, providerStatus, reference };
}

export async function handlePaynetCallback(payload: any) {
  const orderNumber = String(
    payload.ExternalID ||
      payload.ExternalId ||
      payload.externalId ||
      payload.orderId ||
      payload.order_id ||
      payload.merchantOrderId ||
      payload.merchant_order_id ||
      payload.client_orderid ||
      ""
  );
  if (!orderNumber) return { success: false, status: 400, message: "Missing Paynet order id" };

  const providerStatus = normalizeProviderStatus("paynet", payload.Status || payload.status || payload.paymentStatus || payload.state);
  const reference = payload.OperationId || payload.operationId || payload.paymentId || payload.transactionId || payload.paynetOrderId || payload.orderid || null;

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<any[]>(
      `SELECT id FROM payment_transactions WHERE provider = 'paynet' AND order_number = ? ORDER BY id DESC LIMIT 1`,
      [orderNumber]
    );
    if (rows[0]?.id) {
      await markPaymentTransaction({
        transactionId: Number(rows[0].id),
        status: providerStatus as any,
        providerOrderId: reference,
        callbackPayload: payload,
      });
    }
  } finally {
    conn.release();
  }

  await updateOrderPaymentStatus(orderNumber, "paynet", providerStatus, reference);
  return { success: true, status: 200 };
}
