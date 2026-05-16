import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

const LOCALES = ["ru", "en", "ro"] as const;

const DEFAULT_CATEGORIES = [
  { name: "Рис", slug: "rice", sortOrder: 10 },
  { name: "Лапша", slug: "noodles", sortOrder: 20 },
  { name: "Соусы и пасты", slug: "sauces-pastes", sortOrder: 30 },
  { name: "Специи", slug: "spices", sortOrder: 40 },
  { name: "Снеки", slug: "snacks", sortOrder: 50 },
  { name: "Готовые блюда", slug: "ready-meals", sortOrder: 60 },
  { name: "Десерты", slug: "desserts", sortOrder: 70 },
  { name: "Напитки", slug: "drinks", sortOrder: 80 },
];

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string;
  sort_order: number | string | null;
  is_active: number | boolean;
  ru_name: string | null;
  ru_description: string | null;
  en_name: string | null;
  en_description: string | null;
  ro_name: string | null;
  ro_description: string | null;
  product_count: number | string | null;
};

function nullableParentId(value: unknown) {
  const id = Number(value || 0);
  return id > 0 ? id : null;
}

async function upsertTranslation(
  conn: any,
  categoryId: number,
  locale: string,
  name: string,
  description: string | null
) {
  await conn.query(
    `
    INSERT INTO category_translations (category_id, locale, name, description)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description)
    `,
    [categoryId, locale, name, description]
  );
}

export async function GET() {
  let conn;
  try {
    const guard = await requireAdmin("categories:view");
    if (!guard.ok) return guard.response;

    conn = await pool.getConnection();
    const rows = await conn.query<CategoryRow[]>(
      `
      SELECT
        c.id,
        c.parent_id,
        c.slug,
        c.sort_order,
        c.is_active,
        ru.name AS ru_name,
        ru.description AS ru_description,
        en.name AS en_name,
        en.description AS en_description,
        ro.name AS ro_name,
        ro.description AS ro_description,
        COUNT(DISTINCT pc.product_id) AS product_count
      FROM categories c
      LEFT JOIN category_translations ru ON ru.category_id = c.id AND ru.locale = 'ru'
      LEFT JOIN category_translations en ON en.category_id = c.id AND en.locale = 'en'
      LEFT JOIN category_translations ro ON ro.category_id = c.id AND ro.locale = 'ro'
      LEFT JOIN product_categories pc ON pc.category_id = c.id
      GROUP BY
        c.id, c.parent_id, c.slug, c.sort_order, c.is_active,
        ru.name, ru.description, en.name, en.description, ro.name, ro.description
      ORDER BY
        CASE WHEN c.parent_id IS NULL OR c.parent_id = 0 THEN 0 ELSE 1 END ASC,
        c.sort_order ASC,
        ru.name ASC,
        c.id ASC
      `
    );

    return NextResponse.json({
      success: true,
      categories: rows.map((row) => ({
        id: Number(row.id),
        parentId: row.parent_id === null ? null : Number(row.parent_id),
        slug: row.slug,
        name: row.ru_name || row.slug,
        sortOrder: Number(row.sort_order || 0),
        isActive: Boolean(row.is_active),
        productCount: Number(row.product_count || 0),
        translations: {
          ru: { name: row.ru_name || "", description: row.ru_description || "" },
          en: { name: row.en_name || "", description: row.en_description || "" },
          ro: { name: row.ro_name || "", description: row.ro_description || "" },
        },
      })),
    });
  } catch (error) {
    await logAppError("GET /api/admin/categories", error);
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить категории" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request: NextRequest) {
  let conn;
  try {
    const guard = await requireAdmin("categories:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const body = await request.json();

    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (body?.action === "seed") {
      for (const item of DEFAULT_CATEGORIES) {
        const exists = await conn.query<{ id: number }[]>(
          `SELECT id FROM categories WHERE slug = ? LIMIT 1`,
          [item.slug]
        );

        if (exists.length) continue;

        const result = await conn.query(
          `
          INSERT INTO categories (external_id, parent_id, slug, sort_order, is_active, sync_source, created_at, updated_at)
          VALUES (NULL, NULL, ?, ?, 1, 'manual', NOW(), NOW())
          `,
          [item.slug, item.sortOrder]
        );

        const categoryId = Number(result.insertId);
        await upsertTranslation(conn, categoryId, "ru", item.name, null);
        await upsertTranslation(conn, categoryId, "en", item.name, null);
        await upsertTranslation(conn, categoryId, "ro", item.name, null);
      }

      await conn.commit();
      invalidateCatalogCache();
      invalidateAdminDashboardCache();
      return NextResponse.json({ success: true });
    }

    const ruName = String(body?.translations?.ru?.name || body?.name || "Новая категория").trim();
    const slug = slugify(String(body?.slug || ruName));

    const result = await conn.query(
      `
      INSERT INTO categories (external_id, parent_id, slug, sort_order, is_active, sync_source, created_at, updated_at)
      VALUES (NULL, ?, ?, ?, ?, 'manual', NOW(), NOW())
      `,
      [nullableParentId(body?.parentId), slug, Number(body?.sortOrder || 0), body?.isActive === false ? 0 : 1]
    );

    const categoryId = Number(result.insertId);

    for (const locale of LOCALES) {
      const translation = body?.translations?.[locale] || {};
      await upsertTranslation(
        conn,
        categoryId,
        locale,
        String(translation.name || ruName),
        translation.description ? String(translation.description) : null
      );
    }

    await conn.commit();
    invalidateCatalogCache();
    invalidateAdminDashboardCache();
    return NextResponse.json({ success: true, id: categoryId });
  } catch (error) {
    if (conn) await conn.rollback();
    await logAppError("POST /api/admin/categories", error);
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось создать категорию" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(request: NextRequest) {
  let conn;
  try {
    const guard = await requireAdmin("categories:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const body = await request.json();
    const id = Number(body?.id || 0);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Не передан ID категории" },
        { status: 400 }
      );
    }

    const ruName = String(body?.translations?.ru?.name || body?.name || "Категория").trim();
    const slug = slugify(String(body?.slug || ruName));

    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE categories
      SET parent_id = ?, slug = ?, sort_order = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [nullableParentId(body?.parentId), slug, Number(body?.sortOrder || 0), body?.isActive === false ? 0 : 1, id]
    );

    for (const locale of LOCALES) {
      const translation = body?.translations?.[locale] || {};
      await upsertTranslation(
        conn,
        id,
        locale,
        String(translation.name || ruName),
        translation.description ? String(translation.description) : null
      );
    }

    await conn.commit();
    invalidateCatalogCache();
    invalidateAdminDashboardCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) await conn.rollback();
    await logAppError("PUT /api/admin/categories", error);
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось сохранить категорию" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
