"use client";

import { useEffect, useState } from "react";
import CatalogFilterSidebar, { type CatalogFilterData } from "./CatalogFilterSidebar";
import type { CatalogQueryRecord } from "./CatalogListingView";
import type { Locale } from "@/src/lib/i18n/locale";
import { getCatalogCopy } from "@/src/lib/i18n/catalog-copy";

type Props = {
  basePath: string;
  query: CatalogQueryRecord;
  filters: CatalogFilterData;
  locale?: Locale;
};

export default function CatalogMobileFilters({ basePath, query, filters, locale = "ru" }: Props) {
  const [open, setOpen] = useState(false);
  const copy = getCatalogCopy(locale);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-xl border border-[#ded9d5] bg-white px-4 text-[12px] font-bold text-[#222833] shadow-sm transition hover:border-[#19191A] lg:hidden"
      >
        {copy.filters}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ebe7e4] px-5 py-4">
              <div className="text-lg font-black text-[#222833]">{copy.filters}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f4f3] text-lg font-bold text-[#222833]"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(88vh-70px)] overflow-y-auto px-5 py-5">
              <CatalogFilterSidebar basePath={basePath} query={query} filters={filters} compact locale={locale} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
