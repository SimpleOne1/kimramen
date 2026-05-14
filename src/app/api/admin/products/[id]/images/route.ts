import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import pool from "@/src/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function toWebp(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buffer).rotate().webp({ quality: 86 }).toBuffer();
  } catch {
    return buffer;
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  let conn;
  try {
    const { id } = await params;
    const productId = Number(id);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Файл не найден" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const webpBytes = await toWebp(bytes);
    const dir = path.join(process.cwd(), "public", "uploads", "products", String(productId));
    await mkdir(dir, { recursive: true });

    const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9а-яё_-]+/giu, "-").toLowerCase();
    const fileName = `${Date.now()}-${safeBase || "product"}.webp`;
    const filePath = path.join(dir, fileName);
    await writeFile(filePath, webpBytes);

    const publicPath = `/uploads/products/${productId}/${fileName}`;

    conn = await pool.getConnection();
    const countRows = await conn.query<any[]>(`SELECT COUNT(*) AS total FROM product_images WHERE product_id = ?`, [productId]);
    const isMain = Number(countRows[0]?.total || 0) === 0;
    await conn.query(
      `INSERT INTO product_images (product_id, path, alt_text, sort_order, is_main) VALUES (?, ?, NULL, ?, ?)`,
      [productId, publicPath, Number(countRows[0]?.total || 0), isMain ? 1 : 0]
    );
    if (isMain) {
      await conn.query(`UPDATE products SET main_image = ? WHERE id = ?`, [publicPath, productId]);
    }

    return NextResponse.json({ success: true, path: publicPath, isMain });
  } catch (error) {
    console.error("POST /api/admin/products/[id]/images error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить изображение" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
