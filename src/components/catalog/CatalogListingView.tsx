import Link from "next/link";
import ProductCard from "@/src/components/product/productCard";
import CatalogFilterSidebar, { type CatalogFilterData } from "./CatalogFilterSidebar";
import CatalogMobileFilters from "./CatalogMobileFilters";
import type { Product } from "@/src/models/product";

export type CatalogQueryRecord = Record<string, string | string[] | undefined>;

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type Props = {
  basePath: string;
  query: CatalogQueryRecord;
  title: string;
  breadcrumbLabel: string;
  products: Product[];
  filters: CatalogFilterData;
  pagination: Pagination;
  emptyText?: string;
};

function queryValues(query: CatalogQueryRecord, key: string) {
  const raw = query[key];
  if (Array.isArray(raw)) return raw.flatMap((item) => item.split(",")).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").filter(Boolean);
  return [];
}

function hrefWith(basePath: string, query: CatalogQueryRecord, changes: Record<string, string | number | null>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, raw]) => {
    if (Object.prototype.hasOwnProperty.call(changes, key)) return;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    values.forEach((value) => {
      if (String(value).trim()) params.append(key, String(value));
    });
  });

  Object.entries(changes).forEach(([key, value]) => {
    if (value === null || value === "") return;
    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function hrefWithoutOne(basePath: string, query: CatalogQueryRecord, key: string, value?: string | number) {
  const params = new URLSearchParams();
  const stringValue = value === undefined ? null : String(value);

  Object.entries(query).forEach(([queryKey, raw]) => {
    if (queryKey === "page") return;
    if (queryKey === key && stringValue === null) return;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    values.forEach((item) => {
      const parts = String(item).split(",").filter(Boolean);
      parts.forEach((part) => {
        if (queryKey === key && stringValue !== null && part === stringValue) return;
        params.append(queryKey, part);
      });
    });
  });

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}


function hrefOnly(basePath: string, values: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function findLabel(options: Array<{ id?: number; value?: string; name: string }>, value: string) {
  return options.find((option) => String(option.id ?? option.value ?? option.name) === value)?.name || value;
}

function ActiveFilters({ basePath, query, filters }: { basePath: string; query: CatalogQueryRecord; filters: CatalogFilterData }) {
  const chips: Array<{ label: string; href: string }> = [];

  queryValues(query, "category").forEach((value) => {
    chips.push({ label: findLabel(filters.categories, value), href: hrefWithoutOne(basePath, query, "category", value) });
  });
  queryValues(query, "brand").forEach((value) => {
    chips.push({ label: value, href: hrefWithoutOne(basePath, query, "brand", value) });
  });
  queryValues(query, "country").forEach((value) => {
    chips.push({ label: value, href: hrefWithoutOne(basePath, query, "country", value) });
  });
  if (query.minPrice || query.maxPrice) {
    chips.push({
      label: `${query.minPrice || filters.price.min} mdl - ${query.maxPrice || filters.price.max} mdl`,
      href: hrefWith(basePath, query, { minPrice: null, maxPrice: null, page: null }),
    });
  }

  if (!chips.length) return null;

  const searchQuery = Array.isArray(query.q) ? query.q[0] : query.q;
  const clearHref = hrefOnly(basePath, { q: searchQuery });

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <Link
        href={clearHref}
        scroll={false}
        className="inline-flex h-8 items-center rounded-lg border border-[#dad5d1] bg-white px-4 text-[12px] font-medium text-[#4b5563] transition hover:border-[#19191A]"
      >
        Очистить фильтр ×
      </Link>
      {chips.map((chip) => (
        <Link
          key={`${chip.label}-${chip.href}`}
          href={chip.href}
          scroll={false}
          className="inline-flex h-8 items-center rounded-lg border border-[#dad5d1] bg-white px-4 text-[12px] font-medium text-[#4b5563] transition hover:border-[#19191A]"
        >
          {chip.label} ×
        </Link>
      ))}
    </div>
  );
}

function SortAndView() {
  return (
    <div className="mb-7 flex items-center justify-between gap-4">
      {/* <Link
        href={hrefWith(basePath, query, { sort: "date_desc", page: null })}
        scroll={false}
        className="inline-flex h-10 items-center rounded-xl border border-[#ded9d5] bg-white px-4 text-[12px] font-medium text-[#4b5563] shadow-sm transition hover:border-[#19191A] hover:text-[#19191A] lg:hidden"
      >
        Дата добавления⌄
      </Link> */}
      {/* <div className="ml-auto flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-[#111827] bg-white text-[#111827] shadow-[0_6px_18px_rgba(17,24,39,0.12)]">
          <span className="grid grid-cols-2 gap-[3px]">
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />
          </span>
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#ddd8d4] bg-white text-[#777] shadow-sm">
          <span className="space-y-[3px]">
            <span className="block h-[2px] w-4 rounded bg-[#777]" />
            <span className="block h-[2px] w-4 rounded bg-[#777]" />
            <span className="block h-[2px] w-4 rounded bg-[#777]" />
          </span>
        </span>
      </div> */}
    </div>
  );
}

function CatalogPagination({ basePath, query, pagination }: { basePath: string; query: CatalogQueryRecord; pagination: Pagination }) {
  if (pagination.totalPages <= 1) return null;

  const current = pagination.page;
  const pages = Array.from(new Set([1, current - 1, current, current + 1, pagination.totalPages].filter((page) => page >= 1 && page <= pagination.totalPages)));

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-3">
      {pagination.hasPrevPage ? (
        <Link scroll={false} href={hrefWith(basePath, query, { page: current - 1 })} className="rounded-xl border border-[#ddd8d4] bg-white px-4 py-2 text-sm font-semibold text-[#303640] transition hover:border-[#111827]">
          Назад
        </Link>
      ) : null}
      {pages.map((page) => (
        <Link
          key={page}
          href={hrefWith(basePath, query, { page })}
          scroll={false}
          className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold transition ${page === current ? "border-2 border-[#111827] bg-white text-[#111827] shadow-[0_6px_18px_rgba(17,24,39,0.14)]" : "border border-[#ddd8d4] bg-white text-[#303640] hover:border-[#111827]"}`}
        >
          {page}
        </Link>
      ))}
      {pagination.hasNextPage ? (
        <Link scroll={false} href={hrefWith(basePath, query, { page: current + 1 })} className="rounded-xl border border-[#ddd8d4] bg-white px-4 py-2 text-sm font-semibold text-[#303640] transition hover:border-[#111827]">
          Вперёд
        </Link>
      ) : null}
    </nav>
  );
}

export default function CatalogListingView({ basePath, query, title, breadcrumbLabel, products, filters, pagination, emptyText }: Props) {
  const searchValue = Array.isArray(query.q) ? query.q[0] || "" : query.q || "";

  return (
    <main className="min-h-screen bg-white px-4 py-9 text-black lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14">
          <h1 className="mb-5 text-[34px] font-black leading-tight tracking-tight text-black md:text-[44px]">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[15px] font-bold text-black/35">
            <Link href="/" className="text-black underline underline-offset-2">Главная</Link>
            <span>•</span>
            <span>{breadcrumbLabel}</span>
          </div>
        </div>

        {basePath === "/search" ? (
          <form action="/search" method="get" className="mb-6 flex h-11 max-w-[620px] items-center rounded-xl border border-[#ded9d5] bg-white pl-3 pr-1 shadow-sm">
            <input
              type="search"
              name="q"
              defaultValue={searchValue}
              placeholder="Найти товар"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-black outline-none placeholder:text-black/40"
            />
            <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0067B9]">
              <span className="text-base text-white">⌕</span>
            </button>
          </form>
        ) : null}

        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <CatalogMobileFilters basePath={basePath} query={query} filters={filters} />
          <SortAndView />
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <CatalogFilterSidebar basePath={basePath} query={query} filters={filters} />

          <section className="min-w-0 flex-1">
            <div className="hidden lg:block"><SortAndView /></div>
            <ActiveFilters basePath={basePath} query={query} filters={filters} />

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-[#e5dfdb] bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-extrabold text-[#222833]">{emptyText || "Товары не найдены."}</p>
                <Link href={basePath} className="mt-5 inline-flex rounded-xl border-2 border-[#111827] bg-white px-5 py-3 text-sm font-extrabold text-[#111827] transition hover:bg-[#111827] hover:text-white">
                  Сбросить фильтры
                </Link>
              </div>
            )}

            <CatalogPagination basePath={basePath} query={query} pagination={pagination} />
          </section>
        </div>
      </div>
    </main>
  );
}
