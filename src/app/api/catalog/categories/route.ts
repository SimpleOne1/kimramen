import { NextRequest, NextResponse } from "next/server";
import { CACHE_TAGS, getCached } from "@/src/lib/cache";
import { safeQuery } from "@/src/lib/db-safe";
import { logAppError } from "@/src/lib/logger";
import { isLocale, type Locale } from "@/src/lib/i18n/locale";

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string | null;
  sort_order: number | string | null;
  is_active: number | boolean;
  name: string | null;
};

function normalizeParentId(value: number | null) {
  if (value === null || Number(value) === 0) return null;
  return Number(value);
}

async function loadCategories(locale: Locale) {
  const rows = await safeQuery<CategoryRow[]>(
    `
    SELECT
      c.id,
      c.parent_id,
      c.slug,
      c.sort_order,
      c.is_active,
      ct.name
    FROM categories c
    LEFT JOIN category_translations ct
      ON ct.category_id = c.id AND ct.locale = ?
    WHERE c.is_active = 1
    ORDER BY
      CASE WHEN c.parent_id IS NULL OR c.parent_id = 0 THEN 0 ELSE 1 END ASC,
      c.sort_order ASC,
      ct.name ASC,
      c.id ASC
    `,
    [locale],
    { label: "catalog.categories.list" }
  );

  return rows.map((row) => ({
    id: Number(row.id),
    parentId: normalizeParentId(row.parent_id),
    slug: row.slug || String(row.id),
    name: row.name || row.slug || `Категория ${row.id}`,
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const requestedLocale = request.nextUrl.searchParams.get("locale");
    const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "ru";
    const categories = await getCached(`catalog:categories:list:${locale}`, () => loadCategories(locale), {
      ttlMs: 5 * 60_000,
      tags: [CACHE_TAGS.catalog, CACHE_TAGS.categories],
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    await logAppError("GET /api/catalog/categories", error);
    console.error("GET /api/catalog/categories error:", error);
    return NextResponse.json(
      { success: false, categories: [], message: "Не удалось загрузить категории" },
      { status: 500 }
    );
  }
}
