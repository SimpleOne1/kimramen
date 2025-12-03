// src/components/layout/Header.tsx
// Основной хедер: логотип, каталог, поиск, действия пользователя

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isCatalogActive = pathname?.startsWith("/catalog");

  return (
    <header className="kr-header w-full">
      {/* Верхняя серая полоса (потом стилизуем отдельно) */}
      <TopBar />

      {/* Синяя полоса хедера */}
      <div className="kr-header-main bg-[#0067c7] text-white">
        {/* Внутренняя линия: логотип — каталог — поиск — вход — избранное — корзина */}
        <div className="kr-header-inner mx-auto flex w-full flex-nowrap items-center">
          {/* ЛОГОТИП KIMRAMEN */}
          <Link href="/" className="kr-header-logo flex items-center">
            <div className="kr-logo-box flex flex-col justify-center">
              <span className="kr-logo-main">
                KIMRAMEN
              </span>
              <div className="kr-logo-bottom">
                <span className="kr-logo-korean">
                  카페 마켓
                </span>
                <span className="kr-logo-subtitle">
                  CAFE·MARKET
                </span>
              </div>
            </div>
          </Link>

          {/* КНОПКА КАТАЛОГ */}
          <Link
            href="/catalog"
            className={`kr-header-catalog-btn ml-6 ${
              isCatalogActive ? "kr-header-catalog-btn--active" : ""
            }`}
          >
            <span className="kr-header-catalog-icon">
              ⬛
            </span>
            <span className="kr-header-catalog-text">
              {t("header.catalog")}
            </span>
          </Link>

          {/* ПОИСК ПО ЦЕНТРУ */}
          <div className="kr-header-search-wrapper">
            <div className="kr-header-search">
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="kr-header-search-input"
              />
              <button className="kr-header-search-button">
                🔍
              </button>
            </div>
          </div>

          {/* ДЕЙСТВИЯ СПРАВА */}
          <div className="kr-header-actions">
            <Link href="/account" className="kr-header-action-link">
              <span className="kr-header-action-icon">👤</span>
              <span className="kr-header-action-text">
                {t("header.login")}
              </span>
            </Link>

            <Link href="/favorites" className="kr-header-action-link">
              <span className="kr-header-action-icon">💙</span>
              <span className="kr-header-action-text">
                {t("header.favorites")}
              </span>
            </Link>

            <Link href="/cart" className="kr-header-cart">
              <span className="kr-header-cart-icon">🛒</span>
              <span className="kr-header-cart-count">0</span>
            </Link>
          </div>
        </div>

        {/* МОБИЛЬНЫЙ ПОИСК (пока оставим отдельно, можно будет потом допилить) */}
        <div className="kr-header-search-mobile lg:hidden">
          <div className="kr-header-search">
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="kr-header-search-input"
            />
            <button className="kr-header-search-button">
              🔍
            </button>
          </div>
        </div>
      </div>
      
    </header>
  );
}