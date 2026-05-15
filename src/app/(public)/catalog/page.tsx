import Link from "next/link";
import pool from "@/src/lib/db";
import ProductCard from "@/src/components/product/productCard";
import type { Product } from "@/src/models/product";

type PageProps = {
  searchParams?: Promise<{ category?: string }>;
};

type CategoryRow = {
  id: number;
  parent_id: number | null;
  name: string | null;
};

type ProductRow = {
  id: number;
  slug: string;
  main_image: string | null;
  price: number | string;
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

function collectDescendants(categories: CategoryRow[], rootId: number) {
  const ids = new Set<number>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parent_id && ids.has(Number(category.parent_id)) && !ids.has(Number(category.id))) {
        ids.add(Number(category.id));
        changed = true;
      }
    }
  }

  return [...ids];
}

async function getCatalogData(categoryParam?: string) {
  let conn;
  const selectedCategoryId = categoryParam && /^\d+$/.test(categoryParam) ? Number(categoryParam) : null;

  try {
    conn = await pool.getConnection();

    const categories = await conn.query<CategoryRow[]>(
      `
      SELECT c.id, c.parent_id, ct.name
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
      WHERE c.is_active = 1
      ORDER BY c.sort_order ASC, ct.name ASC
      `
    );

    const selectedCategory = selectedCategoryId
      ? categories.find((category) => Number(category.id) === selectedCategoryId) || null
      : null;

    const categoryIds = selectedCategoryId ? collectDescendants(categories, selectedCategoryId) : [];
    const categoryFilter = categoryIds.length
      ? `AND EXISTS (
          SELECT 1
          FROM product_categories pc
          WHERE pc.product_id = p.id AND pc.category_id IN (${categoryIds.map(() => "?").join(",")})
        )`
      : "";

    const rows = await conn.query<ProductRow[]>(
      `
      SELECT
        p.id,
        p.slug,
        p.main_image,
        p.price,
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
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1
      ${categoryFilter}
      ORDER BY p.id DESC
      LIMIT 80
      `,
      categoryIds
    );

    const products: Product[] = rows.map((row) => ({
      id: Number(row.id),
      slug: row.slug,
      main_image: row.main_image,
      price: Number(row.price || 0),
      currency: row.currency || "MDL",
      stock_quantity: Number(row.stock_quantity || 0),
      min_order_qty: Number(row.min_order_qty || 1),
      country_of_origin: row.country_of_origin,
      brand: row.brand,
      manufacturer: row.manufacturer,
      net_weight_grams: row.net_weight_grams,
      translations: {
        name: row.name || "Товар Kimramen",
        short_description: row.short_description,
        description: row.description,
      },
    }));

    return { products, selectedCategory };
  } finally {
    if (conn) conn.release();
  }
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { products, selectedCategory } = await getCatalogData(params?.category);

  return (
    <main className="min-h-screen bg-[#EEE9EA] px-4 py-8 text-black lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-black/55">
              <Link href="/" className="underline underline-offset-2">Главная</Link>
              <span>›</span>
              <span>Каталог</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight lg:text-5xl">
              {selectedCategory?.name || "Каталог товаров"}
            </h1>
          </div>
          {selectedCategory && (
            <Link href="/catalog" className="rounded-xl bg-black px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0067B9]">
              Все товары
            </Link>
          )}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-extrabold">В этой категории пока нет активных товаров.</p>
          </div>
        )}
      </div>
    </main>
  );
}
