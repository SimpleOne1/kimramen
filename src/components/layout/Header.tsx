"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";
import CatalogMegaMenu from "../catalog/CatalogMegaMenu";

type HeaderCustomer = {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
};

type CartItem = {
  quantity?: number;
};

const CART_KEY = "kimramen_cart";

function readCartCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const [customer, setCustomer] = useState<HeaderCustomer | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const customerLabel = useMemo(() => {
    if (!customer) return "";
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
    return fullName || customer.email || customer.phone || "Профиль";
  }, [customer]);

  useEffect(() => {
    let alive = true;

    async function loadCustomer() {
      try {
        const response = await fetch("/api/customer/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (!alive) return;
        setCustomer(data.customer || null);
      } catch {
        if (!alive) return;
        setCustomer(null);
      } finally {
        if (alive) setAuthLoaded(true);
      }
    }

    loadCustomer();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setCartCount(readCartCount());

    function handleCartUpdated() {
      setCartCount(readCartCount());
    }

    window.addEventListener("kimramen:cart-updated", handleCartUpdated);
    window.addEventListener("storage", handleCartUpdated);
    return () => {
      window.removeEventListener("kimramen:cart-updated", handleCartUpdated);
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadFavoritesCount() {
      if (!customer) {
        setFavoritesCount(0);
        return;
      }

      try {
        const response = await fetch("/api/customer/favorites?mode=ids", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!alive) return;
        setFavoritesCount(Number(data.count || 0));
      } catch {
        if (!alive) return;
        setFavoritesCount(0);
      }
    }

    loadFavoritesCount();

    function handleFavoritesUpdated(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (typeof detail?.count === "number") {
        setFavoritesCount(detail.count);
      } else {
        loadFavoritesCount();
      }
    }

    window.addEventListener("kimramen:favorites-updated", handleFavoritesUpdated);
    return () => {
      alive = false;
      window.removeEventListener("kimramen:favorites-updated", handleFavoritesUpdated);
    };
  }, [customer]);

  async function logout() {
    await fetch("/api/customer/auth/logout", { method: "POST" }).catch(() => null);
    setCustomer(null);
    setFavoritesCount(0);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

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
            {authLoaded && customer ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex items-center gap-2 text-[13px] font-bold leading-4 text-white transition hover:text-[#f5f5f5]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#19191A]">
                    <Image src="/images/icons/user.svg" alt="" width={18} height={18} className="invert" />
                  </span>
                  <span className="max-w-[150px] truncate">{customerLabel}</span>
                  <span className="text-xs">⌄</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl bg-white py-2 text-sm text-[#19191A] shadow-xl ring-1 ring-black/5">
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-3 transition hover:bg-slate-50">
                      Мой кабинет
                    </Link>
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-3 transition hover:bg-slate-50">
                      Мои заказы
                    </Link>
                    <Link href="/favorites" onClick={() => setMenuOpen(false)} className="block px-4 py-3 transition hover:bg-slate-50">
                      Избранное
                    </Link>
                    <button type="button" onClick={logout} className="block w-full px-4 py-3 text-left text-[#E64A35] transition hover:bg-red-50">
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/account" className="flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
                <div className="relative mb-1 h-6 w-6">
                  <Image src="/images/icons/user.svg" alt={t("header.login")} fill />
                </div>
                <span>{t("header.login")}</span>
              </Link>
            )}

            <Link href="/favorites" className="relative flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
              <div className="relative mb-1 h-6 w-6">
                <Image src="/images/icons/heart.svg" alt={t("header.favorites")} fill className="text-white" />
                <span className="kr-badge">{favoritesCount}</span>
              </div>
              <span>{t("header.favorites")}</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center text-[12px] font-bold leading-4 hover:text-[#f5f5f5]">
              <div className="relative mb-1 h-6 w-6">
                <Image src="/images/icons/cart.svg" alt={t("header.cart")} fill />
                <span className="kr-badge">{cartCount}</span>
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
