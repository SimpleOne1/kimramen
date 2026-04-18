import Image from "next/image";
import Link from "next/link";
import ComponentCard from "@/src/components/admin/ui/common/ComponentCard";

type Product = {
  id: number;
  slug: string;
  main_image: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  min_order_qty: number;
  country_of_origin: string | null;
  brand: string | null;
  manufacturer: string | null;
  net_weight_grams: number | null;
  translations: {
    name: string;
    short_description: string | null;
    description: string | null;
  };
};

async function getProducts(): Promise<Product[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/products/home`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  return res.json();
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

export default async function AdminProductsPage() {
  const products = await getProducts();

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

      <ComponentCard title={`Всего товаров: ${products.length}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Товар
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Бренд
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
                  Страна
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
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                        {product.main_image ? (
                          <Image
                            src={product.main_image}
                            alt={product.translations?.name || product.slug}
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
                          {product.translations?.name || "Без названия"}
                        </div>
                        <div className="truncate text-sm text-gray-500">
                          {product.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                    {product.brand || "—"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4 text-sm font-medium text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.stock_quantity > 0
                          ? "bg-success-50 text-success-700"
                          : "bg-error-50 text-error-700"
                      }`}
                    >
                      {product.stock_quantity > 0
                        ? `${product.stock_quantity} шт.`
                        : "Нет в наличии"}
                    </span>
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                    {product.net_weight_grams
                      ? `${product.net_weight_grams} г`
                      : "—"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-700">
                    {product.country_of_origin || "—"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
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
        </div>
      </ComponentCard>
    </div>
  );
}