import CatalogPageContent from "@/src/components/catalog/CatalogPageContent";
import type { CatalogQueryRecord } from "@/src/components/catalog/CatalogListingView";
import { isLocale, type Locale } from "@/src/lib/i18n/locale";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<CatalogQueryRecord>;
};

export default async function LocalizedCatalogPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const query = (await searchParams) || {};
  const locale = rawLocale as Locale;

  return <CatalogPageContent query={query} locale={locale} basePath={`/${locale}/catalog`} />;
}
