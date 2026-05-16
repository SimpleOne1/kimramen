import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";
import type { Product } from "@/src/models/product";

export type FavoriteProduct = Product & {
  favoriteAddedAt: string | null;
};

type FavoriteRow = {
  id: number;
  slug: string;
  main_image: string | null;
  price: number | string;
  currency: string;
  stock_quantity: number;
  min_order_qty: number;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  net_weight_grams: number | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
  favorite_added_at: Date | string | null;
};

function normalizeProduct(row: FavoriteRow): FavoriteProduct {
  return {
    id: Number(row.id),
    slug: row.slug,
    main_image: row.main_image,
    price: Number(row.price || 0),
    currency: row.currency || "MDL",
    stock_quantity: Number(row.stock_quantity || 0),
    min_order_qty: Number(row.min_order_qty || 1),
    country_of_origin: row.country_of_origin,
    brand: row.brand,
    manufacturer: row.manufacturer,
    net_weight_grams: row.net_weight_grams === null ? null : Number(row.net_weight_grams),
    favoriteAddedAt: row.favorite_added_at ? String(row.favorite_added_at) : null,
    translations: {
      name: row.name || "Товар Kimramen",
      short_description: row.short_description,
      description: row.description,
    },
  };
}

export async function getCustomerFavoriteProductIds(customerId: number) {
  await ensureAuthSchema();

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<Array<{ product_id: number }>>(
      `SELECT product_id FROM customer_favorites WHERE customer_id = ?`,
      [customerId]
    );

    return rows.map((row) => Number(row.product_id));
  } finally {
    conn.release();
  }
}

export async function getCustomerFavorites(customerId: number, locale: "ru" | "en" | "ro" = "ru") {
  await ensureAuthSchema();

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<FavoriteRow[]>(
      `
      SELECT
        p.id,
        p.slug,
        COALESCE(NULLIF(p.main_image, ''), NULLIF(p.syrve_image_url, '')) AS main_image,
        p.price,
        p.currency,
        p.stock_quantity,
        p.min_order_qty,
        p.country_of_origin,
        p.brand,
        p.manufacturer,
        p.net_weight_grams,
        t.name,
        t.short_description,
        t.description,
        f.created_at AS favorite_added_at
      FROM customer_favorites f
      INNER JOIN products p ON p.id = f.product_id
      LEFT JOIN product_translations t ON t.product_id = p.id AND t.locale = ?
      WHERE f.customer_id = ? AND p.is_active = 1
      ORDER BY f.created_at DESC
      `,
      [locale, customerId]
    );

    return rows.map(normalizeProduct);
  } finally {
    conn.release();
  }
}

export async function isProductFavorite(customerId: number, productId: number) {
  await ensureAuthSchema();

  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<Array<{ id: number }>>(
      `SELECT id FROM customer_favorites WHERE customer_id = ? AND product_id = ? LIMIT 1`,
      [customerId, productId]
    );

    return Boolean(rows[0]);
  } finally {
    conn.release();
  }
}

export async function addCustomerFavorite(customerId: number, productId: number) {
  await ensureAuthSchema();

  const conn = await pool.getConnection();
  try {
    const products = await conn.query<Array<{ id: number }>>(
      `SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1`,
      [productId]
    );

    if (!products[0]) {
      return { success: false as const, message: "Товар не найден" };
    }

    await conn.query(
      `
      INSERT INTO customer_favorites (customer_id, product_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = created_at
      `,
      [customerId, productId]
    );

    return { success: true as const };
  } finally {
    conn.release();
  }
}

export async function removeCustomerFavorite(customerId: number, productId: number) {
  await ensureAuthSchema();

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `DELETE FROM customer_favorites WHERE customer_id = ? AND product_id = ?`,
      [customerId, productId]
    );

    return { success: true as const };
  } finally {
    conn.release();
  }
}
