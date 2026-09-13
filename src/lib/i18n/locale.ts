export const SUPPORTED_LOCALES = ["ru", "en", "ro"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  const segment = String(pathname || "").split("/")[1];
  return isLocale(segment) ? segment : "ru";
}

export function localizePath(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutLocale = normalized.replace(/^\/(?:en|ro)(?=\/|$)/, "") || "/";

  if (locale === "ru") return withoutLocale;
  return `/${locale}${withoutLocale === "/" ? "" : withoutLocale}`;
}
