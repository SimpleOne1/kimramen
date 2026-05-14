import Image from "next/image";
import Link from "next/link";
import ComponentCard from "@/src/components/admin/ui/common/ComponentCard";
import TableScrollSync from "@/src/components/admin/ui/common/TableScrollSync";
import ProductSyncButton from "@/src/components/admin/products/ProductSyncButton";

type AdminProduct = {
  id: number;
  externalId: string | null;
  sku: string | null;
  slug: string;
  name: string;
  category: string | null;
  price: number;
  stockQuantity: number;
  weightGrams: number | null;
  weightValue?: number | null;
  weightUnit?: string | null;
  isActive: boolean;
  mainImage?: string | null;
  currency?: string | null;
  brand?: string | null;
  countryOfOrigin?: string | null;
};

type ProductsResponse = {
  success: boolean;
  products: AdminProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

async function getProducts(
  page: number,
  limit: number,
  q: string
): Promise<ProductsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (q) {
    params.set("q", q);
  }

  const res = await fetch(`${baseUrl}/api/admin/products?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить товары админки");
  }

  const data = (await res.json()) as ProductsResponse;

  if (!data?.success || !Array.isArray(data.products)) {
    throw new Error("Некорректный ответ API /api/admin/products");
  }

  return data;
}

function formatPrice(price: number, currency: string = "MDL") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

function buildPageLink(page: number, q: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  return `/admin/products?${params.toString()}`;
}

function getVisiblePages(current: number, total: number) {
  const pages = new Set<number>();

  pages.add(1);
  pages.add(total);

  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) {
      pages.add(i);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function Pagination({
  page,
  totalPages,
  total,
  limit,
  q,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  q: string;
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm text-gray-500">
        Показано {startItem} - {endItem} из {total}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPageLink(Math.max(1, page - 1), q)}
          className={`inline-flex min-w-[88px] items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            page === 1
              ? "pointer-events-none border-gray-200 bg-white text-gray-300"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Назад
        </Link>

        {visiblePages.map((pageNumber, index) => {
          const prev = visiblePages[index - 1];
          const showDots = prev && pageNumber - prev > 1;
          const isActive = pageNumber === page;

          return (
            <div key={pageNumber} className="flex items-center gap-2">
              {showDots && <span className="px-1 text-sm text-gray-400">...</span>}

              <Link
                href={buildPageLink(pageNumber, q)}
                className={`inline-flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                style={isActive ? { color: "#ffffff" } : undefined}
              >
                {pageNumber}
              </Link>
            </div>
          );
        })}

        <Link
          href={buildPageLink(Math.min(totalPages, page + 1), q)}
          className={`inline-flex min-w-[88px] items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            page === totalPages
              ? "pointer-events-none border-gray-200 bg-white text-gray-300"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Вперёд
        </Link>
      </div>
    </div>
  );
}

function SearchProductsForm({ q }: { q: string }) {
  return (
    <form action="/admin/products" className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
      <div>
        <label htmlFor="product-search" className="mb-1.5 block text-sm font-medium text-gray-700">
          Поиск товаров
        </label>
        <input
          id="product-search"
          name="q"
          defaultValue={q}
          placeholder="Название, SKU, slug, бренд..."
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        style={{ color: "#ffffff" }}
      >
        Найти
      </button>

      {q ? (
        <Link
          href="/admin/products"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Сбросить
        </Link>
      ) : null}
    </form>
  );
}

function formatWeight(product: AdminProduct) {
  if (product.weightValue && product.weightUnit) return `${product.weightValue} ${product.weightUnit}`;
  if (product.weightGrams) return `${product.weightGrams} г`;
  return "—";
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const currentPage = Math.max(Number(params.page || 1), 1);
  const q = String(params.q || "").trim();
  const limit = 25;

  const data = await getProducts(currentPage, limit, q);
  const products = Array.isArray(data.products) ? data.products : [];

  const pagination = data.pagination ?? {
    page: currentPage,
    limit,
    total: products.length,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Товары</h1>
          <p className="mt-1 text-sm text-gray-500">Управление каталогом Kimramen</p>
        </div>

        <div className="flex flex-wrap items-start justify-end gap-3">
          <ProductSyncButton />
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            style={{ color: "#ffffff" }}
          >
            + Добавить товар
          </Link>
        </div>
      </div>

      <SearchProductsForm q={q} />

      <ComponentCard
        title={
          q
            ? `Найдено товаров: ${pagination.total} | Страница ${pagination.page} из ${pagination.totalPages}`
            : `Всего товаров: ${pagination.total} | Страница ${pagination.page} из ${pagination.totalPages}`
        }
      >
        <div className="space-y-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            q={q}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Кнопки “Открыть” и “Редактировать” теперь вынесены сразу после товара. Остальные данные находятся правее.
            </div>
            <TableScrollSync>
              <table className="min-w-[1320px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Товар
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Быстрые действия
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Цена
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Остаток
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Бренд
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Категория
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Вес
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                      SKU
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="align-middle transition hover:bg-gray-50/70">
                      <td className="border-b border-gray-100 px-4 py-4">
                        <div className="flex min-w-[380px] items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {product.mainImage ? (
                              <Image
                                src={product.mainImage}
                                alt={product.name || product.slug}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                no image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-900">{product.name || "Без названия"}</div>
                            <div className="truncate text-sm text-gray-500">{product.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4">
                        <div className="flex min-w-[220px] items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                          >
                            Открыть
                          </Link>

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                            style={{ color: "#ffffff" }}
                          >
                            Редактировать
                          </Link>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-sm font-medium text-gray-900">
                        <div className="min-w-[110px]">{formatPrice(product.price, product.currency || "MDL")}</div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4">
                        <div className="min-w-[120px]">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              product.stockQuantity > 0
                                ? "bg-success-50 text-success-700"
                                : "bg-error-50 text-error-700"
                            }`}
                          >
                            {product.stockQuantity > 0 ? `${product.stockQuantity} шт.` : "Нет в наличии"}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                        <div className="min-w-[130px] truncate">{product.brand || "—"}</div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                        <div className="min-w-[160px] truncate">{product.category || "—"}</div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                        <div className="min-w-[90px]">{formatWeight(product)}</div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                        <div className="min-w-[90px]">{product.sku || "—"}</div>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                        {q ? "По этому запросу товары не найдены" : "Товаров пока нет"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableScrollSync>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            q={q}
          />
        </div>
      </ComponentCard>
    </div>
  );
}
