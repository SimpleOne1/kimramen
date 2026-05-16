import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/src/lib/db";
import AddToCartButton from "@/src/components/product/AddToCartButton";
import CountryFlag from "@/src/components/product/CountryFlag";
import ProductCard from "@/src/components/product/productCard";
import type { Product } from "@/src/models/product";

type PageProps = { params: Promise<{ slug: string }> };

type ProductRow = {
  id: number;
  slug: string;
  sku: string | null;
  external_id: string | null;
  main_image: string | null;
  syrve_image_url: string | null;
  price: number | string;
  old_price: number | string | null;
  currency: string | null;
  stock_quantity: number | null;
  min_order_qty: number | null;
  net_weight_grams: number | null;
  weight_value: number | string | null;
  weight_unit: string | null;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  fat_amount: number | string | null;
  proteins_amount: number | string | null;
  carbohydrates_amount: number | string | null;
  energy_amount: number | string | null;
  fat_full_amount: number | string | null;
  proteins_full_amount: number | string | null;
  carbohydrates_full_amount: number | string | null;
  energy_full_amount: number | string | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
  category_name: string | null;
};

type ProductImage = {
  path: string;
  alt_text: string | null;
  is_main: number | boolean;
  sort_order: number | null;
};

type ProductDetails = ProductRow & { images: ProductImage[] };

type CartProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
};

function isNumericProductId(value: string): boolean {
  return /^\d+$/.test(value);
}

async function getProduct(slugOrId: string): Promise<ProductDetails | null> {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<ProductRow[]>(
      `
      SELECT
        p.*,
        pt.name,
        pt.short_description,
        pt.description,
        (
          SELECT ct.name
          FROM product_categories pc
          INNER JOIN category_translations ct ON ct.category_id = pc.category_id AND ct.locale = 'ru'
          WHERE pc.product_id = p.id
          ORDER BY pc.category_id ASC
          LIMIT 1
        ) AS category_name
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1
        AND (
          (p.slug = ? AND ? = 0)
          OR (p.id = ? AND ? = 1)
          OR p.external_id = ?
        )
      LIMIT 1
      `,
      [
        slugOrId,
        isNumericProductId(slugOrId) ? 1 : 0,
        isNumericProductId(slugOrId) ? Number(slugOrId) : -1,
        isNumericProductId(slugOrId) ? 1 : 0,
        slugOrId,
      ]
    );

    if (!rows.length) return null;

    const images = await conn.query<ProductImage[]>(
      `
      SELECT path, alt_text, is_main, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_main DESC, sort_order ASC, id ASC
      `,
      [rows[0].id]
    );

    return { ...rows[0], images };
  } finally {
    conn.release();
  }
}

async function getRelatedProducts(productId: number, limit = 4): Promise<Product[]> {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<any[]>(
      `
      SELECT
        p.id, p.slug, COALESCE(NULLIF(p.main_image, ''), NULLIF(p.syrve_image_url, '')) AS main_image, p.price, p.currency, p.stock_quantity,
        p.min_order_qty, p.country_of_origin, p.brand, p.manufacturer,
        p.net_weight_grams, pt.name, pt.short_description, pt.description
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.is_active = 1 AND p.id <> ?
      ORDER BY p.id DESC
      LIMIT ?
      `,
      [productId, limit]
    );

    return rows.map((row) => ({
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
  } finally {
    conn.release();
  }
}

function money(value: number | string | null | undefined, currency = "MDL") {
  return `${Number(value || 0).toFixed(0)} ${String(currency || "MDL").toLowerCase()}`;
}

function formatWeight(product: ProductDetails) {
  if (product.weight_value) return `${Number(product.weight_value)} ${product.weight_unit || ""}`.trim();
  if (product.net_weight_grams) return `${product.net_weight_grams} г`;
  return null;
}

function stripHtml(value: string | null | undefined) {
  return String(value || "").replace(/<[^>]+>/g, "").trim();
}

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNutritionValue(value: number | string | null | undefined, suffix: string) {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  return `${Number.isInteger(parsed) ? parsed.toFixed(0) : parsed.toFixed(1)} ${suffix}`;
}

function NutritionBlock({ product }: { product: ProductDetails }) {
  const per100 = [
    { label: "Белки", value: formatNutritionValue(product.proteins_amount, "г") },
    { label: "Жиры", value: formatNutritionValue(product.fat_amount, "г") },
    { label: "Углеводы", value: formatNutritionValue(product.carbohydrates_amount, "г") },
    { label: "Калорийность", value: formatNutritionValue(product.energy_amount, "ккал") },
  ].filter((item) => item.value !== null);

  const hasRealValues = per100.some((item) => {
    const numeric = Number(String(item.value).split(" ")[0]);
    return Number.isFinite(numeric) && numeric > 0;
  });

  if (!hasRealValues) {
    return (
      <div className="text-xs leading-5 text-black/70">
        <p className="mb-2 font-bold text-black">Пищевая ценность:</p>
        <p>Данные по БЖУ и калорийности пока не заполнены в Syrve для этого товара.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs leading-5 text-black/80">
      {per100.length > 0 && (
        <div>
          <p className="mb-2 font-bold text-black">Пищевая ценность на 100 г:</p>
          {per100.map((item) => <p key={item.label}>{item.label}: {item.value}</p>)}
        </div>
      )}
    </div>
  );
}

function ProductFacts({ product, weight }: { product: ProductDetails; weight: string | null }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-black/80">
      {product.country_of_origin && <li>✓ Страна: {product.country_of_origin}</li>}
      <li>✓ Без глютена</li>
      <li>✓ Веган</li>
      <li>✓ Органический</li>
      <li>✓ Содержит аллергены</li>
      {product.brand && <li>✓ Торговая марка: {product.brand}</li>}
      {weight && <li>✓ Вес / объём: {weight}</li>}
    </ul>
  );
}

function MobileAccordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-[22px] border border-black/15 bg-white px-5 py-4 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-black">
        {title}
        <span className="text-xl leading-none transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-4 border-t border-black/10 pt-4">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.id, 4);
  const weight = formatWeight(product);
  const name = [product.name || "Товар Kimramen", weight].filter(Boolean).join(" ");
  const mainImage = product.main_image || product.images?.[0]?.path || product.syrve_image_url || "/images/products/example1.png";
  const description = stripHtml(product.description || product.short_description) || "Описание скоро появится.";
  const inStock = Number(product.stock_quantity || 0) > 0;
  const cartProduct: CartProduct = {
    id: product.id,
    slug: product.slug,
    name,
    price: Number(product.price || 0),
    currency: product.currency || "MDL",
    image: mainImage,
  };

  return (
    <main className="relative z-[1] isolate overflow-hidden bg-white text-black">
      {/* MOBILE */}
      <div className="mx-auto max-w-[640px] px-4 pb-8 pt-5 lg:hidden">
        <h1 className="text-[24px] font-extrabold leading-[1.05] tracking-tight text-black">
          {name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-black/65">
          <Link href="/" className="underline underline-offset-2">Главная</Link>
          <span>›</span>
          <Link href="/catalog" className="underline underline-offset-2">Новинки</Link>
          <span>›</span>
          <span className="line-clamp-1 max-w-[260px] rounded bg-black/5 px-1.5 py-0.5">{name}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <CountryFlag country={product.country_of_origin} className="text-sm font-semibold" />
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-yellow-400">★★★★★</span>
            <span className="text-[#0067B9]">4 отзыва</span>
          </div>
        </div>

        <section className="relative mt-4">
          <div className="absolute right-0 top-2 z-10 flex flex-col gap-2">
            <button type="button" aria-label="Добавить в избранное" className="grid h-11 w-11 place-items-center rounded-xl border border-black/15 bg-white text-2xl text-[#E56A54] shadow-sm">♡</button>
            <button type="button" aria-label="Скопировать ссылку" className="grid h-11 w-11 place-items-center rounded-xl border border-black/15 bg-white text-lg shadow-sm">↗</button>
          </div>

          <div className="flex min-h-[370px] items-center justify-center rounded-[18px] border border-black/15 bg-white px-5 py-7 shadow-sm">
            <Image
              src={mainImage}
              alt={name}
              width={520}
              height={520}
              priority
              className="max-h-[310px] w-auto object-contain"
            />
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-black/15 bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
          <div className={`mb-4 flex items-center gap-2 text-sm font-extrabold ${inStock ? "text-[#0067B9]" : "text-[#E56A54]"}`}>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0067B9] text-[12px] text-white">✓</span>
            {inStock ? `В наличии ${Number(product.stock_quantity || 0)} шт.` : "Нет в наличии"}
          </div>

          <div className="rounded-[22px] border border-black/10 bg-white p-5">
            <p className="text-sm font-bold">Цена:</p>
            <div className="mt-2 flex items-center gap-2">
              {product.old_price && <span className="text-xs text-black/40 line-through">{money(product.old_price, product.currency || "MDL")}</span>}
              {product.old_price && <span className="rounded-full bg-[#E56A54] px-2 py-0.5 text-[11px] font-bold text-white">-25%</span>}
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-[28px] font-extrabold leading-none">{money(product.price, product.currency || "MDL")}</p>
              <AddToCartButton product={cartProduct} className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3">
          <MobileAccordion title="Характеристики" open>
            <ProductFacts product={product} weight={weight} />
          </MobileAccordion>

          <MobileAccordion title="Состав">
            <p className="text-sm leading-6 text-black/75">
              Состав пока не приходит в текущую модель синхронизации. В следующем патче можно добавить отдельное поле и подтягивать его из Syrve, если оно есть в сырой выгрузке.
            </p>
          </MobileAccordion>

          <MobileAccordion title="Описание" open>
            <p className="whitespace-pre-line text-sm leading-6 text-black/75">{description}</p>
          </MobileAccordion>

          <MobileAccordion title="Пищевая ценность">
            <NutritionBlock product={product} />
          </MobileAccordion>

          <MobileAccordion title="Доставка и оплата">
            <p className="text-sm leading-6 text-black/75">
              Доставка и оплата будут подключены к постоянному информационному блоку сайта. Сейчас это безопасная заглушка для коммерческого вида страницы.
            </p>
          </MobileAccordion>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-extrabold">Похожие товары</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 2).map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* DESKTOP */}
      <div className="mx-auto hidden max-w-[1440px] px-4 py-7 lg:block lg:px-10 lg:py-10">
        <h1 className="max-w-6xl text-2xl font-extrabold leading-tight tracking-tight lg:text-[30px]">
          {name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
          <Link href="/" className="text-black underline underline-offset-2">Главная</Link>
          <span>→</span>
          <Link href="/catalog" className="text-black underline underline-offset-2">Новинки</Link>
          {product.category_name && <><span>→</span><span>{product.category_name}</span></>}
          <span>→</span>
          <span className="line-clamp-1 max-w-[520px]">{name}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <CountryFlag country={product.country_of_origin} className="font-medium" />
          {product.brand && <span>· {product.brand}</span>}
          {product.sku && <span>· Арт.{product.sku}</span>}
          <span className="text-yellow-400">★★★★★</span>
        </div>

        <section className="mt-6 grid gap-7 lg:grid-cols-[280px_minmax(420px,1fr)_360px] lg:items-start">
          <aside>
            <h2 className="text-xl font-extrabold leading-tight lg:text-2xl">{name}</h2>
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:mt-[250px]">
              <NutritionBlock product={product} />
            </div>
          </aside>

          <div>
            <div className="relative flex min-h-[520px] items-center justify-center bg-white">
              <Image src={mainImage} alt={name} width={620} height={620} priority className="min-h-[350px] min-w-[350px] max-h-[520px] w-auto object-contain" />
            </div>
          </div>

          <aside className="lg:pt-[230px]">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
              <div className={`mb-4 flex items-center gap-2 text-sm font-bold ${inStock ? "text-[#0067B9]" : "text-[#E56A54]"}`}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0067B9] text-[11px] text-white">✓</span>
                {inStock ? `В наличии ${Number(product.stock_quantity || 0)} шт.` : "Нет в наличии"}
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-bold">Цена:</p>
                {product.old_price && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 line-through">{money(product.old_price, product.currency || "MDL")}</span>
                    <span className="rounded bg-[#E56A54] px-2 py-0.5 text-[10px] font-bold text-white">-25%</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between gap-4">
                  <p className="text-2xl font-extrabold">{money(product.price, product.currency || "MDL")}</p>
                  <AddToCartButton product={cartProduct} />
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-extrabold">Детали:</h3>
            <div className="mt-4"><ProductFacts product={product} weight={weight} /></div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-extrabold">Описание:</h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-800">{description}</p>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-extrabold">Похожие товары</h2>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
