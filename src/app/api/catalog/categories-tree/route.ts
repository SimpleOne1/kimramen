import { NextResponse } from "next/server";
import pool from "@/src/lib/db";

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string;
  sort_order: number | string | null;
  name: string | null;
  product_count: number | string | null;
};

type CategoryNode = {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
};

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
        ct.name,
        COUNT(DISTINCT pc.product_id) AS product_count
      FROM categories c
      LEFT JOIN category_translations ct
        ON ct.category_id = c.id AND ct.locale = 'ru'
      LEFT JOIN product_categories pc
        ON pc.category_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id, c.parent_id, c.slug, c.sort_order, ct.name
      ORDER BY c.parent_id IS NOT NULL ASC, c.sort_order ASC, ct.name ASC
      `
    );

    const byId = new Map<number, CategoryNode>();

    for (const row of rows) {
      byId.set(Number(row.id), {
        id: Number(row.id),
        parentId: row.parent_id === null ? null : Number(row.parent_id),
        slug: row.slug,
        name: row.name || row.slug,
        sortOrder: Number(row.sort_order || 0),
        productCount: Number(row.product_count || 0),
        children: [],
      });
    }

    const tree: CategoryNode[] = [];

    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    }

    const sortTree = (items: CategoryNode[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ru"));
      items.forEach((item) => sortTree(item.children));
    };

    sortTree(tree);

    return NextResponse.json({ success: true, categories: tree });
  } catch (error) {
    console.error("GET /api/catalog/categories-tree error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить дерево категорий" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
