"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type CatalogFilterOption = {
  id?: number;
  value?: string;
  name: string;
  count: number;
};

export type CatalogFilterData = {
  selected: {
    q?: string | null;
    categoryId?: number | null;
    categories: number[];
    brands: string[];
    countries: string[];
    minPrice?: number | null;
    maxPrice?: number | null;
    sort: string;
  };
  price: { min: number; max: number };
  categories: CatalogFilterOption[];
  brands: CatalogFilterOption[];
  countries: CatalogFilterOption[];
};

type QueryValue = string | string[] | undefined;

type Props = {
  basePath: string;
  query: Record<string, QueryValue>;
  filters: CatalogFilterData;
  compact?: boolean;
};

function valuesOf(query: Record<string, QueryValue>, key: string) {
  const raw = query[key];
  if (Array.isArray(raw)) return raw.flatMap((item) => String(item).split(",")).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").filter(Boolean);
  return [];
}

function buildHref(basePath: string, query: Record<string, QueryValue>, changes: Record<string, string | number | null>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, raw]) => {
    if (key === "page") return;
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

function buildClearHref(basePath: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  const q = Array.isArray(query.q) ? query.q[0] : query.q;
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function buildToggleHref(basePath: string, query: Record<string, QueryValue>, key: string, value: string | number) {
  const current = valuesOf(query, key);
  const stringValue = String(value);
  const next = current.includes(stringValue)
    ? current.filter((item) => item !== stringValue)
    : [...current, stringValue];

  const params = new URLSearchParams();
  Object.entries(query).forEach(([queryKey, raw]) => {
    if (queryKey === "page" || queryKey === key) return;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    values.forEach((item) => {
      if (String(item).trim()) params.append(queryKey, String(item));
    });
  });
  next.forEach((item) => params.append(key, item));

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function HiddenValues({ query, exclude = [] }: { query: Record<string, QueryValue>; exclude?: string[] }) {
  return (
    <>
      {Object.entries(query).flatMap(([key, raw]) => {
        if (["page", ...exclude].includes(key)) return [];
        const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return values.map((value, index) => (
          <input key={`${key}-${index}-${value}`} type="hidden" name={key} value={String(value)} />
        ));
      })}
    </>
  );
}

function FilterCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mt-[2px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border transition ${
        checked ? "border-[#111827] bg-white shadow-[0_0_0_3px_rgba(17,24,39,0.08)]" : "border-[#e5e2df] bg-[#f2f1f0]"
      }`}
    >
      {checked ? <span className="h-1.5 w-1.5 rounded-[2px] bg-[#111827]" /> : null}
    </span>
  );
}

function FilterSection({
  title,
  children,
  withBorder = true,
}: {
  title: string;
  children: ReactNode;
  withBorder?: boolean;
}) {
  return (
    <section className={`${withBorder ? "border-b border-[#ebe7e4] pb-8" : "pb-4"}`}>
      <h3 className="mb-4 text-[15px] font-semibold text-[#222833]">{title}</h3>
      {children}
    </section>
  );
}

function useDebouncedText(value: string, delay = 180) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function OptionList({
  basePath,
  query,
  queryKey,
  options,
  selected,
  searchPlaceholder,
}: {
  basePath: string;
  query: Record<string, QueryValue>;
  queryKey: string;
  options: CatalogFilterOption[];
  selected: Array<string | number>;
  searchPlaceholder?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedText(search);
  const selectedSet = new Set(selected.map(String));
  const filteredOptions = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, debouncedSearch]);

  return (
    <div className="space-y-3">
      {searchPlaceholder ? (
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="mb-3 h-11 w-full rounded-xl bg-[#f5f4f3] px-4 text-[12px] text-[#333] outline-none placeholder:text-[#9b9692] focus:ring-2 focus:ring-[#19191A]/10"
        />
      ) : null}
      <div className="max-h-[190px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {filteredOptions.length > 0 ? filteredOptions.map((option) => {
          const rawValue = option.id ?? option.value ?? option.name;
          const checked = selectedSet.has(String(rawValue));
          return (
            <Link
              key={`${queryKey}-${rawValue}`}
              href={buildToggleHref(basePath, query, queryKey, rawValue)}
              scroll={false}
              className={`flex items-start justify-between gap-3 rounded-lg px-1 py-1 text-[13px] transition hover:text-[#111827] ${checked ? "font-semibold text-[#111827]" : "text-[#555b64]"}`}
            >
              <span className="flex min-w-0 items-start gap-2">
                <FilterCheckbox checked={checked} />
                <span className="line-clamp-2">{option.name}</span>
              </span>
              <span className="shrink-0 text-[#a19b96]">{option.count}</span>
            </Link>
          );
        }) : (
          <div className="rounded-xl bg-[#f8f6f5] px-4 py-3 text-[12px] font-medium text-[#9b9692]">
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogFilterSidebar({ basePath, query, filters, compact = false }: Props) {
  const min = Math.floor(filters.price.min || 0);
  const max = Math.ceil(filters.price.max || 0);
  const selectedMin = query.minPrice ? String(query.minPrice) : "";
  const selectedMax = query.maxPrice ? String(query.maxPrice) : "";
  const clearHref = buildClearHref(basePath, query);

  return (
    <aside className={compact ? "w-full" : "hidden w-full lg:block lg:w-[300px] lg:shrink-0"}>
      <div className={`${compact ? "" : "max-h-[calc(100vh-110px)] overflow-y-auto pr-2 [scrollbar-width:thin] lg:sticky lg:top-5"}`}>
        <div className="mb-7 flex items-center gap-3">
          {/* <Link
            href={buildHref(basePath, query, { sort: null })}
            scroll={false}
            className="inline-flex h-10 items-center rounded-xl border border-[#ded9d5] bg-white px-4 text-[12px] font-medium text-[#4b5563] shadow-sm transition hover:border-[#19191A] hover:text-[#19191A]"
          >
            Дата добавления⌄
          </Link> */}
          <Link
            href={clearHref}
            scroll={false}
            className="inline-flex h-10 items-center rounded-xl border border-[#ded9d5] bg-white px-4 text-[12px] font-bold text-[#222833] shadow-sm transition hover:border-[#19191A]"
          >
            Сбросить
          </Link>
        </div>

        {!compact ? <h2 className="mb-7 text-[22px] font-black text-[#222833]">Фильтры</h2> : null}

        <div className="space-y-8">
          <FilterSection title="Цена">
            <form action={basePath} className="space-y-4">
              <HiddenValues query={query} exclude={["minPrice", "maxPrice"]} />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex h-12 items-center rounded-xl bg-[#f5f4f3] px-4 text-[12px] text-[#8c8783]">
                  <input
                    name="minPrice"
                    defaultValue={selectedMin}
                    placeholder={String(min)}
                    inputMode="numeric"
                    className="min-w-0 flex-1 bg-transparent text-[#333] outline-none placeholder:text-[#8c8783]"
                  />
                  <span>mdl</span>
                </label>
                <label className="flex h-12 items-center rounded-xl bg-[#f5f4f3] px-4 text-[12px] text-[#8c8783]">
                  <input
                    name="maxPrice"
                    defaultValue={selectedMax}
                    placeholder={String(max)}
                    inputMode="numeric"
                    className="min-w-0 flex-1 bg-transparent text-[#333] outline-none placeholder:text-[#8c8783]"
                  />
                  <span>mdl</span>
                </label>
              </div>
              <div className="relative h-5">
                <div className="absolute left-1 right-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#19191A]" />
                <div className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-black" />
                <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-black" />
              </div>
              <button className="inline-flex h-9 items-center rounded-xl border-2 border-[#111827] bg-white px-4 text-[12px] font-bold text-[#111827] transition hover:bg-[#111827] hover:text-white" type="submit">
                Применить цену
              </button>
            </form>
          </FilterSection>

          <FilterSection title="Категория">
            <OptionList
              basePath={basePath}
              query={query}
              queryKey="category"
              options={filters.categories}
              selected={filters.selected.categories}
            />
          </FilterSection>

          <FilterSection title="Торговая марка">
            <OptionList
              basePath={basePath}
              query={query}
              queryKey="brand"
              options={filters.brands}
              selected={filters.selected.brands}
              searchPlaceholder="Поиск по торговой марке"
            />
          </FilterSection>

          <FilterSection title="Страна" withBorder={false}>
            <OptionList
              basePath={basePath}
              query={query}
              queryKey="country"
              options={filters.countries}
              selected={filters.selected.countries}
              searchPlaceholder="Поиск по стране производства"
            />
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}
