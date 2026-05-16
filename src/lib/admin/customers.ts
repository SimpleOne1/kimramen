import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

type CustomerRow = {
  id: number;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  default_delivery_name: string | null;
  default_delivery_phone: string | null;
  default_delivery_city: string | null;
  default_delivery_street: string | null;
  default_delivery_house: string | null;
  default_delivery_apartment: string | null;
  default_delivery_comment: string | null;
  auth_provider: string;
  is_active: number | boolean;
  last_login_at: Date | string | null;
  created_at: Date | string;
  orders_count: number | string;
  total_spent: number | string | null;
  last_order_at: Date | string | null;
};

type CustomerOrderRow = {
  id: number;
  customer_id: number | null;
  order_number: string;
  status: string;
  total_amount: number | string;
  currency: string;
  created_at: Date | string;
};

function mapCustomer(row: CustomerRow, orders: CustomerOrderRow[] = []) {
  return {
    id: Number(row.id),
    email: row.email,
    phone: row.phone,
    firstName: row.first_name,
    lastName: row.last_name,
    defaultDeliveryName: row.default_delivery_name,
    defaultDeliveryPhone: row.default_delivery_phone,
    defaultDeliveryCity: row.default_delivery_city,
    defaultDeliveryStreet: row.default_delivery_street,
    defaultDeliveryHouse: row.default_delivery_house,
    defaultDeliveryApartment: row.default_delivery_apartment,
    defaultDeliveryComment: row.default_delivery_comment,
    authProvider: row.auth_provider,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    ordersCount: Number(row.orders_count || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrderAt: row.last_order_at,
    recentOrders: orders.map((order) => ({
      id: Number(order.id),
      orderNumber: order.order_number,
      status: order.status,
      totalAmount: Number(order.total_amount || 0),
      currency: order.currency || "MDL",
      createdAt: order.created_at,
    })),
  };
}

export async function getAdminCustomers(options: { search?: string | null; limit?: number } = {}) {
  await ensureAuthSchema();

  const search = typeof options.search === "string" ? options.search.trim() : "";
  const limit = Math.max(1, Math.min(Number(options.limit || 80), 200));
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (search) {
    where.push("(c.email LIKE ? OR c.phone LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.default_delivery_name LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const conn = await pool.getConnection();

  try {
    const customers = await conn.query<CustomerRow[]>(
      `
      SELECT
        c.*,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      ${whereSql}
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ?
      `,
      [...params, limit]
    );

    if (!customers.length) return [];

    const ids = customers.map((customer) => Number(customer.id));
    const placeholders = ids.map(() => "?").join(",");
    const recentOrders = await conn.query<CustomerOrderRow[]>(
      `
      SELECT id, customer_id, order_number, status, total_amount, currency, created_at
      FROM orders
      WHERE customer_id IN (${placeholders})
      ORDER BY created_at DESC, id DESC
      `,
      ids
    );

    const ordersByCustomer = new Map<number, CustomerOrderRow[]>();
    for (const order of recentOrders) {
      const customerId = Number(order.customer_id || 0);
      const list = ordersByCustomer.get(customerId) || [];
      if (list.length < 5) list.push(order);
      ordersByCustomer.set(customerId, list);
    }

    return customers.map((customer) => mapCustomer(customer, ordersByCustomer.get(Number(customer.id)) || []));
  } finally {
    conn.release();
  }
}
