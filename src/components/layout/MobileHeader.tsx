"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import KimramenNeonLogo from "../common/KimramenNeonLogo";

type Category = {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  sortOrder: number;
};

type MenuView = "main" | "catalog";

const menuLinks = [
  ["Акции", "/promotions"],
  ["Оплата и доставка", "/payment-and-shipping"],
  ["Обмен и возврат", "/exchange-return"],
  ["Контакты", "/contacts"],
  ["Личный кабинет", "/account"],
] as const;

const ICONS = {
  rice: "/images/catalog-icons/rice.png",
  noodles: "/images/catalog-icons/noodles.png",
  sauces: "/images/catalog-icons/sauces.png",
  ready: "/images/catalog-icons/ready.png",
  spices: "/images/catalog-icons/spices.png",
  snacks: "/images/catalog-icons/snacks.png",
  drinks: "/images/catalog-icons/drinks.png",
};

function normalized(value: string) {
  return value.toLowerCase().replace(/ё/g, "е");
}

function iconForCategory(category: Category) {
  const value = normalized(`${category.slug} ${category.name}`);

  if (value.includes("рис") || value.includes("rice")) return ICONS.rice;
  if (value.includes("лапш") || value.includes("noodle") || value.includes("ramen")) return ICONS.noodles;
  if (value.includes("соус") || value.includes("паст") || value.includes("sauce")) return ICONS.sauces;
  if (value.includes("готов") || value.includes("суп") || value.includes("салат")) return ICONS.ready;
  if (value.includes("спец") || value.includes("приправ") || value.includes("spice")) return ICONS.spices;
  if (value.includes("снек") || value.includes("snack") || value.includes("слад")) return ICONS.snacks;
  if (value.includes("напит") || value.includes("drink")) return ICONS.drinks;

  return ICONS.rice;
}

function CloseIcon() {
  return (
    <span className="relative block h-7 w-7" aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-[3px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[3px] w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-white" />
    </span>
  );
}

function BackIcon() {
  return (
    <span className="relative block h-7 w-9" aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-[3px] w-8 -translate-y-1/2 rounded-full bg-white/80" />
      <span className="absolute left-0 top-1/2 h-[3px] w-4 -translate-y-[7px] -rotate-45 rounded-full bg-white/80" />
      <span className="absolute left-0 top-1/2 h-[3px] w-4 translate-y-[4px] rotate-45 rounded-full bg-white/80" />
    </span>
  );
}

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogPath, setCatalogPath] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [menuDirection, setMenuDirection] = useState<"next" | "previous">("next");
  const [menuPageKey, setMenuPageKey] = useState(0);
  const categoriesRequestedRef = useRef(false);

  const rootCategories = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

  const visibleMainCategories = useMemo(() => {
    const kimRoot = rootCategories.find((category) =>
      normalized(`${category.slug} ${category.name}`).includes("kimramen"),
    );

    if (kimRoot) {
      const children = categories.filter((category) => category.parentId === kimRoot.id);
      if (children.length) return children;
    }

    if (rootCategories.length === 1) {
      const children = categories.filter((category) => category.parentId === rootCategories[0].id);
      if (children.length) return children;
    }

    return rootCategories;
  }, [categories, rootCategories]);

  const currentCatalogCategories = useMemo(() => {
    const parentId = catalogPath[catalogPath.length - 1];
    return parentId
      ? categories.filter((category) => category.parentId === parentId)
      : visibleMainCategories;
  }, [categories, catalogPath, visibleMainCategories]);

  function closeMenu() {
    setMenuOpen(false);
    setMenuView("main");
    setCatalogPath([]);
  }

  function transitionMenu(direction: "next" | "previous", update: () => void) {
    setMenuDirection(direction);
    setMenuPageKey((key) => key + 1);
    update();
  }

  function openCatalog() {
    transitionMenu("next", () => {
      setMenuView("catalog");
      setCatalogPath([]);
    });
    if (!categoriesRequestedRef.current && !categories.length) setIsLoadingCategories(true);
  }

  function goBackFromCatalog() {
    if (catalogPath.length) {
      transitionMenu("previous", () => setCatalogPath((path) => path.slice(0, -1)));
    } else {
      transitionMenu("previous", () => setMenuView("main"));
    }
  }

  function openCategory(categoryId: number) {
    transitionMenu("next", () => setCatalogPath((path) => [...path, categoryId]));
  }

  useEffect(() => {
    if (!menuOpen || menuView !== "catalog" || categories.length || categoriesRequestedRef.current) return;

    let alive = true;
    categoriesRequestedRef.current = true;

    fetch("/api/catalog/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (alive) setCategories(Array.isArray(data?.categories) ? data.categories : []);
      })
      .catch(() => {
        if (alive) setCategories([]);
      })
      .finally(() => {
        if (alive) setIsLoadingCategories(false);
      });

    return () => {
      alive = false;
    };
  }, [categories.length, isLoadingCategories, menuOpen, menuView]);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="bg-white px-0 pb-3 pt-3 lg:hidden">
        <div className="mx-auto flex h-14 w-[calc(100%-16px)] items-center justify-between rounded-[15px] bg-[#101A2B] px-3 shadow-[0_0_20px_rgba(16,26,43,0.28)]">
          <button
            type="button"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/10"
          >
            <span className="flex w-6 flex-col gap-[5px]">
              <span className="h-[2px] rounded-full bg-white" />
              <span className="h-[2px] rounded-full bg-white" />
              <span className="h-[2px] rounded-full bg-white" />
            </span>
          </button>

          <KimramenNeonLogo variant="mobile" className="shrink-0" />

          <Link
            href="/search"
            aria-label="Поиск"
            className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-black shadow-sm"
          >
            <Image src="/images/icons/search.svg" alt="" width={19} height={19} className="invert" />
          </Link>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeMenu}
          />

          <section className="absolute inset-0 flex flex-col overflow-hidden bg-[#171718] text-white shadow-2xl">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[#101A2B] px-5 shadow-[0_0_22px_rgba(255,255,255,0.10)]">
              <button
                type="button"
                aria-label="Назад"
                onClick={menuView === "catalog" ? goBackFromCatalog : undefined}
                className={`flex items-center gap-3 text-left focus:outline-none ${menuView === "catalog" ? "" : "pointer-events-none"}`}
              >
                {menuView === "catalog" ? <BackIcon /> : null}
                <span className="text-xl font-extrabold tracking-tight">{menuView === "catalog" ? "Каталог" : "Меню"}</span>
              </button>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={closeMenu}
                className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.10] text-2xl leading-none text-white shadow-[0_0_18px_rgba(255,255,255,0.18)] transition hover:bg-white/20 focus:outline-none"
              >
                <CloseIcon />
              </button>
            </div>

            <div
              key={`${menuView}-${catalogPath.join("-")}-${menuPageKey}`}
              className="min-h-0 flex-1 overflow-hidden"
              style={{
                animation: `krMobileMenuSlide${menuDirection === "next" ? "Next" : "Previous"} 360ms cubic-bezier(0.22, 0.61, 0.36, 1) both`,
                animationDelay: "20ms",
              }}
            >
            {menuView === "main" ? (
              <nav className="h-full overflow-y-auto overscroll-contain">
                <button
                  type="button"
                  onClick={openCatalog}
                  className="group flex min-h-[72px] w-full items-center gap-5 border-b border-white/10 px-5 text-left transition hover:bg-white/[0.06] focus:outline-none"
                >
                  <span className="flex-1 text-[19px] font-extrabold">Каталог</span>
                  <span className="text-3xl leading-none text-white/70 transition group-hover:translate-x-1">›</span>
                </button>

                {menuLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="group flex min-h-[72px] items-center gap-5 border-b border-white/10 px-5 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="flex-1 text-[19px] font-extrabold">{label}</span>
                    <span className="text-3xl leading-none text-white/70 transition group-hover:translate-x-1">›</span>
                  </Link>
                ))}
              </nav>
            ) : (
              <div className="h-full overflow-y-auto overscroll-contain">
                <div className="border-b border-white/10 bg-[#171718] px-5 py-4 text-sm font-semibold text-white/45">
                  {catalogPath.length ? "Выберите раздел" : "Категории товаров"}
                </div>

                {isLoadingCategories ? (
                  <div className="space-y-4 p-5" aria-label="Загрузка категорий">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-5">
                        <span className="h-14 w-14 animate-pulse rounded-2xl bg-white/10" />
                        <span className="h-5 flex-1 animate-pulse rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : currentCatalogCategories.length ? (
                  <nav>
                    {currentCatalogCategories.map((category) => {
                      const hasChildren = categories.some((item) => item.parentId === category.id);
                      const rowClass = "group flex min-h-[96px] w-full items-center gap-5 border-b border-white/10 px-5 text-left transition hover:bg-white/[0.06]";
                      const content = (
                        <>
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/[0.10] shadow-inner shadow-white/[0.05]">
                            <Image src={iconForCategory(category)} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
                          </span>
                          <span className="flex-1 text-[20px] font-extrabold leading-tight">{category.name}</span>
                          <span className="text-3xl leading-none text-white/70 transition group-hover:translate-x-1">›</span>
                        </>
                      );

                      if (hasChildren) {
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => openCategory(category.id)}
                            className={`${rowClass} ${category.id === catalogPath[catalogPath.length - 1] ? "bg-[#0F1A2B]" : ""}`}
                          >
                            {content}
                          </button>
                        );
                      }

                      return (
                        <Link key={category.id} href={`/catalog/category/${category.id}`} onClick={closeMenu} className={rowClass}>
                          {content}
                        </Link>
                      );
                    })}
                  </nav>
                ) : (
                  <div className="p-5 text-sm font-semibold leading-6 text-white/55">Категории пока недоступны.</div>
                )}

                {!catalogPath.length ? (
                  <Link href="/catalog" onClick={closeMenu} className="mx-5 my-5 flex min-h-14 items-center justify-center rounded-2xl border border-white/25 text-base font-extrabold transition hover:border-white hover:bg-white/[0.06]">
                    Все товары каталога
                  </Link>
                ) : null}
              </div>
            )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
