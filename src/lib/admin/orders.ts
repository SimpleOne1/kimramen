import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";
import { ensurePaymentSchema } from "@/src/lib/payments/schema";
import { ORDER_STATUSES, type OrderStatus } from "@/src/lib/validation/orders";

export const ADMIN_ORDER_STATUSES = ORDER_STATUSES;
export type AdminOrderStatus = OrderStatus;

type OrderRow = {
  id: number;
  order_number: string;
  customer_id: number | null;
  status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_city: string | null;
  delivery_street: string | null;
  delivery_house: string | null;
  delivery_apartment: string | null;
  delivery_comment: string | null;
  customer_comment: string | null;
  manager_note: string | null;
  subtotal_amount: number | string;
  delivery_amount: number | string;
  total_amount: number | string;
  currency: string;
  source: string;
  payment_method?: string | null;
  payment_status?: string | null;
  paid_at?: Date | string | null;
  payment_reference?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  status_changed_at: Date | string | null;
  customer_account_email?: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_slug: string | null;
  product_name: string;
  product_image: string | null;
  sku: string | null;
  external_id: string | null;
  product_weight_grams: number | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  currency: string;
};

type CountRow = { count: number | string };
type SumRow = { sum: number | string | null };
type PaymentTransactionRow = {
  id: number | string;
  order_number: string;
  provider: string;
  status: string;
  provider_payment_id: string | null;
  provider_checkout_id: string | null;
  provider_order_id: string | null;
  failure_reason: string | null;
  updated_at: Date | string;
};

function money(value: number | string | null | undefined) {
  return Number(value || 0);
}

function mapOrder(row: OrderRow, items: OrderItemRow[] = [], paymentTransaction?: PaymentTransactionRow | null) {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    customerId: row.customer_id ? Number(row.customer_id) : null,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerAccountEmail: row.customer_account_email || null,
    deliveryCity: row.delivery_city,
    deliveryStreet: row.delivery_street,
    deliveryHouse: row.delivery_house,
    deliveryApartment: row.delivery_apartment,
    deliveryComment: row.delivery_comment,
    customerComment: row.customer_comment,
    managerNote: row.manager_note,
    subtotalAmount: money(row.subtotal_amount),
    deliveryAmount: money(row.delivery_amount),
    totalAmount: money(row.total_amount),
    currency: row.currency || "MDL",
    source: row.source,
    paymentMethod: row.payment_method || null,
    paymentStatus: row.payment_status || "unpaid",
    paidAt: row.paid_at || null,
    paymentReference: row.payment_reference || null,
    paymentTransaction: paymentTransaction
      ? {
          id: Number(paymentTransaction.id),
          provider: paymentTransaction.provider,
          status: paymentTransaction.status,
          providerPaymentId: paymentTransaction.provider_payment_id,
          providerCheckoutId: paymentTransaction.provider_checkout_id,
          providerOrderId: paymentTransaction.provider_order_id,
          failureReason: paymentTransaction.failure_reason,
          updatedAt: paymentTransaction.updated_at,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusChangedAt: row.status_changed_at,
    items: items.map((item) => ({
      id: Number(item.id),
      productId: item.product_id ? Number(item.product_id) : null,
      productSlug: item.product_slug,
      productName: item.product_name,
      productImage: item.product_image,
      sku: item.sku,
      externalId: item.external_id,
      productWeightGrams: item.product_weight_grams ? Number(item.product_weight_grams) : null,
      quantity: Number(item.quantity || 0),
      unitPrice: money(item.unit_price),
      totalPrice: money(item.total_price),
      currency: item.currency || row.currency || "MDL",
    })),
  };
}

function normalizeStatus(value: unknown): AdminOrderStatus | null {
  if (typeof value !== "string") return null;
  return ADMIN_ORDER_STATUSES.includes(value as AdminOrderStatus) ? (value as AdminOrderStatus) : null;
}

export async function getAdminOrders(options: { status?: string | null; search?: string | null; limit?: number } = {}) {
  await ensurePaymentSchema();

  const status = normalizeStatus(options.status);
  const search = typeof options.search === "string" ? options.search.trim() : "";
  const limit = Math.max(1, Math.min(Number(options.limit || 80), 200));
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (status) {
    where.push("o.status = ?");
    params.push(status);
  }

  if (search) {
    where.push("(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const conn = await pool.getConnection();

  try {
    const orders = await conn.query<OrderRow[]>(
      `
      SELECT o.*, c.email AS customer_account_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ${whereSql}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ?
      `,
      [...params, limit]
    );

    if (!orders.length) return [];

    const ids = orders.map((order) => Number(order.id));
    const placeholders = ids.map(() => "?").join(",");
    const items = await conn.query<OrderItemRow[]>(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
      ids
    );

    const itemsByOrder = new Map<number, OrderItemRow[]>();
    for (const item of items) {
      const orderId = Number(item.order_id);
      const list = itemsByOrder.get(orderId) || [];
      list.push(item);
      itemsByOrder.set(orderId, list);
    }

    const orderNumbers = orders.map((order) => order.order_number);
    const numberPlaceholders = orderNumbers.map(() => "?").join(",");
    const transactions = await conn.query<PaymentTransactionRow[]>(
      `
      SELECT pt.*
      FROM payment_transactions pt
      INNER JOIN (
        SELECT order_number, MAX(id) AS id
        FROM payment_transactions
        WHERE order_number IN (${numberPlaceholders})
        GROUP BY order_number
      ) latest ON latest.id = pt.id
      `,
      orderNumbers
    );
    const transactionByOrderNumber = new Map(transactions.map((transaction) => [transaction.order_number, transaction]));

    return orders.map((order) => mapOrder(order, itemsByOrder.get(Number(order.id)) || [], transactionByOrderNumber.get(order.order_number) || null));
  } finally {
    conn.release();
  }
}

export async function updateAdminOrder(orderId: number, data: { status?: AdminOrderStatus; managerNote?: string | null }, adminId: number) {
  await ensureAuthSchema();

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return { success: false as const, message: "Некорректный ID заказа" };
  }

  const updates: string[] = [];
  const params: Array<string | number | null> = [];

  if (data.status) {
    updates.push("status = ?", "status_changed_at = NOW()", "status_changed_by = ?");
    params.push(data.status, adminId);
  }

  if (typeof data.managerNote !== "undefined") {
    updates.push("manager_note = ?");
    params.push(data.managerNote || null);
  }

  if (!updates.length) {
    return { success: false as const, message: "Нет данных для обновления заказа" };
  }

  const conn = await pool.getConnection();
  try {
    const result = await conn.query(`UPDATE orders SET ${updates.join(", ")} WHERE id = ? LIMIT 1`, [...params, orderId]);
    if (Number(result.affectedRows || 0) < 1) {
      return { success: false as const, message: "Заказ не найден" };
    }
    return { success: true as const };
  } finally {
    conn.release();
  }
}

export async function updateAdminOrderStatus(orderId: number, nextStatus: unknown, adminId = 0) {
  const status = normalizeStatus(nextStatus);
  if (!status) return { success: false as const, message: "Некорректный статус заказа" };
  return updateAdminOrder(orderId, { status }, adminId);
}

export async function getAdminOrderDashboardStats() {
  await ensureAuthSchema();
  const conn = await pool.getConnection();

  try {
    const [newRows, confirmedRows, preparingRows, todayRows, revenueRows] = await Promise.all([
      conn.query<CountRow[]>(`SELECT COUNT(*) AS count FROM orders WHERE status = 'new'`),
      conn.query<CountRow[]>(`SELECT COUNT(*) AS count FROM orders WHERE status = 'confirmed'`),
      conn.query<CountRow[]>(`SELECT COUNT(*) AS count FROM orders WHERE status IN ('confirmed','preparing','ready','delivering')`),
      conn.query<CountRow[]>(`SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()`),
      conn.query<SumRow[]>(`SELECT SUM(total_amount) AS sum FROM orders WHERE status <> 'cancelled_by_manager' AND DATE(created_at) = CURDATE()`),
    ]);

    return {
      newOrders: Number(newRows[0]?.count || 0),
      confirmedOrders: Number(confirmedRows[0]?.count || 0),
      activeOrders: Number(preparingRows[0]?.count || 0),
      todayOrders: Number(todayRows[0]?.count || 0),
      todayRevenue: Number(revenueRows[0]?.sum || 0),
    };
  } finally {
    conn.release();
  }
}
