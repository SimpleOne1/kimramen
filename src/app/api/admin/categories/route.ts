import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";

export async function GET() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query<any[]>(
      `
      SELECT c.id, c.parent_id, c.slug, c.sort_order, c.is_active, ct.name
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
      ORDER BY c.sort_order ASC, ct.name ASC
      `
    );
    return NextResponse.json({ success: true, categories: rows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      slug: row.slug,
      name: row.name || row.slug,
      sortOrder: Number(row.sort_order || 0),
      isActive: Boolean(row.is_active),
    })) });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить категории" }, { status: 500 });
  } finally { if (conn) conn.release(); }
}

export async function POST(request: NextRequest) {
  let conn;
  try {
    const body = await request.json();
    const name = String(body.name || "Новая категория").trim();
    const slug = slugify(body.slug || name);
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const result = await conn.query(
      `INSERT INTO categories (external_id, parent_id, slug, sort_order, is_active, sync_source, created_at, updated_at) VALUES (NULL, ?, ?, ?, ?, 'manual', NOW(), NOW())`,
      [body.parentId || null, slug, Number(body.sortOrder || 0), body.isActive === false ? 0 : 1]
    );
    const id = Number(result.insertId);
    for (const locale of ["ru", "en", "ro"]) {
      await conn.query(
        `INSERT INTO category_translations (category_id, locale, name, description) VALUES (?, ?, ?, ?)`,
        [id, locale, body.translations?.[locale]?.name || name, body.translations?.[locale]?.description || null]
      );
    }
    await conn.commit();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ success: false, message: "Не удалось создать категорию" }, { status: 500 });
  } finally { if (conn) conn.release(); }
}
