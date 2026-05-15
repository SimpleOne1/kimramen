import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";

type Params = { params: Promise<{ id: string }> };

type ProductRow = {
  id: number;
  slug: string;
  main_image: string | null;
  price: number | string;
  currency: string | null;
  stock_quantity: number | null;
  min_order_qty: number | null;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  net_weight_grams: number | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
};

export async function GET(request: NextRequest, { params }: Params) {
  let conn;

  try {
    const { id } = await params;
    const categoryId = Number(id);
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 12), 1), 48);

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, products: [], message: "Некорректная категория" }, { status: 400 });
    }

    conn = await pool.getConnection();

    const rows = await conn.query<ProductRow[]>(
      `
      WITH RECURSIVE category_tree AS (
        SELECT id FROM categories WHERE id = ? AND is_active = 1
        UNION ALL
        SELECT c.id
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = 1
      )
      SELECT DISTINCT
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
        pt.name,
        pt.short_description,
        pt.description
      FROM products p
      INNER JOIN product_categories pc ON pc.product_id = p.id
      INNER JOIN category_tree tree ON tree.id = pc.category_id
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1
      ORDER BY p.id DESC
      LIMIT ?
      `,
      [categoryId, limit]
    );

    const products = rows.map((row) => ({
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
      net_weight_grams: row.net_weight_grams,
      translations: {
        name: row.name || "Товар KimRamen",
        short_description: row.short_description,
        description: row.description,
      },
    }));

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("GET /api/catalog/categories/[id]/products error:", error);
    return NextResponse.json(
      { success: false, products: [], message: "Не удалось загрузить товары категории" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
