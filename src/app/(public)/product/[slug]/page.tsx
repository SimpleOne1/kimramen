import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/src/lib/db";

type PageProps = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query<any[]>(
      `
      SELECT p.*, pt.name, pt.short_description, pt.description
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
      WHERE p.slug = ? AND p.is_active = 1
      LIMIT 1
      `,
      [slug]
    );
    if (!rows.length) return null;
    const images = await conn.query<any[]>(
      `SELECT path, alt_text, is_main, sort_order FROM product_images WHERE product_id = ? ORDER BY is_main DESC, sort_order ASC, id ASC`,
      [rows[0].id]
    );
    return { ...rows[0], images };
  } finally {
    conn.release();
  }
}

function money(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(0)} ${String(currency || "MDL").toLowerCase()}`;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const weight = product.weight_value ? `${Number(product.weight_value)}${product.weight_unit || ""}` : product.net_weight_grams ? `${product.net_weight_grams}г` : null;
  const name = [product.name, weight].filter(Boolean).join(" ");
  const mainImage = product.main_image || product.images?.[0]?.path || null;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
      <h1 className="max-w-5xl text-2xl font-bold leading-tight text-black lg:text-3xl">{name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <Link href="/" className="font-semibold text-black underline">Главная</Link>
        <span>•</span>
        <span>Новинки</span>
        {product.country_of_origin && <span>• {product.country_of_origin}</span>}
        {product.sku && <span>• Арт.{product.sku}</span>}
      </div>

      <section className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr_420px]">
        <div>
          <h2 className="text-xl font-bold leading-tight text-black">{name}</h2>
          <div className="mt-[260px] text-xs leading-5 text-black lg:mt-[300px]">
            {weight && <div>Вес / объём: {weight}</div>}
            {product.brand && <div>Торговая марка: {product.brand}</div>}
            {product.country_of_origin && <div>Страна: {product.country_of_origin}</div>}
          </div>
        </div>

        <div className="rounded-2xl border-4 border-sky-500 bg-white p-4">
          <div className="relative min-h-[440px] rounded-xl bg-white">
            {mainImage ? <Image src={mainImage} alt={name} fill className="object-contain p-8" /> : <div className="flex min-h-[440px] items-center justify-center text-gray-400">no image</div>}
          </div>
        </div>

        <aside className="flex items-center">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">● {Number(product.stock_quantity || 0) > 0 ? `В наличии ${product.stock_quantity} шт.` : "Нет в наличии"}</div>
            <div className="mt-5 rounded-3xl border border-gray-200 p-5">
              <div className="text-sm font-bold text-black">Цена:</div>
              {product.old_price && <div className="mt-2 text-xs text-gray-400 line-through">{money(product.old_price, product.currency)}</div>}
              <div className="mt-1 text-2xl font-bold text-black">{money(product.price, product.currency)}</div>
              <button className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-2xl text-white">+</button>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white">Характеристики</div>
          <div className="px-5 py-4 text-sm">Состав</div>
          <div className="px-5 py-4 text-sm">Условия хранения</div>
          <div className="px-5 py-4 text-sm">Доставка и оплата</div>
        </div>
        <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 lg:grid-cols-2">
          <div>
            <h3 className="font-bold text-black">Детали:</h3>
            <ul className="mt-4 space-y-2 text-sm text-black">
              {product.country_of_origin && <li>✓ Страна: {product.country_of_origin}</li>}
              {product.brand && <li>✓ Торговая марка: {product.brand}</li>}
              {weight && <li>✓ Вес: {weight}</li>}
              <li>✓ Проверено администратором</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black">Описание:</h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-black">{product.description || product.short_description || "Описание скоро появится."}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
