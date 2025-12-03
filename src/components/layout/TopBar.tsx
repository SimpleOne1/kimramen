// src/components/layout/TopBar.tsx
// TopBar shows language switch and utility links

"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function TopBar() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-slate-100 text-xs text-slate-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-6">
        <div className="flex items-center gap-2">
          {/* active Russian */}
          <button className="rounded-sm bg-slate-300 px-2 py-1 font-semibold">
            Рус
          </button>
          {/* link to English locale */}
          <Link
            href="/en"
            className="px-2 py-1 text-slate-600 hover:text-slate-900"
          >
            Eng
          </Link>
        </div>

        <nav className="hidden gap-4 text-[11px] sm:flex">
          <Link href="/promotions" className="hover:text-slate-900">
            {t("topBar.promo")}
          </Link>
          <Link href="/delivery" className="hover:text-slate-900">
            {t("topBar.delivery")}
          </Link>
          <Link href="/payment" className="hover:text-slate-900">
            {t("topBar.payment")}
          </Link>
          <Link href="/exchange-return" className="hover:text-slate-900">
            {t("topBar.exchangeAndWarranty")}
          </Link>
        </nav>

        <div className="text-[11px] font-semibold text-sky-700">
          <a href="tel:08003389292">{t("topBar.phoneLabel")}</a>
        </div>
      </div>
    </div>
  );
}