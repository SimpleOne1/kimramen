// src/components/providers/I18nProvider.tsx
// I18nProvider wraps app with I18nextProvider and syncs URL locale

"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";
import { usePathname } from "next/navigation";
import i18n from "@/src/i18n/i18n";

function LocaleSync() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split("/");
    const possibleLocale = segments[1];
    const lng = possibleLocale === "en" ? "en" : "ru";

    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  }, [pathname]);

  return null;
}

type I18nProviderProps = {
  children: React.ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleSync />
      {children}
    </I18nextProvider>
  );
}