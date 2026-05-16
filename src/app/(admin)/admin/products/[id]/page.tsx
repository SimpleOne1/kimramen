import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const darkButtonStyle = {
  backgroundColor: "#101828",
  color: "#ffffff",
} as const;

type PageProps = { params: Promise<{ id: string }> };

async function getProduct(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${baseUrl}/api/admin/products/${id}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!response.ok) throw new Error("Не удалось загрузить товар");
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Не удалось загрузить товар");
  return data.product;
}

function money(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(0)} ${String(currency || "MDL").toLowerCase()}`;
}

function getWeight(product: any) {
  if (product.weightValue) return `${product.weightValue}${product.weightUnit || ""}`;
  if (product.netWeightGrams) return `${product.netWeightGrams}г`;
  return null;
}

export default async function AdminProductViewPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  const name = product.translations?.ru?.name || "Без названия";
  const image = product.mainImage || product.images?.[0]?.path || null;
  const weight = getWeight(product);
  const isInStock = Number(product.stockQuantity || 0) > 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Link href="/admin/products" className="text-sm font-semibold text-gray-500 hover:text-gray-900">
              ← Все товары
            </Link>
            <h1 className="mt-3 max-w-5xl break-words text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
              {name}{weight ? ` ${weight}` : ""}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
              {product.countryOfOrigin && <span className="rounded-full bg-gray-100 px-3 py-1.5">{product.countryOfOrigin}</span>}
              {product.brand && <span className="rounded-full bg-gray-100 px-3 py-1.5">{product.brand}</span>}
              {product.sku && <span className="rounded-full bg-gray-100 px-3 py-1.5">Арт. {product.sku}</span>}
              {product.syncSource && <span className="rounded-full bg-gray-100 px-3 py-1.5">Источник: {product.syncSource}</span>}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={`/admin/products/${product.id}/edit`}
              style={darkButtonStyle}
              className="inline-flex min-w-[150px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90"
            >
              Редактировать
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex min-w-[120px] items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Назад
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.75fr)_minmax(420px,0.85fr)]">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[90px_1fr]">
            <div className="order-2 grid grid-cols-4 gap-3 lg:order-1 lg:block lg:space-y-3">
              {(product.images?.length ? product.images : image ? [{ path: image }] : []).slice(0, 6).map((item: any) => (
                <div key={item.path} className="relative h-16 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <Image src={item.path} alt={name} fill className="object-contain p-2" />
                </div>
              ))}
            </div>

            <div className="relative order-1 min-h-[300px] overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 lg:order-2 lg:min-h-[360px]">
              {image ? (
                <Image src={image} alt={name} fill className="object-contain p-10" />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-3xl text-gray-400">no image</div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${isInStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {isInStock ? `В наличии ${product.stockQuantity} шт.` : "Нет в наличии"}
              </span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${product.isActive ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {product.isActive ? "Активен" : "Скрыт"}
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 p-5">
              <div className="text-sm font-semibold text-gray-500">Цена</div>
              {product.oldPrice ? <div className="mt-2 text-sm text-gray-400 line-through">{money(product.oldPrice, product.currency)}</div> : null}
              <div className="mt-1 text-4xl font-bold text-gray-900">{money(product.price, product.currency)}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Детали</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Страна" value={product.countryOfOrigin} />
              <Row label="Бренд" value={product.brand} />
              <Row label="Вес" value={weight} />
              <Row label="SKU" value={product.sku} />
              <Row label="Slug" value={product.slug} long />
              <Row label="Источник" value={product.syncSource} />
            </dl>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr]">
        <div className="hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm" aria-hidden="true">
          <div style={darkButtonStyle} className="rounded-2xl px-4 py-3 text-sm font-semibold">Характеристики</div>
          <div className="px-4 py-3 text-sm text-gray-700">Состав</div>
          <div className="px-4 py-3 text-sm text-gray-700">Условия хранения</div>
          <div className="px-4 py-3 text-sm text-gray-700">Доставка и оплата</div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Описание</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-700">
            {product.translations?.ru?.description || product.translations?.ru?.shortDescription || "Описание пока не заполнено."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, long = false }: { label: string; value?: string | null; long?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-gray-100 pb-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right font-semibold text-gray-900 ${long ? "break-all" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
