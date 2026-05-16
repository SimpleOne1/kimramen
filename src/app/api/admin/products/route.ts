import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

const LOCALES = ["ru", "en", "ro"] as const;

type AdminProductRow = {
  id: number;
  external_id: string | null;
  sku: string | null;
  slug: string;
  name: string | null;
  category: string | null;
  price: number | string;
  old_price: number | string | null;
  stock_quantity: number | null;
  net_weight_grams: number | null;
  weight_value: number | string | null;
  weight_unit: string | null;
  is_active: number | boolean;
  main_image: string | null;
  currency: string | null;
  brand: string | null;
  country_of_origin: string | null;
  last_synced_at: string | null;
};

type CountRow = { total: number | string };

type IdRow = { id: number };

export async function GET(request: NextRequest) {
  let conn;

  try {
    const guard = await requireAdmin("products:view");
    if (!guard.ok) return guard.response;

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.max(Number(searchParams.get("limit") || 25), 1);
    const q = (searchParams.get("q") || "").trim();
    const offset = (page - 1) * limit;

    conn = await pool.getConnection();

    const where = q
      ? `WHERE (pt.name LIKE ? OR p.sku LIKE ? OR p.slug LIKE ? OR p.brand LIKE ?)`
      : "";
    const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`] : [];

    const countRows = await conn.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      ${where}
      `,
      params
    );

    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await conn.query<AdminProductRow[]>(
      `
      SELECT
        p.id, p.external_id, p.sku, p.slug, p.price, p.old_price, p.currency,
        p.stock_quantity, p.net_weight_grams, p.weight_value, p.weight_unit,
        p.is_active, p.main_image, p.brand, p.country_of_origin, p.last_synced_at,
        pt.name AS name,
        (
          SELECT ct.name
          FROM product_categories pc
          INNER JOIN category_translations ct ON ct.category_id = pc.category_id AND ct.locale = 'ru'
          WHERE pc.product_id = p.id
          ORDER BY pc.category_id ASC
          LIMIT 1
        ) AS category
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const products = rows.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      sku: row.sku,
      slug: row.slug,
      name: row.name || "Без названия",
      category: row.category || null,
      price: Number(row.price || 0),
      oldPrice: row.old_price === null ? null : Number(row.old_price),
      stockQuantity: Number(row.stock_quantity || 0),
      weightGrams: row.net_weight_grams,
      weightValue: row.weight_value === null ? null : Number(row.weight_value),
      weightUnit: row.weight_unit,
      isActive: Boolean(row.is_active),
      mainImage: row.main_image,
      currency: row.currency || "MDL",
      brand: row.brand || null,
      countryOfOrigin: row.country_of_origin || null,
      lastSyncedAt: row.last_synced_at,
    }));

    return NextResponse.json({
      success: true,
      products,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    await logAppError("GET /api/admin/products", error);
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить товары" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request: NextRequest) {
  let conn;
  try {
    const guard = await requireAdmin("products:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const body = await request.json();
    const ruName = String(body?.translations?.ru?.name || body?.name || "Новый товар").trim();
    const slug = slugify(body?.slug || ruName);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const result = await conn.query(
      `
      INSERT INTO products (
        external_id, sku, slug, price, old_price, currency, stock_quantity,
        net_weight_grams, weight_value, weight_unit, is_active, main_image,
        brand, country_of_origin, sync_source, manual_fields, created_at, updated_at
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', JSON_ARRAY('manual_product'), NOW(), NOW())
      `,
      [
        body?.sku || null,
        slug,
        Number(body?.price || 0),
        body?.oldPrice === "" || body?.oldPrice === undefined ? null : Number(body?.oldPrice),
        body?.currency || "MDL",
        Number(body?.stockQuantity || 0),
        body?.netWeightGrams === "" || body?.netWeightGrams === undefined ? null : Number(body?.netWeightGrams),
        body?.weightValue === "" || body?.weightValue === undefined ? null : Number(body?.weightValue),
        body?.weightUnit || null,
        body?.isActive === false ? 0 : 1,
        body?.mainImage || null,
        body?.brand || null,
        body?.countryOfOrigin || null,
      ]
    );

    const insertId = Number(result.insertId);

    for (const locale of LOCALES) {
      const t = body?.translations?.[locale] || {};
      await conn.query(
        `
        INSERT INTO product_translations (product_id, locale, name, short_description, description, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          insertId,
          locale,
          String(t.name || ruName),
          t.shortDescription || null,
          t.description || null,
          t.metaTitle || null,
          t.metaDescription || null,
        ]
      );
    }

    if (Array.isArray(body?.categoryIds)) {
      for (const categoryId of body.categoryIds) {
        await conn.query(`INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)`, [insertId, Number(categoryId)]);
      }
    }

    await conn.commit();
    invalidateCatalogCache();
    invalidateAdminDashboardCache();
    return NextResponse.json({ success: true, id: insertId });
  } catch (error) {
    if (conn) await conn.rollback();
    await logAppError("POST /api/admin/products", error);
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ success: false, message: "Не удалось создать товар" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
