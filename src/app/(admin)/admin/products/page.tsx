import Image from "next/image";
import Link from "next/link";
import ComponentCard from "@/src/components/admin/ui/common/ComponentCard";
import TableScrollSync from "@/src/components/admin/ui/common/TableScrollSync";

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
  }>;
};

async function getProducts(
  page: number,
  limit: number
): Promise<ProductsResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/admin/products?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Не удалось загрузить товары админки");
  }

  const data = (await res.json()) as ProductsResponse;

  if (!data?.success || !Array.isArray(data.products)) {
    throw new Error("Некорректный ответ API /api/admin/products");
  }

  return data;
}

function formatPrice(price: number, currency: string = "EUR") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

function buildPageLink(page: number) {
  return `/admin/products?page=${page}`;
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
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
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
          href={buildPageLink(Math.max(1, page - 1))}
          className={`inline-flex min-w-[88px] items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            page === 1
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Назад
        </Link>

        {visiblePages.map((pageNumber, index) => {
          const prev = visiblePages[index - 1];
          const showDots = prev && pageNumber - prev > 1;

          return (
            <div key={pageNumber} className="flex items-center gap-2">
              {showDots && (
                <span className="px-1 text-sm text-gray-400">...</span>
              )}

              <Link
                href={buildPageLink(pageNumber)}
                className={`inline-flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                  pageNumber === page
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </Link>
            </div>
          );
        })}

        <Link
          href={buildPageLink(Math.min(totalPages, page + 1))}
          className={`inline-flex min-w-[88px] items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            page === totalPages
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Вперёд
        </Link>
      </div>
    </div>
  );
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const currentPage = Math.max(Number(params.page || 1), 1);
  const limit = 25;

  const data = await getProducts(currentPage, limit);

  const products = Array.isArray(data.products) ? data.products : [];

  const pagination = data.pagination ?? {
    page: currentPage,
    limit,
    total: products.length,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Товары</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление каталогом Kimramen
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Добавить товар
        </Link>
      </div>

      <ComponentCard
        title={`Всего товаров: ${pagination.total} | Страница ${pagination.page} из ${pagination.totalPages}`}
      >
        <div className="space-y-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
          />

          <TableScrollSync>
            <table className="min-w-[1100px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Товар
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Категория
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Цена
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Остаток
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Вес
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                    SKU
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="align-middle">
                    <td className="border-b border-gray-100 px-4 py-4">
                      <div className="flex min-w-[320px] items-center gap-3">
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
                          <div className="truncate font-medium text-gray-900">
                            {product.name || "Без названия"}
                          </div>
                          <div className="truncate text-sm text-gray-500">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                      <div className="min-w-[140px]">
                        {product.category || "—"}
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-4 text-sm font-medium text-gray-900">
                      <div className="min-w-[110px]">
                        {formatPrice(product.price, product.currency || "EUR")}
                      </div>
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
                          {product.stockQuantity > 0
                            ? `${product.stockQuantity} шт.`
                            : "Нет в наличии"}
                        </span>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                      <div className="min-w-[80px]">
                        {product.weightGrams ? `${product.weightGrams} г` : "—"}
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                      <div className="min-w-[90px]">
                        {product.sku || "—"}
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-4 text-right">
                      <div className="flex min-w-[210px] justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Открыть
                        </Link>

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                          Редактировать
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Товаров пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableScrollSync>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
          />
        </div>
      </ComponentCard>
    </div>
  );
}