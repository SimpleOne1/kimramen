import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { POSFIX_SYNC_SOURCE } from "./posfix.constants";
import { MappedPosfixProduct } from "./posfix.mapper";

interface CategoryRow {
  id: number;
  external_id: string;
}

interface ProductRow {
  id: number;
  external_id: string | null;
  sync_source: string | null;
  sku: string | null;
  barcode: string | null;
  manual_fields: string | null;
}

interface BrandRow {
  id: number;
  name: string;
}

type ManualFields = string[];
type Connection = Awaited<ReturnType<typeof pool.getConnection>>;

const LOCALES = ["ru", "en", "ro"] as const;

function parseManualFields(value: unknown): ManualFields {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function isManual(manualFields: ManualFields, field: string) {
  return manualFields.includes(field);
}

function uniqueSlug(name: string, externalId: string) {
  return `${slugify(name) || "product"}-${slugify(externalId).slice(-24)}`;
}

function placeholders(length: number) {
  return Array.from({ length }, () => "?").join(", ");
}

function normalizeText(value: string | null | undefined) {
  const result = String(value || "").trim();
  return result || null;
}

function truncate(value: string | null, maxLength: number) {
  return value ? value.slice(0, maxLength) : null;
}

async function ensurePosfixSchema(connection: Connection) {
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS posfix_image_url VARCHAR(500) NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS posfix_source_data LONGTEXT NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life_days INT NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INT UNSIGNED NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS country_of_origin_en VARCHAR(255) NULL`);
  await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS country_of_origin_ro VARCHAR(255) NULL`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NULL,
      website_url VARCHAR(500) NULL,
      country VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      source VARCHAR(50) NOT NULL DEFAULT 'sync',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_brands_name (name),
      UNIQUE KEY uq_brands_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS country VARCHAR(255) NULL AFTER website_url`);
  await connection.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'sync' AFTER is_active`);
}

async function ensureBrands(connection: Connection, products: MappedPosfixProduct[]) {
  const brands = new Map<string, string | null>();

  for (const product of products) {
    const name = normalizeText(product.brand);
    if (name) brands.set(name, product.countryOfOrigin);
  }

  if (!brands.size) return new Map<string, number>();

  const values: unknown[] = [];
  const rowsSql = Array.from(brands.entries()).map(([name, country]) => {
    values.push(name, slugify(name), country);
    return "(?, ?, ?, 1, 'posfix', NOW(), NOW())";
  });

  await connection.query(
    `
    INSERT INTO brands (name, slug, country, is_active, source, created_at, updated_at)
    VALUES ${rowsSql.join(", ")}
    ON DUPLICATE KEY UPDATE
      country = COALESCE(VALUES(country), country),
      is_active = 1,
      source = 'posfix',
      updated_at = NOW()
    `,
    values,
  );

  const nameList = Array.from(brands.keys());
  const rows = await connection.query<BrandRow[]>(
    `SELECT id, name FROM brands WHERE name IN (${placeholders(nameList.length)})`,
    nameList,
  );
  return new Map(rows.map((row) => [row.name, Number(row.id)]));
}

async function upsertTranslation(
  connection: Connection,
  productId: number,
  locale: (typeof LOCALES)[number],
  product: MappedPosfixProduct,
  manualFields: ManualFields,
) {
  const values = [
    product.name,
    product.shortDescription,
    product.description,
    product.seoTitle,
    truncate(product.seoDescription, 255),
  ];
  const fields = [
    [`name_${locale}`, "name"],
    [`short_description_${locale}`, "short_description"],
    [`description_${locale}`, "description"],
    [`meta_title_${locale}`, "meta_title"],
    [`meta_description_${locale}`, "meta_description"],
  ] as const;
  const updates = fields
    .filter(([manualField]) => !isManual(manualFields, manualField))
    .map(([, column]) => `${column} = VALUES(${column})`);

  await connection.query(
    `
    INSERT INTO product_translations (
      product_id, locale, name, short_description, description, meta_title, meta_description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ${updates.length ? `ON DUPLICATE KEY UPDATE ${updates.join(", ")}` : ""}
    `,
    [productId, locale, ...values],
  );
}

export async function syncPosfixProducts(products: MappedPosfixProduct[]) {
  if (!products.length) throw new Error("No valid POSfix products to synchronize");

  const connection = await pool.getConnection();

  try {
    await ensurePosfixSchema(connection);
    await connection.beginTransaction();

    const categoryRows = await connection.query<CategoryRow[]>(
      `SELECT id, external_id FROM categories WHERE external_id IS NOT NULL`,
    );
    const categoryIds = new Map(categoryRows.map((row) => [row.external_id, Number(row.id)]));

    const productIds = products.map((product) => product.externalId);
    const skus = products.map((product) => product.sku).filter(Boolean) as string[];
    const barcodes = products.map((product) => product.barcode).filter(Boolean) as string[];
    const identityParts: string[] = [];
    const identityParams: unknown[] = [];
    if (productIds.length) {
      identityParts.push(`external_id IN (${placeholders(productIds.length)})`);
      identityParams.push(...productIds);
    }
    if (skus.length) {
      identityParts.push(`sku IN (${placeholders(skus.length)})`);
      identityParams.push(...skus);
    }
    if (barcodes.length) {
      identityParts.push(`barcode IN (${placeholders(barcodes.length)})`);
      identityParams.push(...barcodes);
    }

    const existingRows = await connection.query<ProductRow[]>(
      `
      SELECT id, external_id, sync_source, sku, barcode, manual_fields
      FROM products
      WHERE sync_source IN ('syrve', 'posfix')${identityParts.length ? ` OR (${identityParts.join(" OR ")})` : ""}
      `,
      identityParams,
    );
    const manualSkuCollisions = existingRows.filter(
      (row) => row.sync_source === "manual" && row.sku && skus.includes(row.sku),
    );
    if (manualSkuCollisions.length) {
      throw new Error(
        `POSfix SKU collides with manual product: ${manualSkuCollisions.map((row) => row.sku).join(", ")}`,
      );
    }

    const sourceRows = existingRows.filter((row) => row.sync_source !== "manual");
    const byExternalId = new Map(sourceRows.filter((row) => row.external_id).map((row) => [row.external_id!, row]));
    const bySku = new Map(sourceRows.filter((row) => row.sku).map((row) => [row.sku!, row]));
    const byBarcode = new Map(sourceRows.filter((row) => row.barcode).map((row) => [row.barcode!, row]));
    const brandIds = await ensureBrands(connection, products);

    const deactivatedOldSyrve = await connection.query(
      `UPDATE products SET is_active = 0, is_deleted_in_source = 1, updated_at = NOW() WHERE sync_source = 'syrve'`,
    );

    let syncedCount = 0;
    let linkedCount = 0;
    let uncategorizedCount = 0;
    let preservedManualCount = 0;
    let descriptionsSynced = 0;
    let nutritionSynced = 0;

    for (const product of products) {
      let existing = byExternalId.get(product.externalId)
        || (product.sku ? bySku.get(product.sku) : undefined)
        || (product.barcode ? byBarcode.get(product.barcode) : undefined);
      const manualFields = parseManualFields(existing?.manual_fields);
      if (manualFields.length) preservedManualCount += 1;

      // Reuse a previous source row when code/barcode identifies the same product.
      // This keeps manual edits and order references intact during the source switch.
      if (existing && existing.external_id !== product.externalId && existing.sync_source !== "manual") {
        await connection.query(`UPDATE products SET external_id = ? WHERE id = ?`, [product.externalId, existing.id]);
        existing = { ...existing, external_id: product.externalId, sync_source: POSFIX_SYNC_SOURCE };
        byExternalId.set(product.externalId, existing);
      }

      const localCategoryId = product.externalCategoryId ? categoryIds.get(product.externalCategoryId) || null : null;
      const brandId = product.brand ? brandIds.get(product.brand) || null : null;
      const imageUrl = product.imageUrl;

      await connection.query(
        `
        INSERT INTO products (
          external_id, sku, barcode, slug, price, currency, stock_quantity,
          net_weight_grams, weight_value, weight_unit, is_active,
          main_image, brand, brand_id, country_of_origin, country_of_origin_en, country_of_origin_ro, sync_source,
          posfix_image_url, vat_rate, shelf_life_days, posfix_source_data,
          fat_amount, proteins_amount, carbohydrates_amount, energy_amount,
          fat_full_amount, proteins_full_amount, carbohydrates_full_amount, energy_full_amount,
          is_deleted_in_source, last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
        ON DUPLICATE KEY UPDATE
          sku = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('sku')), sku, VALUES(sku)),
          barcode = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('barcode')), barcode, VALUES(barcode)),
          slug = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('slug')), slug, VALUES(slug)),
          price = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('price')), price, VALUES(price)),
          currency = VALUES(currency),
          stock_quantity = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('stock_quantity')), stock_quantity, VALUES(stock_quantity)),
          net_weight_grams = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), net_weight_grams, VALUES(net_weight_grams)),
          weight_value = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), weight_value, VALUES(weight_value)),
          weight_unit = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('weight')), weight_unit, VALUES(weight_unit)),
          main_image = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('main_image')), main_image, VALUES(main_image)),
          brand = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('brand')), brand, VALUES(brand)),
          brand_id = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('brand')), brand_id, VALUES(brand_id)),
          country_of_origin = IF(JSON_CONTAINS(COALESCE(manual_fields, JSON_ARRAY()), JSON_QUOTE('country_of_origin')), country_of_origin, VALUES(country_of_origin)),
          country_of_origin_en = VALUES(country_of_origin_en),
          country_of_origin_ro = VALUES(country_of_origin_ro),
          posfix_image_url = VALUES(posfix_image_url),
          vat_rate = VALUES(vat_rate),
          shelf_life_days = VALUES(shelf_life_days),
          posfix_source_data = VALUES(posfix_source_data),
          fat_amount = VALUES(fat_amount),
          proteins_amount = VALUES(proteins_amount),
          carbohydrates_amount = VALUES(carbohydrates_amount),
          energy_amount = VALUES(energy_amount),
          fat_full_amount = VALUES(fat_full_amount),
          proteins_full_amount = VALUES(proteins_full_amount),
          carbohydrates_full_amount = VALUES(carbohydrates_full_amount),
          energy_full_amount = VALUES(energy_full_amount),
          is_active = VALUES(is_active),
          sync_source = VALUES(sync_source),
          is_deleted_in_source = 0,
          last_synced_at = NOW()
        `,
        [
          product.externalId,
          product.sku,
          product.barcode,
          uniqueSlug(product.name, product.externalId),
          product.price,
          product.currency,
          product.stockQuantity,
          product.netWeightGrams,
          product.weightValue,
          product.weightUnit,
          product.isActive ? 1 : 0,
          imageUrl,
          product.brand,
          brandId,
          product.countryOfOrigin,
          product.countryOfOriginEn,
          product.countryOfOriginRo,
          product.syncSource,
          imageUrl,
          product.vatRate,
          product.shelfLifeDays,
          product.sourceData,
          product.fatAmount,
          product.proteinsAmount,
          product.carbohydratesAmount,
          product.energyAmount,
          product.fatFullAmount,
          product.proteinsFullAmount,
          product.carbohydratesFullAmount,
          product.energyFullAmount,
        ],
      );

      const productRows = await connection.query<ProductRow[]>(
        `SELECT id, external_id, sync_source, sku, barcode, manual_fields FROM products WHERE external_id = ? LIMIT 1`,
        [product.externalId],
      );
      if (!productRows.length) throw new Error(`Failed to load POSfix product: ${product.externalId}`);

      const localProductId = Number(productRows[0].id);
      const rowManualFields = parseManualFields(productRows[0].manual_fields);
      for (const locale of LOCALES) {
        await upsertTranslation(connection, localProductId, locale, product, rowManualFields);
      }

      if (!isManual(rowManualFields, "categories")) {
        await connection.query(`DELETE FROM product_categories WHERE product_id = ?`, [localProductId]);
        if (localCategoryId) {
          await connection.query(
            `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
            [localProductId, localCategoryId],
          );
          linkedCount += 1;
        } else {
          uncategorizedCount += 1;
        }
      }

      if (product.description) descriptionsSynced += 1;
      if ([product.fatAmount, product.proteinsAmount, product.carbohydratesAmount, product.energyAmount].some((value) => value !== null)) {
        nutritionSynced += 1;
      }
      syncedCount += 1;
    }

    const externalIds = products.map((product) => product.externalId);
    await connection.query(
      `
      UPDATE products
      SET is_active = 0, is_deleted_in_source = 1, updated_at = NOW()
      WHERE sync_source = 'posfix' AND external_id NOT IN (${placeholders(externalIds.length)})
      `,
      externalIds,
    );

    await connection.commit();

    return {
      syncedCount,
      linkedCount,
      uncategorizedCount,
      preservedManualCount,
      descriptionsSynced,
      nutritionSynced,
      deactivatedOldSyrveProducts: Number(deactivatedOldSyrve.affectedRows || 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
