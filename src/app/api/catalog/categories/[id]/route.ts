import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";

type Params = { params: Promise<{ id: string }> };

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string | null;
  sort_order: number | string | null;
  name: string | null;
  description: string | null;
};

export async function GET(_request: NextRequest, { params }: Params) {
  let conn;

  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, message: "Некорректная категория" }, { status: 400 });
    }

    conn = await pool.getConnection();
    const rows = await conn.query<CategoryRow[]>(
      `
      SELECT c.id, c.parent_id, c.slug, c.sort_order, ct.name, ct.description
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
      WHERE c.id = ? AND c.is_active = 1
      LIMIT 1
      `,
      [categoryId]
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, message: "Категория не найдена" }, { status: 404 });
    }

    const row = rows[0];

    return NextResponse.json({
      success: true,
      category: {
        id: Number(row.id),
        parentId: row.parent_id === null || Number(row.parent_id) === 0 ? null : Number(row.parent_id),
        slug: row.slug || String(row.id),
        name: row.name || row.slug || `Категория ${row.id}`,
        description: row.description || null,
        sortOrder: Number(row.sort_order || 0),
      },
    });
  } catch (error) {
    console.error("GET /api/catalog/categories/[id] error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить категорию" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
