// src/components/layout/TopBar.tsx
// TopBar shows language switch, utility links and phone icon

"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function TopBar() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-slate-100 text-xs text-slate-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-6">
        
        {/* LEFT: Language switch */}
        <div className="flex items-center gap-2">
          <button className="rounded-sm bg-slate-300 px-2 py-1 font-semibold">
            Рус
          </button>

          <Link
            href="/en"
            className="px-2 py-1 text-slate-600 hover:text-slate-900"
          >
            Eng
          </Link>
        </div>

        {/* CENTER: Navigation links */}
       <nav className="hidden gap-6 text-[11px] sm:flex">
        <Link href="/promotions" className="hover:text-slate-900">
          {t("topBar.promo")}
        </Link>

        <Link href="/payment-delivery" className="hover:text-slate-900">
          {t("topBar.paymentAndDelivery")}
        </Link>

        <Link href="/exchange-return" className="hover:text-slate-900">
          {t("topBar.exchangeReturn")}
        </Link>

        <Link href="/loyalty" className="hover:text-slate-900">
          {t("topBar.loyaltyProgram")}
        </Link>

        <Link href="/contacts" className="hover:text-slate-900">
          {t("topBar.contacts")}
        </Link>
      </nav>

        {/* RIGHT: Phone with icon */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700">
          <Image
            src="/images/icons/phone.svg"
            alt="phone icon"
            width={14}
            height={14}
            className="opacity-80"
          />

          <a href="tel:08003389292" className="hover:underline">
            {t("topBar.phoneLabel")}
          </a>
        </div>
      </div>
    </div>
  );
}