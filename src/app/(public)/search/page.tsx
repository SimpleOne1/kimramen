import CatalogListingView, { type CatalogQueryRecord } from "@/src/components/catalog/CatalogListingView";
import { getCatalogProducts, type CatalogSort } from "@/src/lib/catalog-products";

type PageProps = {
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

function asText(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || "").trim();
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = (await searchParams) || {};
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
    locale: "ru",
  });

  const title = searchText ? `Поиск по запросу «${searchText}»` : "Поиск товаров";
  const emptyText = searchText
    ? `По запросу «${searchText}» товары не найдены.`
    : "Введите название товара в поиске.";

  return (
    <CatalogListingView
      basePath="/search"
      query={query}
      title={title}
      breadcrumbLabel={title}
      products={searchText ? data.products : []}
      filters={data.filters}
      pagination={searchText ? data.pagination : { page: 1, limit: 16, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false }}
      emptyText={emptyText}
    />
  );
}
