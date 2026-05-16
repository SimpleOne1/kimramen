import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";
import type { CurrentCustomer } from "@/src/lib/auth/customer";
import { sendOrderEmails } from "@/src/lib/email";
import { writeErrorLog } from "@/src/lib/server/error-log";

type CartInputItem = {
  id: number;
  quantity: number;
};

type CheckoutInput = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryCity?: string;
  deliveryStreet?: string;
  deliveryHouse?: string;
  deliveryApartment?: string;
  deliveryComment?: string;
  customerComment?: string;
  items?: CartInputItem[];
};

type ProductRow = {
  id: number;
  slug: string;
  sku: string | null;
  price: number | string;
  currency: string | null;
  main_image: string | null;
  syrve_image_url: string | null;
  stock_quantity: number | null;
  min_order_qty: number | null;
  name: string | null;
};

type OrderRow = {
  id: number;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_city: string | null;
  delivery_street: string | null;
  delivery_house: string | null;
  delivery_apartment: string | null;
  delivery_comment: string | null;
  customer_comment: string | null;
  subtotal_amount: number | string;
  delivery_amount: number | string;
  total_amount: number | string;
  currency: string;
  created_at: Date | string;
};

type OrderItemRow = {
  id: number;
  product_id: number | null;
  product_slug: string | null;
  product_name: string;
  product_image: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  currency: string;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function cleanRequiredText(value: unknown, maxLength: number) {
  return cleanText(value, maxLength) || "";
}

function normalizeItems(items: unknown): CartInputItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<number, number>();

  for (const item of items) {
    const id = Number((item as CartInputItem)?.id);
    const quantity = Math.max(1, Math.min(99, Math.floor(Number((item as CartInputItem)?.quantity || 1))));
    if (!Number.isFinite(id) || id <= 0) continue;
    map.set(id, (map.get(id) || 0) + quantity);
  }

  return Array.from(map.entries()).map(([id, quantity]) => ({ id, quantity: Math.min(quantity, 99) }));
}

function mapOrder(row: OrderRow, items: OrderItemRow[] = []) {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    deliveryCity: row.delivery_city,
    deliveryStreet: row.delivery_street,
    deliveryHouse: row.delivery_house,
    deliveryApartment: row.delivery_apartment,
    deliveryComment: row.delivery_comment,
    customerComment: row.customer_comment,
    subtotalAmount: Number(row.subtotal_amount || 0),
    deliveryAmount: Number(row.delivery_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    currency: row.currency || "MDL",
    createdAt: row.created_at,
    items: items.map((item) => ({
      id: Number(item.id),
      productId: item.product_id ? Number(item.product_id) : null,
      productSlug: item.product_slug,
      productName: item.product_name,
      productImage: item.product_image,
      sku: item.sku,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0),
      currency: item.currency || row.currency || "MDL",
    })),
  };
}

function makeOrderNumber() {
  const now = new Date();
  const datePart = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KR-${datePart}-${randomPart}`;
}

export async function createOrder(input: CheckoutInput, customer: CurrentCustomer | null) {
  await ensureAuthSchema();

  const items = normalizeItems(input.items);
  if (!items.length) {
    return { success: false as const, message: "Корзина пуста" };
  }

  const customerName = cleanRequiredText(input.customerName || customer?.defaultDeliveryName || customer?.firstName, 160);
  const customerPhone = cleanRequiredText(input.customerPhone || customer?.defaultDeliveryPhone || customer?.phone, 64);
  const customerEmail = cleanText(input.customerEmail || customer?.email, 190);

  if (!customerName) return { success: false as const, message: "Введите имя" };
  if (!customerPhone) return { success: false as const, message: "Введите телефон" };

  const ids = items.map((item) => item.id);
  const placeholders = ids.map(() => "?").join(",");
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const productRows = await conn.query<ProductRow[]>(
      `
      SELECT p.id, p.slug, p.sku, p.price, p.currency,
        COALESCE(NULLIF(p.main_image, ''), NULLIF(p.syrve_image_url, '')) AS main_image,
        p.syrve_image_url, p.stock_quantity, p.min_order_qty,
        pt.name
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1 AND p.id IN (${placeholders})
      `,
      ids
    );

    const products = new Map(productRows.map((product) => [Number(product.id), product]));
    if (products.size !== ids.length) {
      await conn.rollback();
      return { success: false as const, message: "Некоторые товары из корзины уже недоступны" };
    }

    const orderItems = items.map((item) => {
      const product = products.get(item.id)!;
      const minQty = Math.max(1, Number(product.min_order_qty || 1));
      const quantity = Math.max(item.quantity, minQty);
      const unitPrice = Number(product.price || 0);
      return {
        product,
        quantity,
        unitPrice,
        totalPrice: Number((unitPrice * quantity).toFixed(2)),
      };
    });

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
    const deliveryAmount = 0;
    const total = subtotal + deliveryAmount;
    const currency = orderItems[0]?.product.currency || "MDL";
    const orderNumber = makeOrderNumber();

    const result = await conn.query(
      `
      INSERT INTO orders (
        order_number, customer_id, status, customer_name, customer_email, customer_phone,
        delivery_city, delivery_street, delivery_house, delivery_apartment,
        delivery_comment, customer_comment, subtotal_amount, delivery_amount, total_amount, currency, source
      ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'site')
      `,
      [
        orderNumber,
        customer?.id || null,
        customerName,
        customerEmail,
        customerPhone,
        cleanText(input.deliveryCity || customer?.defaultDeliveryCity, 120),
        cleanText(input.deliveryStreet || customer?.defaultDeliveryStreet, 255),
        cleanText(input.deliveryHouse || customer?.defaultDeliveryHouse, 64),
        cleanText(input.deliveryApartment || customer?.defaultDeliveryApartment, 64),
        cleanText(input.deliveryComment || customer?.defaultDeliveryComment, 1000),
        cleanText(input.customerComment, 1000),
        subtotal,
        deliveryAmount,
        total,
        currency,
      ]
    );

    const orderId = Number(result.insertId);

    for (const item of orderItems) {
      await conn.query(
        `
        INSERT INTO order_items (
          order_id, product_id, product_slug, product_name, product_image, sku,
          quantity, unit_price, total_price, currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.product.id,
          item.product.slug,
          item.product.name || "Товар Kimramen",
          item.product.main_image,
          item.product.sku,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.product.currency || currency,
        ]
      );
    }

    if (customer?.id) {
      await conn.query(
        `
        UPDATE customers
        SET default_delivery_name = ?, default_delivery_phone = ?, default_delivery_city = ?,
          default_delivery_street = ?, default_delivery_house = ?, default_delivery_apartment = ?,
          default_delivery_comment = ?
        WHERE id = ?
        `,
        [
          customerName,
          customerPhone,
          cleanText(input.deliveryCity || customer.defaultDeliveryCity, 120),
          cleanText(input.deliveryStreet || customer.defaultDeliveryStreet, 255),
          cleanText(input.deliveryHouse || customer.defaultDeliveryHouse, 64),
          cleanText(input.deliveryApartment || customer.defaultDeliveryApartment, 64),
          cleanText(input.deliveryComment || customer.defaultDeliveryComment, 1000),
          customer.id,
        ]
      );
    }

    await conn.commit();

    try {
      await sendOrderEmails({
        orderId,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount: total,
        currency,
        items: orderItems.map((item) => ({
          productName: item.product.name || "Товар Kimramen",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });
    } catch (emailError) {
      await writeErrorLog("orders.createOrder.sendOrderEmails", emailError, { orderId, orderNumber });
    }

    return { success: true as const, orderId, orderNumber };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function getCustomerOrders(customerId: number) {
  await ensureAuthSchema();
  const conn = await pool.getConnection();

  try {
    const orders = await conn.query<OrderRow[]>(
      `
      SELECT *
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 50
      `,
      [customerId]
    );

    if (!orders.length) return [];

    const orderIds = orders.map((order) => Number(order.id));
    const placeholders = orderIds.map(() => "?").join(",");
    const rows = await conn.query<OrderItemRow[]>(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
      orderIds
    );

    const itemsByOrder = new Map<number, OrderItemRow[]>();
    for (const item of rows) {
      const list = itemsByOrder.get(Number((item as any).order_id)) || [];
      list.push(item);
      itemsByOrder.set(Number((item as any).order_id), list);
    }

    return orders.map((order) => mapOrder(order, itemsByOrder.get(Number(order.id)) || []));
  } finally {
    conn.release();
  }
}
