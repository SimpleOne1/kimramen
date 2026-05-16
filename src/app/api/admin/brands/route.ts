import { NextRequest, NextResponse } from "next/server";
import type { PoolConnection } from "mariadb";
import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  country: string | null;
  is_active: number | boolean;
  source: string | null;
  product_count: number | string | null;
};

async function ensureBrandsSchema(conn: PoolConnection) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NULL,
      website_url VARCHAR(500) NULL,
      country VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      source VARCHAR(50) NOT NULL DEFAULT 'manual',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_brands_name (name),
      UNIQUE KEY uq_brands_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Важно: CREATE TABLE IF NOT EXISTS не обновляет уже существующую таблицу.
  // Поэтому явно добавляем все поля, которые могли появиться в новых патчах.
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER slug`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) NULL AFTER description`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS country VARCHAR(255) NULL AFTER website_url`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER country`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'sync' AFTER is_active`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER source`);
  await conn.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`);

  await conn.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INT UNSIGNED NULL`);
}

async function backfillBrands(conn: PoolConnection) {
  const rows = await conn.query<{ brand: string }[]>(`
    SELECT DISTINCT TRIM(brand) AS brand
    FROM products
    WHERE brand IS NOT NULL AND TRIM(brand) <> ''
    ORDER BY TRIM(brand) ASC
  `);

  for (const row of rows) {
    const name = String(row.brand || "").trim();
    if (!name) continue;
    await conn.query(
      `
      INSERT INTO brands (name, slug, source, created_at, updated_at)
      VALUES (?, ?, 'sync', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        updated_at = NOW()
      `,
      [name, slugify(name)]
    );
  }

  await conn.query(`
    UPDATE products p
    INNER JOIN brands b ON b.name = p.brand
    SET p.brand_id = b.id
    WHERE p.brand IS NOT NULL AND TRIM(p.brand) <> ''
  `);
}

export async function GET() {
  let conn;

  try {
    const guard = await requireAdmin("brands:view");
    if (!guard.ok) return guard.response;

    conn = await pool.getConnection();
    await ensureBrandsSchema(conn);
    await backfillBrands(conn);

    const rows = await conn.query<BrandRow[]>(`
      SELECT
        b.id,
        b.name,
        b.slug,
        b.description,
        b.website_url,
        b.country,
        b.is_active,
        b.source,
        COUNT(DISTINCT p.id) AS product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id OR p.brand = b.name
      GROUP BY b.id, b.name, b.slug, b.description, b.website_url, b.country, b.is_active, b.source
      ORDER BY b.name ASC
    `);

    return NextResponse.json({
      success: true,
      brands: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        slug: row.slug,
        description: row.description || "",
        websiteUrl: row.website_url || "",
        country: row.country || "",
        isActive: Boolean(row.is_active),
        source: row.source || "manual",
        productCount: Number(row.product_count || 0),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/brands error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить бренды" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request: NextRequest) {
  let conn;

  try {
    const guard = await requireAdmin("brands:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Название бренда обязательно" },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await ensureBrandsSchema(conn);

    const slug = slugify(String(body?.slug || name));
    const result = await conn.query(
      `
      INSERT INTO brands (name, slug, description, website_url, country, is_active, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', NOW(), NOW())
      `,
      [
        name,
        slug,
        body?.description ? String(body.description) : null,
        body?.websiteUrl ? String(body.websiteUrl) : null,
        body?.country ? String(body.country) : null,
        body?.isActive === false ? 0 : 1,
      ]
    );

    return NextResponse.json({ success: true, id: Number(result.insertId) });
  } catch (error) {
    console.error("POST /api/admin/brands error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось создать бренд" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(request: NextRequest) {
  let conn;

  try {
    const guard = await requireAdmin("brands:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const body = await request.json();
    const id = Number(body?.id || 0);
    const name = String(body?.name || "").trim();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: "ID и название бренда обязательны" },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await ensureBrandsSchema(conn);

    const slug = slugify(String(body?.slug || name));
    await conn.query(
      `
      UPDATE brands
      SET name = ?, slug = ?, description = ?, website_url = ?, country = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [
        name,
        slug,
        body?.description ? String(body.description) : null,
        body?.websiteUrl ? String(body.websiteUrl) : null,
        body?.country ? String(body.country) : null,
        body?.isActive === false ? 0 : 1,
        id,
      ]
    );

    await conn.query(
      `UPDATE products SET brand = ? WHERE brand_id = ?`,
      [name, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/brands error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось сохранить бренд" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
