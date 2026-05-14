import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { MappedProduct } from "./syrve.product-mapper";

interface CategoryRow { id: number; external_id: string; }
interface ProductRow { id: number; external_id: string; manual_fields: string | null; }

const LOCALES = ["ru", "en", "ro"] as const;

type ManualFields = string[];

function parseManualFields(value: unknown): ManualFields {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try { return JSON.parse(String(value)); } catch { return []; }
}

function isManual(manualFields: ManualFields, field: string) {
  return manualFields.includes(field);
}

function uniqueSlug(base: string, externalId: string): string {
  const safeBase = base || "product";
  return `${safeBase}-${externalId.slice(0, 8)}`;
}

function normalizeWeightToGrams(weight: number | null, weightValue: number | null, weightUnit: string | null): number | null {
  if (weightValue && weightUnit === "g") return Math.round(weightValue);
  if (weightValue && weightUnit === "kg") return Math.round(weightValue * 1000);
  if (weight === null || !Number.isFinite(weight) || weight <= 0) return null;
  return Math.round(weight * 1000);
}

function fallbackTranslation(name: string, locale: "ru" | "en" | "ro") {
  if (locale === "en") return name;
  if (locale === "ro") return name;
  return name;
}

export async function syncSyrveProducts(products: MappedProduct[]) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const categoryRows = await connection.query<CategoryRow[]>(
      `SELECT id, external_id FROM categories WHERE external_id IS NOT NULL`
    );

    const externalCategoryToLocalId = new Map<string, number>();
    for (const row of categoryRows) externalCategoryToLocalId.set(row.external_id, row.id);

    let syncedCount = 0;
    let linkedCount = 0;
    let skippedWithoutCategory = 0;
    let preservedManualCount = 0;

    for (const product of products) {
      const localCategoryId = product.externalCategoryId
        ? externalCategoryToLocalId.get(product.externalCategoryId) ?? null
        : null;

      if (!localCategoryId) { skippedWithoutCategory += 1; continue; }

      const existingRows = await connection.query<ProductRow[]>(
        `SELECT id, external_id, manual_fields FROM products WHERE external_id = ? LIMIT 1`,
        [product.externalId]
      );
      const manualFields = parseManualFields(existingRows[0]?.manual_fields);
      if (manualFields.length) preservedManualCount += 1;

      const slug = uniqueSlug(slugify([product.name, product.weightLabel].filter(Boolean).join(" ")), product.externalId);
      const netWeightGrams = normalizeWeightToGrams(product.weight, product.weightValue, product.weightUnit);

      await connection.query(
        `
        INSERT INTO products (
          external_id, sku, slug, price, currency, stock_quantity,
          net_weight_grams, weight_value, weight_unit, is_active,
          brand, country_of_origin, sync_source, last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          sku = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('sku')), sku, VALUES(sku)),
          slug = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('slug')), slug, VALUES(slug)),
          price = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('price')), price, VALUES(price)),
          currency = VALUES(currency),
          stock_quantity = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('stock_quantity')), stock_quantity, VALUES(stock_quantity)),
          net_weight_grams = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), net_weight_grams, VALUES(net_weight_grams)),
          weight_value = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), weight_value, VALUES(weight_value)),
          weight_unit = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), weight_unit, VALUES(weight_unit)),
          brand = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('brand')), brand, VALUES(brand)),
          country_of_origin = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('country_of_origin')), country_of_origin, VALUES(country_of_origin)),
          is_active = VALUES(is_active),
          sync_source = VALUES(sync_source),
          is_deleted_in_source = 0,
          last_synced_at = NOW()
        `,
        [
          product.externalId,
          product.sku,
          slug,
          product.price,
          "MDL",
          0,
          netWeightGrams,
          product.weightValue,
          product.weightUnit,
          product.isActive ? 1 : 0,
          product.brand,
          product.countryOfOrigin,
          product.syncSource,
        ]
      );

      const productRows = await connection.query<ProductRow[]>(
        `SELECT id, external_id, manual_fields FROM products WHERE external_id = ? LIMIT 1`,
        [product.externalId]
      );
      if (!productRows.length) throw new Error(`Failed to load product after upsert: ${product.externalId}`);
      const localProductId = productRows[0].id;
      const rowManualFields = parseManualFields(productRows[0].manual_fields);

      for (const locale of LOCALES) {
        const translatedName = fallbackTranslation(product.name, locale);
        const manualNameField = `name_${locale}`;

        if (isManual(rowManualFields, manualNameField)) {
          await connection.query(
            `
            INSERT IGNORE INTO product_translations (product_id, locale, name, short_description, description)
            VALUES (?, ?, ?, NULL, NULL)
            `,
            [localProductId, locale, translatedName]
          );
        } else {
          await connection.query(
            `
            INSERT INTO product_translations (product_id, locale, name, short_description, description)
            VALUES (?, ?, ?, NULL, NULL)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
            `,
            [localProductId, locale, translatedName]
          );
        }
      }

      if (!isManual(rowManualFields, "categories")) {
        await connection.query(
          `
          INSERT INTO product_categories (product_id, category_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE category_id = VALUES(category_id)
          `,
          [localProductId, localCategoryId]
        );
      }

      syncedCount += 1;
      linkedCount += 1;
    }

    await connection.commit();
    return { syncedCount, linkedCount, skippedWithoutCategory, preservedManualCount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
