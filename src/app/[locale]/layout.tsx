import { notFound } from "next/navigation";
import PublicLayout from "@/src/app/(public)/layout";
import { isLocale } from "@/src/lib/i18n/locale";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PublicLayout>{children}</PublicLayout>;
}
