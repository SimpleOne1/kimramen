"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Category = {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  sortOrder: number;
};

type ProductPreview = {
  id: number;
  slug: string;
  main_image: string | null;
  price: number;
  currency: string;
  net_weight_grams: number | null;
  translations: { name: string | null };
};

type Props = {
  label?: string;
};

const ICONS = {
  rice: "/images/catalog-icons/rice.png",
  noodles: "/images/catalog-icons/noodles.png",
  sauces: "/images/catalog-icons/sauces.png",
  ready: "/images/catalog-icons/ready.png",
  spices: "/images/catalog-icons/spices.png",
  snacks: "/images/catalog-icons/snacks.png",
};

function normalized(value: string) {
  return value.toLowerCase().replace(/ё/g, "е");
}

function iconForCategory(category: Category) {
  const value = normalized(`${category.slug} ${category.name}`);

  if (value.includes("рис") || value.includes("rice")) return ICONS.rice;
  if (
    value.includes("лапш") ||
    value.includes("noodle") ||
    value.includes("ramen")
  )
    return ICONS.noodles;
  if (
    value.includes("соус") ||
    value.includes("паст") ||
    value.includes("sauce")
  )
    return ICONS.sauces;
  if (
    value.includes("готов") ||
    value.includes("суп") ||
    value.includes("салат")
  )
    return ICONS.ready;
  if (
    value.includes("спец") ||
    value.includes("приправ") ||
    value.includes("spice")
  )
    return ICONS.spices;
  if (
    value.includes("снек") ||
    value.includes("snack") ||
    value.includes("слад")
  )
    return ICONS.snacks;

  return ICONS.rice;
}

function money(value: number, currency = "MDL") {
  const label = currency.toLowerCase() === "mdl" ? "mdl" : currency;
  return `${Number(value || 0).toFixed(0)} ${label}`;
}

function CategorySkeleton() {
  return (
    <div className="space-y-4 p-5" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 flex-1 animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="mb-3 h-28 animate-pulse rounded-xl bg-white/10" />
          <div className="mb-2 h-4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function CatalogMegaMenu({ label = "Каталог товаров" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const loadedOnceRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const rootCategories = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

  const visibleMainCategories = useMemo(() => {
    const kimRoot = rootCategories.find((category) =>
      normalized(`${category.slug} ${category.name}`).includes("kimramen"),
    );

    if (kimRoot) {
      const rootChildren = categories.filter(
        (category) => category.parentId === kimRoot.id,
      );
      if (rootChildren.length) return rootChildren;
    }

    if (rootCategories.length === 1) {
      const rootChildren = categories.filter(
        (category) => category.parentId === rootCategories[0].id,
      );
      if (rootChildren.length) return rootChildren;
    }

    return rootCategories;
  }, [categories, rootCategories]);

  const getChildrenOf = useCallback(
    (categoryId: number | null) => {
      if (!categoryId) return [];
      return categories.filter((category) => category.parentId === categoryId);
    },
    [categories],
  );

  const activeCategory = useMemo(
    () =>
      categories.find((category) => category.id === activeId) ||
      visibleMainCategories[0] ||
      null,
    [activeId, categories, visibleMainCategories],
  );

  const activeSubcategories = useMemo(
    () => getChildrenOf(activeCategory?.id ?? null),
    [activeCategory?.id, getChildrenOf],
  );

  const activeChildCategory = useMemo(
    () => categories.find((category) => category.id === activeChildId) || null,
    [activeChildId, categories],
  );

  const productPreviewCategory = activeChildCategory || activeCategory;

  const loadCategories = useCallback(async () => {
    if (loadedOnceRef.current || isLoadingCategories) return;

    setIsLoadingCategories(true);
    try {
      const response = await fetch("/api/catalog/categories", {
        cache: "no-store",
      });
      const data = await response.json();
      const nextCategories = Array.isArray(data?.categories)
        ? data.categories
        : [];
      setCategories(nextCategories);
      setActiveId((current) => {
        if (current) return current;

        const roots = nextCategories.filter(
          (item: Category) => item.parentId === null,
        );
        const kimRoot = roots.find((item: Category) =>
          normalized(`${item.slug} ${item.name}`).includes("kimramen"),
        );

        const firstVisible = kimRoot
          ? nextCategories.find(
              (item: Category) => item.parentId === kimRoot.id,
            )
          : roots.length === 1
            ? nextCategories.find(
                (item: Category) => item.parentId === roots[0].id,
              )
            : roots[0];

        return firstVisible?.id ?? null;
      });
      loadedOnceRef.current = true;
    } catch (error) {
      console.error("Catalog categories loading error:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [isLoadingCategories]);

  useEffect(() => {
    if (isOpen) void loadCategories();
  }, [isOpen, loadCategories]);

  useEffect(() => {
    if (!productPreviewCategory?.id) return;

    const controller = new AbortController();

    async function loadProducts() {
      setIsLoadingProducts(true);
      try {
        const response = await fetch(
          `/api/catalog/categories/${productPreviewCategory!.id}/products?limit=12`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const data = await response.json();
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Catalog products loading error:", error);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingProducts(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [productPreviewCategory?.id]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className="hidden shrink-0 lg:block"
      onMouseEnter={() => void loadCategories()}
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`flex h-14 items-center gap-3 rounded-[15px] px-6 text-sm font-bold transition ${
          isOpen
            ? "bg-[#2C2C2D] text-white shadow-[0_0_22px_rgba(255,255,255,0.72),0_0_10px_rgba(255,255,255,0.6)] ring-1 ring-white/70"
            : "bg-[#0067B9] text-white shadow-[0_0_16px_#0067B9,0_0_10px_#0067B9,0_0_6px_#0067B9] hover:brightness-110"
        }`}
        aria-expanded={isOpen}
      >
        <span className="grid h-5 w-5 place-items-center text-xl leading-none">
          {isOpen ? "×" : "☰"}
        </span>
        <span>{label}</span>
      </button>

      {isOpen && (
        <div
          className="fixed left-0 right-0 top-[132px] z-50 px-10 text-white"
          onWheel={(event) => event.stopPropagation()}
        >
          <div
            className="mx-auto w-full max-w-[calc(100vw-80px)] overflow-hidden rounded-xl border border-white/10 bg-[#151516] shadow-2xl"
            style={{ animation: "krMegaMenuIn 160ms ease-out" }}
          >
            <div className="grid h-[calc(100vh-155px)] min-h-[520px] grid-cols-[300px_320px_minmax(0,1fr)] overflow-hidden">
              <aside className="h-full overflow-y-auto overscroll-contain border-r border-white/10 bg-[#232324] custom-scrollbar">
                {isLoadingCategories && !categories.length ? (
                  <CategorySkeleton />
                ) : (
                  <nav className="py-3">
                    {visibleMainCategories.map((category) => {
                      const isActive = category.id === activeCategory?.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onMouseEnter={() => {
                            setActiveId(category.id);
                            setActiveChildId(null);
                          }}
                          onClick={() => {
                            setActiveId(category.id);
                            setActiveChildId(null);
                          }}
                          className={`flex w-full items-center gap-4 border-b border-white/10 px-5 py-4 text-left transition ${
                            isActive ? "bg-[#0F1A2B]" : "hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                            <Image
                              src={iconForCategory(category)}
                              alt=""
                              width={26}
                              height={26}
                              className="h-7 w-7 object-contain opacity-90"
                            />
                          </span>
                          <span className="min-w-0 flex-1 text-[16px] font-bold leading-tight">
                            {category.name}
                          </span>
                          <span className="text-2xl leading-none text-white/70">
                            ›
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                )}
              </aside>

              <aside className="h-full overflow-y-auto overscroll-contain border-r border-white/10 bg-[#1B1B1C] p-5 custom-scrollbar">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                    Подкатегории
                  </h3>
                  {activeCategory ? (
                    <Link
                      href={`/catalog/category/${activeCategory.id}`}
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-black text-white/45 transition hover:text-white"
                    >
                      Вся категория
                    </Link>
                  ) : null}
                </div>

                {activeSubcategories.length ? (
                  <nav className="space-y-2">
                    {activeSubcategories.map((subcategory) => {
                      const isActive =
                        subcategory.id === activeChildCategory?.id;
                      return (
                        <Link
                          key={subcategory.id}
                          href={`/catalog/category/${subcategory.id}`}
                          onMouseEnter={() => setActiveChildId(subcategory.id)}
                          onClick={() => setIsOpen(false)}
                          className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-extrabold leading-5 transition duration-200 ${
                            isActive
                              ? "border-white/65 bg-[#2C2C2D] text-white shadow-[0_0_18px_rgba(255,255,255,0.46),0_0_8px_rgba(255,255,255,0.34)] ring-1 ring-white/40"
                              : "border-transparent text-white/85 hover:border-white/45 hover:bg-[#2C2C2D] hover:text-white hover:shadow-[0_0_14px_rgba(255,255,255,0.32),0_0_6px_rgba(255,255,255,0.22)] hover:ring-1 hover:ring-white/25"
                          }`}
                        >
                          <span className="min-w-0">{subcategory.name}</span>
                          <span
                            className={
                              isActive
                                ? "text-white/75"
                                : "text-white/40 group-hover:text-white/75"
                            }
                          >
                            ›
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm font-semibold leading-6 text-white/45">
                    У этой категории пока нет подкатегорий. Товары показаны
                    справа.
                  </div>
                )}
              </aside>

              <section className="h-full overflow-y-auto overscroll-contain p-8 custom-scrollbar">
                <div className="mb-7 flex items-center justify-between gap-6 border-b border-white/10 pb-7">
                  <h2 className="min-w-0 text-4xl font-black tracking-tight">
                    {productPreviewCategory?.name || "Каталог"}
                  </h2>
                  <Link
                    href={
                      productPreviewCategory
                        ? `/catalog/category/${productPreviewCategory.id}`
                        : "/catalog"
                    }
                    onClick={() => setIsOpen(false)}
                    className="shrink-0 rounded-3xl border border-white/25 bg-transparent px-8 py-4 text-base font-black text-white transition duration-200 hover:border-white/80 hover:shadow-[0_0_18px_rgba(255,255,255,0.45),0_0_8px_rgba(255,255,255,0.35)] hover:ring-1 hover:ring-white/40"
                  >
                    Перейти в категорию
                  </Link>
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-white/35">
                    Товары категории
                  </h3>
                  {isLoadingProducts ? (
                    <ProductSkeleton />
                  ) : products.length ? (
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                      {products.map((product) => {
                        const name =
                          product.translations?.name || "Товар KimRamen";
                        return (
                          <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            onClick={() => setIsOpen(false)}
                            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                          >
                            <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-white">
                              <Image
                                src={
                                  product.main_image ||
                                  "/images/products/example1.png"
                                }
                                alt={name}
                                width={150}
                                height={110}
                                className="max-h-24 w-auto object-contain transition group-hover:scale-[1.04]"
                              />
                            </div>
                            <div className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5">
                              {name}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className="text-base font-black">
                                {money(product.price, product.currency)}
                              </span>
                              {product.net_weight_grams ? (
                                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-white/60">
                                  {product.net_weight_grams} g
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm font-semibold leading-6 text-white/45">
                      В этой категории пока нет активных товаров.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <style jsx global>{`
            @keyframes krMegaMenuIn {
              from {
                opacity: 0;
                transform: translateY(-8px) scale(0.985);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
