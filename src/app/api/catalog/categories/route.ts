import { NextResponse } from "next/server";
import pool from "@/src/lib/db";

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

export async function GET() {
  let conn;

  try {
    conn = await pool.getConnection();

    const rows = await conn.query<CategoryRow[]>(
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
        ON ct.category_id = c.id AND ct.locale = 'ru'
      WHERE c.is_active = 1
      ORDER BY
        CASE WHEN c.parent_id IS NULL OR c.parent_id = 0 THEN 0 ELSE 1 END ASC,
        c.sort_order ASC,
        ct.name ASC,
        c.id ASC
      `
    );

    const categories = rows.map((row) => ({
      id: Number(row.id),
      parentId: normalizeParentId(row.parent_id),
      slug: row.slug || String(row.id),
      name: row.name || row.slug || `Категория ${row.id}`,
      sortOrder: Number(row.sort_order || 0),
      isActive: Boolean(row.is_active),
    }));

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("GET /api/catalog/categories error:", error);
    return NextResponse.json(
      { success: false, categories: [], message: "Не удалось загрузить категории" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
