import CatalogListingView, { type CatalogQueryRecord } from "./CatalogListingView";
import { getCatalogCopy } from "@/src/lib/i18n/catalog-copy";
import type { Locale } from "@/src/lib/i18n/locale";
import { getCatalogProducts, type CatalogSort } from "@/src/lib/catalog-products";

type Props = {
  query: CatalogQueryRecord;
  locale: Locale;
  basePath: string;
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
  return asArray(value).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
}

export default async function CatalogPageContent({ query, locale, basePath }: Props) {
  const copy = getCatalogCopy(locale);
  const data = await getCatalogProducts({
    page: asNumber(query.page) || 1,
    limit: 16,
    minPrice: asNumber(query.minPrice),
    maxPrice: asNumber(query.maxPrice),
    brands: asArray(query.brand),
    countries: asArray(query.country),
    categories: asIds(query.category),
    sort: ((Array.isArray(query.sort) ? query.sort[0] : query.sort) || "date_desc") as CatalogSort,
    locale,
  });

  return (
    <CatalogListingView
      basePath={basePath}
      query={query}
      title={copy.catalog}
      breadcrumbLabel={copy.catalog}
      products={data.products}
      filters={data.filters}
      pagination={data.pagination}
      emptyText={locale === "ru" ? "По выбранным фильтрам товары не найдены." : locale === "en" ? "No products match the selected filters." : "Nu există produse pentru filtrele selectate."}
      locale={locale}
    />
  );
}
