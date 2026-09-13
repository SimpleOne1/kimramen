import CatalogPageContent from "@/src/components/catalog/CatalogPageContent";
import type { CatalogQueryRecord } from "@/src/components/catalog/CatalogListingView";

type PageProps = {
  searchParams?: Promise<CatalogQueryRecord>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const query = (await searchParams) || {};
  return <CatalogPageContent query={query} locale="ru" basePath="/catalog" />;
}
