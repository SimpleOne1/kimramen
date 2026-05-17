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
type FacetRow = { value: string | null; label?: string | null; count: number | string };
type CategoryFacetRow = { id: number; name: string | null; count: number | string };

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

function buildWhere(query: Required<Omit<CatalogProductsQuery, "categoryId" | "q" | "minPrice" | "maxPrice" | "locale">> & Pick<CatalogProductsQuery, "categoryId" | "q" | "minPrice" | "maxPrice" | "locale">) {
  const where: string[] = ["p.is_active = 1"];
  const params: unknown[] = [];

  if (query.categoryId) {
    where.push("EXISTS (SELECT 1 FROM product_categories pc_scope INNER JOIN category_tree scope_tree ON scope_tree.id = pc_scope.category_id WHERE pc_scope.product_id = p.id)");
  }

  const selectedCategories = normalizeIds(query.categories);
  if (selectedCategories.length) {
    where.push(`EXISTS (SELECT 1 FROM product_categories pc_filter WHERE pc_filter.product_id = p.id AND pc_filter.category_id IN (${placeholders(selectedCategories.length)}))`);
    params.push(...selectedCategories);
  }

  const search = String(query.q || "").trim();
  if (search) {
    const like = `%${search}%`;
    where.push("(pt.name LIKE ? OR pt.short_description LIKE ? OR p.sku LIKE ? OR p.slug LIKE ? OR p.brand LIKE ? OR p.manufacturer LIKE ?)");
    params.push(like, like, like, like, like, like);
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

  const brands = normalizeList(query.brands);
  if (brands.length) {
    where.push(`TRIM(p.brand) IN (${placeholders(brands.length)})`);
    params.push(...brands);
  }

  const countries = normalizeList(query.countries);
  if (countries.length) {
    where.push(`TRIM(p.country_of_origin) IN (${placeholders(countries.length)})`);
    params.push(...countries);
  }

  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

function cteSql(categoryId?: number | null) {
  if (!categoryId) return "";

  return `
    WITH RECURSIVE category_tree AS (
      SELECT id FROM categories WHERE id = ? AND is_active = 1
      UNION ALL
      SELECT c.id
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
      WHERE c.is_active = 1
    )
  `;
}

function cteParams(categoryId?: number | null) {
  return categoryId ? [categoryId] : [];
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

export async function getCatalogProducts(query: CatalogProductsQuery) {
  await ensurePromotionsReadyForPublicCatalog();

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 16), 1), 60);
  const offset = (page - 1) * limit;
  const sort: CatalogSort = query.sort && SORT_SQL[query.sort] ? query.sort : "date_desc";
  const locale = query.locale || "ru";
  const categoryId = query.categoryId && Number.isFinite(Number(query.categoryId)) ? Number(query.categoryId) : null;

  const normalizedQuery = {
    categoryId,
    q: query.q || null,
    page,
    limit,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    brands: normalizeList(query.brands),
    countries: normalizeList(query.countries),
    categories: normalizeIds(query.categories),
    sort,
    locale,
  };

  const where = buildWhere(normalizedQuery);
  const cte = cteSql(categoryId);
  const cteBaseParams = cteParams(categoryId);
  const conn = await pool.getConnection();

  try {
    const productsPromise = conn.query<ProductRow[]>(
      `
      ${cte}
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
      [...cteBaseParams, locale, ...where.params, limit, offset],
    );

    const totalPromise = conn.query<CountRow[]>(
      `
      ${cte}
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      `,
      [...cteBaseParams, locale, ...where.params],
    );

    const priceRangePromise = conn.query<PriceRangeRow[]>(
      `
      ${cte}
      SELECT MIN(p.price) AS min_price, MAX(p.price) AS max_price
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
      `,
      [...cteBaseParams, locale, ...where.params],
    );

    const categoriesPromise = conn.query<CategoryFacetRow[]>(
      `
      ${cte}
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
      LIMIT 80
      `,
      [...cteBaseParams, locale, locale, ...where.params],
    );

    const brandsPromise = conn.query<FacetRow[]>(
      `
      ${cte}
      SELECT TRIM(p.brand) AS value, COUNT(DISTINCT p.id) AS count
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
        AND p.brand IS NOT NULL
        AND TRIM(p.brand) <> ''
      GROUP BY TRIM(p.brand)
      HAVING count > 0
      ORDER BY value ASC
      LIMIT 80
      `,
      [...cteBaseParams, locale, ...where.params],
    );

    const countriesPromise = conn.query<FacetRow[]>(
      `
      ${cte}
      SELECT TRIM(p.country_of_origin) AS value, COUNT(DISTINCT p.id) AS count
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
      ${where.sql}
        AND p.country_of_origin IS NOT NULL
        AND TRIM(p.country_of_origin) <> ''
      GROUP BY TRIM(p.country_of_origin)
      HAVING count > 0
      ORDER BY value ASC
      LIMIT 80
      `,
      [...cteBaseParams, locale, ...where.params],
    );

    const [productRows, totalRows, priceRows, categoryRows, brandRows, countryRows] = await Promise.all([
      productsPromise,
      totalPromise,
      priceRangePromise,
      categoriesPromise,
      brandsPromise,
      countriesPromise,
    ]);

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
          categories: normalizedQuery.categories,
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
        brands: brandRows.map((row) => ({
          value: row.value || "",
          name: row.value || "",
          count: Number(row.count || 0),
        })).filter((row) => row.value),
        countries: countryRows.map((row) => ({
          value: row.value || "",
          name: row.value || "",
          count: Number(row.count || 0),
        })).filter((row) => row.value),
      },
    };
  } finally {
    conn.release();
  }
}
