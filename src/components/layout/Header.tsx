"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";
import CatalogMegaMenu from "../catalog/CatalogMegaMenu";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="w-full bg-[#19191A] text-white">
      <TopBar />

      <div className="border-b border-[#262628]">
        <div className="mx-auto flex h-[110px] max-w-[1440px] items-center gap-6 px-6 lg:gap-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/logo-white.png"
              alt="KIMRAMEN logo"
              width={200}
              height={60}
              priority
              className="h-[60px] w-auto"
            />
          </Link>

          <CatalogMegaMenu label={t("header.catalog", "Каталог товаров")} />

          <div className="hidden flex-1 lg:block">
            <form className="flex h-14 items-center rounded-[15px] bg-white pl-5 pr-1 shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="mr-3 flex-1 border-none bg-transparent text-[15px] leading-[18px] text-black/80 placeholder:text-black/60 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-[12px] px-3 py-1 text-[15px] leading-6 text-[#050404]"
              >
                <span className="hidden md:inline">{t("header.searchButton", "Найти")}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0067B9]">
                  <Image src="/images/icons/search.svg" alt="Search" width={20} height={20} />
                </span>
              </button>
            </form>
          </div>

          <div className="ml-auto hidden items-center gap-6 lg:flex">
            <Link href="/account" className="flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
              <div className="relative mb-1 h-6 w-6">
                <Image src="/images/icons/user.svg" alt={t("header.login")} fill />
              </div>
              <span>{t("header.login")}</span>
            </Link>

            <Link href="/favorites" className="relative flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
              <div className="relative mb-1 h-6 w-6">
                <Image src="/images/icons/heart.svg" alt={t("header.favorites")} fill className="text-white" />
                <span className="kr-badge">0</span>
              </div>
              <span>{t("header.favorites")}</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
              <div className="relative mb-1 h-6 w-6">
                <Image src="/images/icons/cart.svg" alt={t("header.cart")} fill />
                <span className="kr-badge">0</span>
              </div>
              <span>{t("header.cart", "Корзина")}</span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3 pt-2 lg:hidden">
          <form className="flex h-11 items-center rounded-[12px] bg-white pl-4 pr-1 shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="mr-2 flex-1 border-none bg-transparent text-sm text-black/80 placeholder:text-black/60 focus:outline-none"
            />
            <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0067B9]">
              <Image src="/images/icons/search.svg" alt="Search" width={18} height={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
