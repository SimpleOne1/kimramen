import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";

type AdminProductRow = {
  id: number;
  external_id: string | null;
  sku: string | null;
  slug: string;
  name: string | null;
  category: string | null;
  price: number | string;
  stock_quantity: number | null;
  net_weight_grams: number | null;
  is_active: number | boolean;
  main_image: string | null;
  currency: string | null;
  brand: string | null;
  country_of_origin: string | null;
};

type CountRow = {
  total: number | string;
};

export async function GET(request: NextRequest) {
  let conn;

  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.max(Number(searchParams.get("limit") || 25), 1);
    const offset = (page - 1) * limit;

    conn = await pool.getConnection();

    const countRows = await conn.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM products p
      `
    );

    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await conn.query<AdminProductRow[]>(
      `
      SELECT
        p.id,
        p.external_id,
        p.sku,
        p.slug,
        p.price,
        p.currency,
        p.stock_quantity,
        p.net_weight_grams,
        p.is_active,
        p.main_image,
        p.brand,
        p.country_of_origin,
        pt.name AS name,
        (
          SELECT ct.name
          FROM product_categories pc
          INNER JOIN category_translations ct
            ON ct.category_id = pc.category_id
           AND ct.locale = 'ru'
          WHERE pc.product_id = p.id
          ORDER BY pc.category_id ASC
          LIMIT 1
        ) AS category
      FROM products p
      LEFT JOIN product_translations pt
        ON pt.product_id = p.id
       AND pt.locale = 'ru'
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const products = rows.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      sku: row.sku,
      slug: row.slug,
      name: row.name || "Без названия",
      category: row.category || null,
      price: Number(row.price || 0),
      stockQuantity: Number(row.stock_quantity || 0),
      weightGrams: row.net_weight_grams,
      isActive: Boolean(row.is_active),
      mainImage: row.main_image,
      currency: row.currency || "EUR",
      brand: row.brand || null,
      countryOfOrigin: row.country_of_origin || null,
    }));

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Не удалось загрузить товары",
      },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}