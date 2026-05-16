import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/src/lib/db";
import ProductCard from "@/src/components/product/productCard";
import type { Product } from "@/src/models/product";

type Params = { params: Promise<{ id: string }> };

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string | null;
  name: string | null;
  description: string | null;
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

async function getCategoryPageData(categoryId: number) {
  const conn = await pool.getConnection();

  try {
    const categoryRows = await conn.query<CategoryRow[]>(
      `
      SELECT c.id, c.parent_id, c.slug, ct.name, ct.description
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
      WHERE c.id = ? AND c.is_active = 1
      LIMIT 1
      `,
      [categoryId],
    );

    if (!categoryRows.length) return null;

    const childRows = await conn.query<CategoryRow[]>(
      `
      SELECT c.id, c.parent_id, c.slug, ct.name, ct.description
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
      WHERE c.parent_id = ? AND c.is_active = 1
      ORDER BY c.sort_order ASC, ct.name ASC, c.id ASC
      `,
      [categoryId],
    );

    const currentCategory = categoryRows[0];
    const parentId =
      currentCategory.parent_id === null ||
      Number(currentCategory.parent_id) === 0
        ? null
        : Number(currentCategory.parent_id);

    const parentRows = parentId
      ? await conn.query<CategoryRow[]>(
          `
          SELECT c.id, c.parent_id, c.slug, ct.name, ct.description
          FROM categories c
          LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ru'
          WHERE c.id = ? AND c.is_active = 1
          LIMIT 1
          `,
          [parentId],
        )
      : [];

    const productRows = await conn.query<ProductRow[]>(
      `
      WITH RECURSIVE category_tree AS (
        SELECT id FROM categories WHERE id = ? AND is_active = 1
        UNION ALL
        SELECT c.id
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = 1
      )
      SELECT DISTINCT
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
      INNER JOIN product_categories pc ON pc.product_id = p.id
      INNER JOIN category_tree tree ON tree.id = pc.category_id
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1
      ORDER BY p.id DESC
      LIMIT 60
      `,
      [categoryId],
    );

    const category = currentCategory;
    const parent = parentRows[0] || null;

    return {
      category: {
        id: Number(category.id),
        parentId,
        slug: category.slug || String(category.id),
        name: category.name || category.slug || `Категория ${category.id}`,
        description: category.description || null,
      },
      parent: parent
        ? {
            id: Number(parent.id),
            name: parent.name || parent.slug || `Категория ${parent.id}`,
          }
        : null,
      children: childRows.map((row) => ({
        id: Number(row.id),
        name: row.name || row.slug || `Категория ${row.id}`,
      })),
      products: productRows.map<Product>((row) => ({
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
          name: row.name || "Товар KimRamen",
          short_description: row.short_description,
          description: row.description,
        },
      })),
    };
  } finally {
    conn.release();
  }
}

export default async function CatalogCategoryPage({ params }: Params) {
  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isFinite(categoryId) || categoryId <= 0) notFound();

  const data = await getCategoryPageData(categoryId);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-[#EEE9EA] px-4 py-10 text-[#19191A] lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <nav className="mb-6 text-sm font-semibold text-black/50">
          <Link href="/" className="hover:text-black">
            Главная
          </Link>
          <span className="mx-2">›</span>
          <Link href="/catalog" className="hover:text-black">
            Каталог
          </Link>
          {data.parent ? (
            <>
              <span className="mx-2">›</span>
              <Link
                href={`/catalog/category/${data.parent.id}`}
                className="hover:text-black"
              >
                {data.parent.name}
              </Link>
            </>
          ) : null}
          <span className="mx-2">›</span>
          <span className="text-black">{data.category.name}</span>
        </nav>

        <section className="mb-8 rounded-[28px] bg-[#19191A] px-7 py-10 text-white shadow-xl lg:px-12 lg:py-14">
          <div className="flex min-h-[150px] flex-col gap-8 lg:min-h-[170px] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center">
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">
                {data.category.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {data.parent ? (
                <Link
                  href={`/catalog/category/${data.parent.id}`}
                  className="inline-flex h-16 min-w-[150px] items-center justify-center rounded-2xl border border-white/25 bg-[#151516] px-8 text-base font-black text-white shadow-[0_0_18px_rgba(255,255,255,0.45)] transition hover:-translate-y-0.5 hover:border-white/45 hover:bg-[#19191A] hover:shadow-[0_0_30px_rgba(255,255,255,0.65)]"
                >
                  ← {data.parent.name}
                </Link>
              ) : null}

              <Link
                href="/catalog"
                className="inline-flex h-16 min-w-[170px] items-center justify-center rounded-2xl border border-white/25 bg-[#151516] px-8 text-base font-black text-white shadow-[0_0_18px_rgba(255,255,255,0.45)] transition hover:-translate-y-0.5 hover:border-white/45 hover:bg-[#19191A] hover:shadow-[0_0_30px_rgba(255,255,255,0.65)]"
              >
                Все категории
              </Link>
            </div>
          </div>
        </section>

        {data.children.length ? (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black">Подкатегории</h2>
            <div className="flex flex-wrap gap-3">
              {data.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/catalog/category/${child.id}`}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:shadow-[0_0_22px_rgba(25,25,26,0.22)]"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Товары категории</h2>
            <span className="text-sm font-bold text-black/45">
              {data.products.length} товаров
            </span>
          </div>

          {data.products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-black">
                В этой категории пока нет товаров
              </h3>
              <p className="mt-3 text-base font-semibold text-black/50">
                Товары появятся здесь после синхронизации или ручного добавления
                в админке.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
