import crypto from "crypto";
import pool from "@/src/lib/db";
import { ensurePaymentSchema } from "@/src/lib/payments/schema";
import type { PaymentProviderOrder } from "@/src/lib/payments/types";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function makeAbsoluteUrl(path: string) {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function makeIdempotencyKey(provider: string, orderNumber: string) {
  return `${provider}-${orderNumber}-${crypto.randomBytes(8).toString("hex")}`;
}

export function safeJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function normalizeProviderStatus(provider: string, rawStatus: unknown) {
  const status = String(rawStatus || "").toLowerCase();

  if (provider === "paynet" && ["4", "paid", "approved", "success", "completed"].includes(status)) return "paid";
  if (provider === "paynet" && ["0", "1", "2", "3"].includes(status)) return "pending";
  if (provider === "paynet" && ["5", "6", "7", "8", "9"].includes(status)) return "failed";

  if (["executed", "completed", "paid", "success", "approved", "settled"].includes(status)) return "paid";
  if (["failed", "declined", "error", "rejected", "timeout"].includes(status)) return "failed";
  if (["cancelled", "canceled", "abandoned", "expired"].includes(status)) return "cancelled";
  if (["refunded", "reversed", "refund"].includes(status)) return "refunded";
  if (["waitingforinit", "initialized", "paymentmethodselected", "pending", "processing", "in_progress"].includes(status)) return "pending";

  return provider === "paynet" && status.includes("approved") ? "paid" : "unknown";
}

export async function getOrderForPayment(orderId: number): Promise<PaymentProviderOrder | null> {
  await ensurePaymentSchema();
  const conn = await pool.getConnection();

  try {
    const orders = await conn.query<any[]>(
      `
      SELECT id, order_number, customer_name, customer_email, customer_phone,
        subtotal_amount, delivery_amount, total_amount, currency
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [orderId]
    );

    if (!orders.length) return null;
    const order = orders[0];
    const items = await conn.query<any[]>(
      `
      SELECT product_id, sku, product_name, quantity, unit_price, total_price, currency
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
      `,
      [orderId]
    );

    return {
      id: Number(order.id),
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      totalAmount: Number(order.total_amount || 0),
      subtotalAmount: Number(order.subtotal_amount || 0),
      deliveryAmount: Number(order.delivery_amount || 0),
      currency: order.currency || "MDL",
      items: items.map((item) => ({
        productId: item.product_id ? Number(item.product_id) : null,
        sku: item.sku,
        productName: item.product_name,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unit_price || 0),
        totalPrice: Number(item.total_price || 0),
        currency: item.currency || order.currency || "MDL",
      })),
    };
  } finally {
    conn.release();
  }
}

export async function createPaymentTransaction(params: {
  order: PaymentProviderOrder;
  provider: "maib" | "paynet";
  idempotencyKey: string;
  requestPayload: unknown;
}) {
  await ensurePaymentSchema();
  const conn = await pool.getConnection();

  try {
    const result = await conn.query(
      `
      INSERT INTO payment_transactions (
        order_id, order_number, provider, status, amount, currency, idempotency_key, request_payload
      ) VALUES (?, ?, ?, 'created', ?, ?, ?, ?)
      `,
      [params.order.id, params.order.orderNumber, params.provider, params.order.totalAmount, params.order.currency, params.idempotencyKey, safeJson(params.requestPayload)]
    );

    await conn.query(
      `UPDATE orders SET payment_method = ?, payment_status = 'pending' WHERE id = ?`,
      [params.provider, params.order.id]
    );

    return Number(result.insertId);
  } finally {
    conn.release();
  }
}

export async function markPaymentTransaction(params: {
  transactionId: number;
  status: "created" | "pending" | "redirected" | "paid" | "failed" | "cancelled" | "refunded" | "unknown";
  providerCheckoutId?: string | null;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  redirectUrl?: string | null;
  responsePayload?: unknown;
  callbackPayload?: unknown;
  failureReason?: string | null;
}) {
  await ensurePaymentSchema();
  const conn = await pool.getConnection();

  try {
    await conn.query(
      `
      UPDATE payment_transactions
      SET status = ?,
        provider_checkout_id = COALESCE(?, provider_checkout_id),
        provider_payment_id = COALESCE(?, provider_payment_id),
        provider_order_id = COALESCE(?, provider_order_id),
        redirect_url = COALESCE(?, redirect_url),
        response_payload = COALESCE(?, response_payload),
        callback_payload = COALESCE(?, callback_payload),
        failure_reason = COALESCE(?, failure_reason),
        paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
      WHERE id = ?
      `,
      [
        params.status,
        params.providerCheckoutId || null,
        params.providerPaymentId || null,
        params.providerOrderId || null,
        params.redirectUrl || null,
        params.responsePayload === undefined ? null : safeJson(params.responsePayload),
        params.callbackPayload === undefined ? null : safeJson(params.callbackPayload),
        params.failureReason || null,
        params.status,
        params.transactionId,
      ]
    );
  } finally {
    conn.release();
  }
}

export async function updateOrderPaymentStatus(orderNumber: string, provider: string, providerStatus: string, reference?: string | null) {
  await ensurePaymentSchema();
  const conn = await pool.getConnection();

  try {
    const orderPaymentStatus = providerStatus === "paid" ? "paid" : providerStatus === "failed" ? "failed" : providerStatus === "cancelled" ? "cancelled" : providerStatus === "refunded" ? "refunded" : "pending";
    const orderStatus = providerStatus === "paid" ? "confirmed" : providerStatus === "cancelled" || providerStatus === "failed" ? "cancelled_by_manager" : null;

    await conn.query(
      `
      UPDATE orders
      SET payment_method = ?, payment_status = ?, payment_reference = COALESCE(?, payment_reference),
        paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
        status = CASE WHEN ? IS NULL THEN status ELSE ? END
      WHERE order_number = ?
      `,
      [provider, orderPaymentStatus, reference || null, providerStatus, orderStatus, orderStatus, orderNumber]
    );
  } finally {
    conn.release();
  }
}
