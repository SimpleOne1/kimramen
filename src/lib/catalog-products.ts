import pool from "@/src/lib/db";
import { ACTIVE_PROMOTION_SQL, calculateDiscountedPrice, ensurePromotionsReadyForPublicCatalog } from "@/src/lib/promotions";
import type { Product } from "@/src/models/product";

export type CatalogSort = "date_desc" | "price_asc" | "price_desc" | "name_asc";

export type CatalogProductsQuery = {
  categoryId?: number | null;
  q?: string | null;
  page?: number;
  limit?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  brands?: string[];
  countries?: string[];
  categories?: number[];
  sort?: CatalogSort;
  locale?: "ru" | "en" | "ro";
};

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string | null;
  name: string | null;
};

type ProductRow = {
  id: number;
  sku: string | null;
  slug: string;
  main_image: string | null;
  price: number | string;
  discount_percent: number | string | null;
  currency: string | null;
  stock_quantity: number | null;
  min_order_qty: number | null;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  net_weight_grams: number | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
};

type CountRow = { total: number | string };
type PriceRangeRow = { min_price: number | string | null; max_price: number | string | null };
type FacetRow = { value: string | null; count: number | string };
type CategoryFacetRow = { id: number; name: string | null; count: number | string };

type WhereResult = { sql: string; params: unknown[] };

const SORT_SQL: Record<CatalogSort, string> = {
  date_desc: "p.id DESC",
  price_asc: "p.price ASC, p.id DESC",
  price_desc: "p.price DESC, p.id DESC",
  name_asc: "pt.name ASC, p.id DESC",
};

function normalizeList(values?: string[]) {
  return Array.from(
    new Set(
      (values || [])
        .flatMap((value) => String(value || "").split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeIds(values?: number[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
}

function placeholders(length: number) {
  return Array.from({ length }, () => "?").join(", ");
}

function collectDescendants(categories: CategoryRow[], rootIds: number[]) {
  const ids = new Set<number>(rootIds.filter((id) => Number.isFinite(id) && id > 0));
  let changed = true;

  while (changed) {
    changed = false;

    for (const category of categories) {
      const parentId = category.parent_id ? Number(category.parent_id) : null;
      const id = Number(category.id);

      if (parentId && ids.has(parentId) && !ids.has(id)) {
        ids.add(id);
        changed = true;
      }
    }
  }

  return Array.from(ids);
}

function buildWhere(query: {
  categoryScopeIds: number[];
  selectedCategoryIds: number[];
  q?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  brands: string[];
  countries: string[];
}): WhereResult {
  const where: string[] = ["p.is_active = 1"];
  const params: unknown[] = [];

  if (query.categoryScopeIds.length) {
    where.push(
      `EXISTS (
        SELECT 1
        FROM product_categories pc_scope
        WHERE pc_scope.product_id = p.id
          AND pc_scope.category_id IN (${placeholders(query.categoryScopeIds.length)})
      )`,
    );
    params.push(...query.categoryScopeIds);
  }

  if (query.selectedCategoryIds.length) {
    where.push(
      `EXISTS (
        SELECT 1
        FROM product_categories pc_filter
        WHERE pc_filter.product_id = p.id
          AND pc_filter.category_id IN (${placeholders(query.selectedCategoryIds.length)})
      )`,
    );
    params.push(...query.selectedCategoryIds);
  }

  const search = String(query.q || "").trim();
  if (search) {
    const like = `%${search}%`;
    where.push("(pt.name LIKE ? OR pt.short_description LIKE ? OR pt.description LIKE ? OR p.sku LIKE ? OR p.slug LIKE ? OR p.brand LIKE ? OR p.manufacturer LIKE ?)");
    params.push(like, like, like, like, like, like, like);
  }

  const minPrice = normalizeNumber(query.minPrice);
  if (minPrice !== null) {
    where.push("p.price >= ?");
    params.push(minPrice);
  }

  const maxPrice = normalizeNumber(query.maxPrice);
  if (maxPrice !== null) {
    where.push("p.price <= ?");
    params.push(maxPrice);
  }

  if (query.brands.length) {
    where.push(`TRIM(p.brand) IN (${placeholders(query.brands.length)})`);
    params.push(...query.brands);
  }

  if (query.countries.length) {
    where.push(`TRIM(p.country_of_origin) IN (${placeholders(query.countries.length)})`);
    params.push(...query.countries);
  }

  return {
    sql: `WHERE ${where.join(" AND ")}`,
    params,
  };
}

function mapProduct(row: ProductRow): Product {
  const discountPercent = Number(row.discount_percent || 0);
  const price = Number(row.price || 0);

  return {
    id: Number(row.id),
    sku: row.sku,
    slug: row.slug,
    main_image: row.main_image,
    price: calculateDiscountedPrice(price, discountPercent),
    old_price: discountPercent > 0 ? price : null,
    discount_percent: discountPercent > 0 ? discountPercent : null,
    currency: row.currency || "MDL",
    stock_quantity: Number(row.stock_quantity || 0),
    min_order_qty: Number(row.min_order_qty || 1),
    country_of_origin: row.country_of_origin,
    brand: row.brand,
    manufacturer: row.manufacturer,
    net_weight_grams: row.net_weight_grams,
    translations: {
      name: row.name || "Товар KimRamen",
      short_description: row.short_description,
      description: row.description,
    },
  };
}

async function getActiveCategories(locale: "ru" | "en" | "ro") {
  const conn = await pool.getConnection();

  try {
    return await conn.query<CategoryRow[]>(
      `
      SELECT c.id, c.parent_id, c.slug, ct.name
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = ?
      WHERE c.is_active = 1
      ORDER BY c.sort_order ASC, ct.name ASC, c.id ASC
      `,
      [locale],
    );
  } finally {
    conn.release();
  }
}

export async function getCatalogCategoryById(id: number, locale: "ru" | "en" | "ro" = "ru") {
  if (!Number.isFinite(id) || id <= 0) return null;

  const categories = await getActiveCategories(locale);
  const row = categories.find((category) => Number(category.id) === id);

  if (!row) return null;

  return {
    id: Number(row.id),
    parentId: row.parent_id ? Number(row.parent_id) : null,
    slug: row.slug,
    name: row.name || row.slug || `Категория ${row.id}`,
  };
}

export async function getCatalogProducts(query: CatalogProductsQuery) {
  await ensurePromotionsReadyForPublicCatalog();

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 16), 1), 60);
  const offset = (page - 1) * limit;
  const sort: CatalogSort = query.sort && SORT_SQL[query.sort] ? query.sort : "date_desc";
  const locale = query.locale || "ru";
  const categoryId = query.categoryId && Number.isFinite(Number(query.categoryId)) ? Number(query.categoryId) : null;
  const categories = await getActiveCategories(locale);

  const selectedCategoryRoots = normalizeIds(query.categories);
  const categoryScopeIds = categoryId ? collectDescendants(categories, [categoryId]) : [];
  const selectedCategoryIds = selectedCategoryRoots.length ? collectDescendants(categories, selectedCategoryRoots) : [];

  const normalizedQuery = {
    q: query.q || null,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    brands: normalizeList(query.brands),
    countries: normalizeList(query.countries),
  };

  const where = buildWhere({
    categoryScopeIds,
    selectedCategoryIds,
    ...normalizedQuery,
  });

  const conn = await pool.getConnection();

  try {
    const productRows = await conn.query<ProductRow[]>(
      `
      SELECT DISTINCT
        p.id,
        p.sku,
        p.slug,
        COALESCE(NULLIF(p.main_image, ''), NULLIF(p.syrve_image_url, '')) AS main_image,
        p.price,
        (${ACTIVE_PROMOTION_SQL}) AS discount_percent,
        p.currency,
        p.stock_quantity,
        p.min_order_qty,
        p.country_of_origin,
        p.brand,
        p.manufacturer,
        p.net_weight_grams,
        pt.name,
        pt.short_description,
        pt.description
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      ORDER BY ${SORT_SQL[sort]}
      LIMIT ? OFFSET ?
      `,
      [locale, ...where.params, limit, offset],
    );

    const totalRows = await conn.query<CountRow[]>(
      `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      `,
      [locale, ...where.params],
    );

    const priceRows = await conn.query<PriceRangeRow[]>(
      `
      SELECT MIN(p.price) AS min_price, MAX(p.price) AS max_price
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      `,
      [locale, ...where.params],
    );

    const categoryRows = await conn.query<CategoryFacetRow[]>(
      `
      SELECT c.id, COALESCE(ct.name, c.slug, CONCAT('Категория ', c.id)) AS name, COUNT(DISTINCT p.id) AS count
      FROM products p
      INNER JOIN product_categories pc ON pc.product_id = p.id
      INNER JOIN categories c ON c.id = pc.category_id AND c.is_active = 1
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = ?
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      GROUP BY c.id, ct.name, c.slug
      HAVING count > 0
      ORDER BY name ASC
      LIMIT 120
      `,
      [locale, locale, ...where.params],
    );

    const brandRows = await conn.query<FacetRow[]>(
      `
      SELECT TRIM(p.brand) AS value, COUNT(DISTINCT p.id) AS count
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
        AND p.brand IS NOT NULL
        AND TRIM(p.brand) <> ''
      GROUP BY TRIM(p.brand)
      HAVING count > 0
      ORDER BY value ASC
      LIMIT 120
      `,
      [locale, ...where.params],
    );

    const countryRows = await conn.query<FacetRow[]>(
      `
      SELECT TRIM(p.country_of_origin) AS value, COUNT(DISTINCT p.id) AS count
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
        AND p.country_of_origin IS NOT NULL
        AND TRIM(p.country_of_origin) <> ''
      GROUP BY TRIM(p.country_of_origin)
      HAVING count > 0
      ORDER BY value ASC
      LIMIT 120
      `,
      [locale, ...where.params],
    );

    const total = Number(totalRows[0]?.total || 0);

    return {
      success: true,
      products: productRows.map(mapProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      filters: {
        selected: {
          q: normalizedQuery.q,
          categoryId,
          categories: selectedCategoryRoots,
          brands: normalizedQuery.brands,
          countries: normalizedQuery.countries,
          minPrice: normalizedQuery.minPrice,
          maxPrice: normalizedQuery.maxPrice,
          sort,
        },
        price: {
          min: Number(priceRows[0]?.min_price || 0),
          max: Number(priceRows[0]?.max_price || 0),
        },
        categories: categoryRows.map((row) => ({
          id: Number(row.id),
          name: row.name || `Категория ${row.id}`,
          count: Number(row.count || 0),
        })),
        brands: brandRows
          .map((row) => ({
            value: row.value || "",
            name: row.value || "",
            count: Number(row.count || 0),
          }))
          .filter((row) => row.value),
        countries: countryRows
          .map((row) => ({
            value: row.value || "",
            name: row.value || "",
            count: Number(row.count || 0),
          }))
          .filter((row) => row.value),
      },
    };
  } finally {
    conn.release();
  }
}
