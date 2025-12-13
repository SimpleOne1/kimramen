// src/models/product.ts
import db from "../services/database";

export interface ProductTranslation {
  name: string;
  short_description: string | null;
  description: string | null;
}

export interface Product {
  id: number;
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
  locale: "ru" | "en" = "ru"
): Promise<Product[]> {
  const conn = await db.getConnection();

  const rows = await conn.query(
    `
      SELECT 
        p.id,
        p.slug,
        p.main_image,
        p.price,
        p.currency,
        p.stock_quantity,
        p.min_order_qty,
        p.country_of_origin,
        p.brand,
        p.manufacturer,
        p.net_weight_grams,         -- 👈 ВЫТАСКИВАЕМ ИЗ БД
        t.name,
        t.short_description,
        t.description
      FROM products p
      LEFT JOIN product_translations t
        ON p.id = t.product_id AND t.locale = ?
      WHERE p.is_active = 1
      ORDER BY p.id DESC
    `,
    [locale]
  );

  conn.release();

  // Преобразуем в аккуратный объект с вложенным translations
  return rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    main_image: row.main_image,
    price: Number(row.price),
    currency: row.currency,
    stock_quantity: row.stock_quantity,
    min_order_qty: row.min_order_qty,
    country_of_origin: row.country_of_origin,
    brand: row.brand,
    manufacturer: row.manufacturer,
    net_weight_grams: row.net_weight_grams,    // 👈 ПРОКИДЫВАЕМ В МОДЕЛЬ
    translations: {
      name: row.name,
      short_description: row.short_description,
      description: row.description,
    },
  }));
}