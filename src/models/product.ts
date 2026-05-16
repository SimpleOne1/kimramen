// src/models/product.ts
import { safeQuery } from "@/src/lib/db-safe";

export interface ProductTranslation {
  name: string;
  short_description: string | null;
  description: string | null;
}

export interface Product {
  id: number;
  sku?: string | null;
  slug: string;
  main_image: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  min_order_qty: number;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  net_weight_grams: number | null;   // 👈 ДОБАВИЛИ
  translations: ProductTranslation;
}

/**
 * Получаем все активные товары с переводом на нужную локаль.
 * locale: 'ru' | 'en'
 */
export async function getAllProducts(
  locale: "ru" | "en" | "ro" = "ru"
): Promise<Product[]> {
  const rows = await safeQuery<any[]>(
    `
      SELECT 
        p.id,
        p.sku,
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
        t.description
      FROM products p
      LEFT JOIN product_translations t
        ON p.id = t.product_id AND t.locale = ?
      WHERE p.is_active = 1
      ORDER BY p.id DESC
    `,
    [locale],
    { label: "products.public.all" }
  );

  return rows.map((row: any) => ({
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    main_image: row.main_image,
    price: Number(row.price),
    currency: row.currency,
    stock_quantity: row.stock_quantity,
    min_order_qty: row.min_order_qty,
    country_of_origin: row.country_of_origin,
    brand: row.brand,
    manufacturer: row.manufacturer,
    net_weight_grams: row.net_weight_grams,
    translations: {
      name: row.name,
      short_description: row.short_description,
      description: row.description,
    },
  }));
}
