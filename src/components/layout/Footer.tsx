"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">

        {/* 3 CENTERED COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">

          {/* LEFT COLUMN */}
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="KIMRAMEN"
              width={90}
              height={45}
            />

            <p className="text-xs text-slate-500 mt-2">Следите за нами:</p>

            <div className="flex gap-3 text-lg justify-center">
              <span>📸</span>
              <span>📘</span>
              <span>▶️</span>
              <span>🐦</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">Мы принимаем:</p>

            <div className="flex gap-3 text-base justify-center">
              <span>Pay</span>
              <span>💳</span>
              <span>GooglePay</span>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="flex flex-col items-center text-sm gap-2">
            <span className="font-semibold text-red-500">
              {t("footer.help")}
            </span>

            <Link href="/blog" className="hover:text-slate-900">
              {t("footer.blog")}
            </Link>
            <Link href="/delivery" className="hover:text-slate-900">
              {t("footer.delivery")}
            </Link>
            <Link href="/payment" className="hover:text-slate-900">
              {t("footer.payment")}
            </Link>
            <Link href="/exchange-return" className="hover:text-slate-900">
              {t("footer.exchangeAndWarranty")}
            </Link>
            <Link href="/contacts" className="hover:text-slate-900">
              {t("footer.contacts")}
            </Link>
            <Link href="/public-offer" className="hover:text-slate-900">
              {t("footer.publicOffer")}
            </Link>
            <Link href="/about" className="hover:text-slate-900">
              {t("footer.aboutUs")}
            </Link>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col items-center text-sm text-slate-700 gap-1">
            <span className="font-semibold">Служба поддержки:</span>

            <span className="text-slate-600">0 800 338 92 92</span>
            <span className="text-slate-600">Пн–Вс: 9:00–22:00</span>

            <a
              href="mailto:customercare@kimramen.com.ua"
              className="underline hover:text-slate-700"
            >
              customercare@kimramen.com.ua
            </a>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="mt-10 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} KIMRAMEN CAFE-MARKET
        </div>
      </div>
    </footer>
  );
}