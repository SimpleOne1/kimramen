import { notFound } from "next/navigation";
import CatalogListingView, {
  type CatalogQueryRecord,
} from "@/src/components/catalog/CatalogListingView";
import {
  getCatalogCategoryById,
  getCatalogProducts,
  type CatalogSort,
} from "@/src/lib/catalog-products";
import { getCatalogCopy } from "@/src/lib/i18n/catalog-copy";
import { isLocale, type Locale } from "@/src/lib/i18n/locale";

type PageProps = {
  params: Promise<{ id: string; locale?: string }>;
  searchParams?: Promise<CatalogQueryRecord>;
};

function asArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",");
  return [];
}

function asNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function asIds(value: string | string[] | undefined) {
  return asArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: PageProps) {
  const { id, locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "ru";
  const categoryId = Number(id);

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    notFound();
  }

  const [query, category] = await Promise.all([
    searchParams ?? Promise.resolve({} as CatalogQueryRecord),
    getCatalogCategoryById(categoryId, locale),
  ]);

  if (!category) {
    notFound();
  }

  const data = await getCatalogProducts({
    categoryId,
    page: asNumber(query.page) || 1,
    limit: 16,
    minPrice: asNumber(query.minPrice),
    maxPrice: asNumber(query.maxPrice),
    brands: asArray(query.brand),
    countries: asArray(query.country),
    categories: asIds(query.category),
    sort: ((Array.isArray(query.sort) ? query.sort[0] : query.sort) ||
      "date_desc") as CatalogSort,
    locale,
  });

  return (
    <CatalogListingView
      basePath={`${locale === "ru" ? "" : `/${locale}`}/catalog/category/${categoryId}`}
      query={query}
      title={category.name}
      breadcrumbLabel={category.name}
      products={data.products}
      filters={data.filters}
      pagination={data.pagination}
      emptyText={getCatalogCopy(locale).nothingFound}
      locale={locale}
    />
  );
}
