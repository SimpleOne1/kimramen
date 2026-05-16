import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/auth/admin-guard";

import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

const LOCALES = ["ru", "en", "ro"] as const;

type Params = { params: Promise<{ id: string }> };

type ProductRow = Record<string, any>;
type TranslationRow = Record<string, any>;
type CategoryRow = { category_id: number };
type ImageRow = Record<string, any>;

function parseManualFields(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try { return JSON.parse(String(value)); } catch { return []; }
}

function mergeManualFields(current: unknown, next: string[]) {
  return JSON.stringify(Array.from(new Set([...parseManualFields(current), ...next])));
}

export async function GET(_request: NextRequest, { params }: Params) {
  let conn;
  try {
    const guard = await requireAdmin("products:view");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    conn = await pool.getConnection();

    const rows = await conn.query<ProductRow[]>(`SELECT * FROM products WHERE id = ? LIMIT 1`, [Number(id)]);
    if (!rows.length) return NextResponse.json({ success: false, message: "Товар не найден" }, { status: 404 });

    const translationsRows = await conn.query<TranslationRow[]>(
      `SELECT * FROM product_translations WHERE product_id = ?`,
      [Number(id)]
    );
    const categoryRows = await conn.query<CategoryRow[]>(
      `SELECT category_id FROM product_categories WHERE product_id = ? ORDER BY category_id ASC`,
      [Number(id)]
    );
    const images = await conn.query<ImageRow[]>(
      `SELECT id, path, alt_text, sort_order, is_main FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [Number(id)]
    );

    const translations: Record<string, any> = {};
    for (const locale of LOCALES) {
      const row = translationsRows.find((item) => item.locale === locale);
      translations[locale] = {
        name: row?.name || "",
        shortDescription: row?.short_description || "",
        description: row?.description || "",
        metaTitle: row?.meta_title || "",
        metaDescription: row?.meta_description || "",
      };
    }

    return NextResponse.json({
      success: true,
      product: {
        id: rows[0].id,
        externalId: rows[0].external_id,
        sku: rows[0].sku,
        barcode: rows[0].barcode,
        slug: rows[0].slug,
        price: Number(rows[0].price || 0),
        oldPrice: rows[0].old_price === null ? null : Number(rows[0].old_price),
        currency: rows[0].currency || "MDL",
        stockQuantity: Number(rows[0].stock_quantity || 0),
        minOrderQty: Number(rows[0].min_order_qty || 1),
        netWeightGrams: rows[0].net_weight_grams,
        weightValue: rows[0].weight_value === null ? null : Number(rows[0].weight_value),
        weightUnit: rows[0].weight_unit,
        isActive: Boolean(rows[0].is_active),
        mainImage: rows[0].main_image,
        brand: rows[0].brand,
        manufacturer: rows[0].manufacturer,
        countryOfOrigin: rows[0].country_of_origin,
        syncSource: rows[0].sync_source,
        lastSyncedAt: rows[0].last_synced_at,
        manualFields: parseManualFields(rows[0].manual_fields),
        translations,
        categoryIds: categoryRows.map((row) => row.category_id),
        images: images.map((image) => ({
          id: image.id,
          path: image.path,
          altText: image.alt_text,
          sortOrder: Number(image.sort_order || 0),
          isMain: Boolean(image.is_main),
        })),
      },
    });
  } catch (error) {
    await logAppError("GET /api/admin/products/[id]", error);
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить товар" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  let conn;
  try {
    const guard = await requireAdmin("products:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const { id } = await params;
    const body = await request.json();
    const productId = Number(id);
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const existingRows = await conn.query<ProductRow[]>(`SELECT manual_fields FROM products WHERE id = ? LIMIT 1`, [productId]);
    if (!existingRows.length) return NextResponse.json({ success: false, message: "Товар не найден" }, { status: 404 });

    const manualFields = mergeManualFields(existingRows[0].manual_fields, [
      "sku", "slug", "price", "old_price", "stock_quantity", "weight", "brand", "country_of_origin",
      "main_image", "categories", "images", "is_active", "manual_edit",
      ...LOCALES.map((locale) => `name_${locale}`),
      ...LOCALES.map((locale) => `description_${locale}`),
      ...LOCALES.map((locale) => `seo_${locale}`),
    ]);

    await conn.query(
      `
      UPDATE products SET
        sku = ?, barcode = ?, slug = ?, price = ?, old_price = ?, currency = ?, stock_quantity = ?,
        min_order_qty = ?, net_weight_grams = ?, weight_value = ?, weight_unit = ?, is_active = ?,
        main_image = ?, brand = ?, manufacturer = ?, country_of_origin = ?, manual_fields = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [
        body.sku || null,
        body.barcode || null,
        body.slug,
        Number(body.price || 0),
        body.oldPrice === "" || body.oldPrice === null || body.oldPrice === undefined ? null : Number(body.oldPrice),
        body.currency || "MDL",
        Number(body.stockQuantity || 0),
        Number(body.minOrderQty || 1),
        body.netWeightGrams === "" || body.netWeightGrams === null || body.netWeightGrams === undefined ? null : Number(body.netWeightGrams),
        body.weightValue === "" || body.weightValue === null || body.weightValue === undefined ? null : Number(body.weightValue),
        body.weightUnit || null,
        body.isActive ? 1 : 0,
        body.mainImage || null,
        body.brand || null,
        body.manufacturer || null,
        body.countryOfOrigin || null,
        manualFields,
        productId,
      ]
    );

    for (const locale of LOCALES) {
      const t = body.translations?.[locale] || {};
      await conn.query(
        `
        INSERT INTO product_translations (product_id, locale, name, short_description, description, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          short_description = VALUES(short_description),
          description = VALUES(description),
          meta_title = VALUES(meta_title),
          meta_description = VALUES(meta_description)
        `,
        [productId, locale, t.name || "", t.shortDescription || null, t.description || null, t.metaTitle || null, t.metaDescription || null]
      );
    }

    await conn.query(`DELETE FROM product_categories WHERE product_id = ?`, [productId]);
    for (const categoryId of body.categoryIds || []) {
      await conn.query(`INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, Number(categoryId)]);
    }

    if (Array.isArray(body.images)) {
      await conn.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);
      for (const [index, image] of body.images.entries()) {
        await conn.query(
          `INSERT INTO product_images (product_id, path, alt_text, sort_order, is_main) VALUES (?, ?, ?, ?, ?)`,
          [productId, image.path, image.altText || null, Number(image.sortOrder ?? index), image.isMain ? 1 : 0]
        );
      }
    }

    await conn.commit();
    invalidateCatalogCache();
    invalidateAdminDashboardCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) await conn.rollback();
    await logAppError("PUT /api/admin/products/[id]", error);
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, message: "Не удалось сохранить товар" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
