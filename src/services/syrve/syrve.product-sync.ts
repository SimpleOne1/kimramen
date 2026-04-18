import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { MappedProduct } from "./syrve.product-mapper";

interface CategoryRow {
  id: number;
  external_id: string;
}

interface ProductRow {
  id: number;
  external_id: string;
}

function uniqueSlug(base: string, externalId: string): string {
  const safeBase = base || "product";
  return `${safeBase}-${externalId.slice(0, 8)}`;
}

function normalizeWeightToGrams(weight: number | null): number | null {
  if (weight === null || !Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  return Math.round(weight * 1000);
}

export async function syncSyrveProducts(products: MappedProduct[]) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const categoryRows = await connection.query<CategoryRow[]>(
      `SELECT id, external_id FROM categories WHERE external_id IS NOT NULL`
    );

    const externalCategoryToLocalId = new Map<string, number>();
    for (const row of categoryRows) {
      externalCategoryToLocalId.set(row.external_id, row.id);
    }

    let syncedCount = 0;
    let linkedCount = 0;
    let skippedWithoutCategory = 0;

    for (const product of products) {
      const localCategoryId = product.externalCategoryId
        ? externalCategoryToLocalId.get(product.externalCategoryId) ?? null
        : null;

      if (!localCategoryId) {
        skippedWithoutCategory += 1;
        continue;
      }

      const slug = uniqueSlug(slugify(product.name), product.externalId);
      const netWeightGrams = normalizeWeightToGrams(product.weight);

      await connection.query(
        `
        INSERT INTO products (
          external_id,
          sku,
          slug,
          price,
          currency,
          stock_quantity,
          net_weight_grams,
          is_active,
          sync_source,
          last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          sku = VALUES(sku),
          slug = VALUES(slug),
          price = VALUES(price),
          currency = VALUES(currency),
          stock_quantity = VALUES(stock_quantity),
          net_weight_grams = VALUES(net_weight_grams),
          is_active = VALUES(is_active),
          sync_source = VALUES(sync_source),
          last_synced_at = NOW()
        `,
        [
          product.externalId,
          product.sku,
          slug,
          product.price,
          "EUR",
          0,
          netWeightGrams,
          product.isActive ? 1 : 0,
          product.syncSource,
        ]
      );

      const productRows = await connection.query<ProductRow[]>(
        `SELECT id, external_id FROM products WHERE external_id = ? LIMIT 1`,
        [product.externalId]
      );

      if (!productRows.length) {
        throw new Error(`Failed to load product after upsert: ${product.externalId}`);
      }

      const localProductId = productRows[0].id;

      await connection.query(
        `
        INSERT INTO product_translations (
          product_id,
          locale,
          name,
          short_description,
          description
        )
        VALUES (?, 'ru', ?, NULL, NULL)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name)
        `,
        [localProductId, product.name]
      );

      await connection.query(
        `
        INSERT INTO product_categories (
          product_id,
          category_id
        )
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          category_id = VALUES(category_id)
        `,
        [localProductId, localCategoryId]
      );

      syncedCount += 1;
      linkedCount += 1;
    }

    await connection.commit();

    return {
      syncedCount,
      linkedCount,
      skippedWithoutCategory,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}