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

function asText(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || "").trim();
}

export default async function SearchPageContent({ query, locale, basePath }: Props) {
  const copy = getCatalogCopy(locale);
  const searchText = asText(query.q);
  const data = await getCatalogProducts({
    q: searchText || null,
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

  const title = searchText ? `${copy.searchTitle}: “${searchText}”` : copy.searchTitle;
  const emptyText = searchText
    ? `${locale === "ru" ? "По запросу" : locale === "en" ? "No products found for" : "Nu au fost găsite produse pentru"} “${searchText}”.`
    : copy.searchEmpty;

  return (
    <CatalogListingView
      basePath={basePath}
      query={query}
      title={title}
      breadcrumbLabel={title}
      products={searchText ? data.products : []}
      filters={data.filters}
      pagination={searchText ? data.pagination : { page: 1, limit: 16, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false }}
      emptyText={emptyText}
      locale={locale}
    />
  );
}
