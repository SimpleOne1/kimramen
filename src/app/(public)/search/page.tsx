import SearchPageContent from "@/src/components/catalog/SearchPageContent";
import type { CatalogQueryRecord } from "@/src/components/catalog/CatalogListingView";

type PageProps = {
  searchParams?: Promise<CatalogQueryRecord>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const query = (await searchParams) || {};
  return <SearchPageContent query={query} locale="ru" basePath="/search" />;
}
