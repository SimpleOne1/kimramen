"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "../../product/productCard";
import type { Product } from "../../../models/product";
import MobileDots from "./MobileDots";

type Tab = "bestsellers" | "new";

export default function MobileProductsSection() {
  const [tab, setTab] = useState<Tab>("bestsellers");
  const [products, setProducts] = useState<Product[]>([]);
  const [tabDirection, setTabDirection] = useState<"next" | "previous">("next");
  const tabTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/products/home")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => () => {
    if (tabTimerRef.current) window.clearTimeout(tabTimerRef.current);
  }, []);

  function switchTab(nextTab: Tab) {
    if (nextTab === tab) return;

    setTabDirection(nextTab === "new" ? "next" : "previous");
    if (tabTimerRef.current) window.clearTimeout(tabTimerRef.current);
    tabTimerRef.current = window.setTimeout(() => {
      setTab(nextTab);
      tabTimerRef.current = null;
    }, 90);
  }

  return (
    <section className="mx-auto mt-4 w-full">
      <div className="mb-3 flex justify-center gap-2 px-3">
        <button
          type="button"
          onClick={() => switchTab("bestsellers")}
          className={`h-7 min-w-0 flex-1 rounded-md px-2 text-[11px] font-bold shadow-sm ${tab === "bestsellers" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Бестселлеры
        </button>
        <button
          type="button"
          onClick={() => switchTab("new")}
          className={`h-7 min-w-0 flex-1 rounded-md px-2 text-[11px] font-bold shadow-sm ${tab === "new" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Новинки
        </button>
      </div>

      <div className="overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          key={tab}
          className="flex gap-2"
          style={{
            animation: `krMobileTabSlide${tabDirection === "next" ? "Next" : "Previous"} 420ms cubic-bezier(0.22, 0.61, 0.36, 1) both`,
            animationDelay: "35ms",
          }}
        >
          {products.slice(0, 10).map((product, index) => (
            <div key={product.id} className="w-[calc((100vw-48px)/3)] min-w-[96px] max-w-[140px] shrink-0">
              <ProductCard compact product={product} index={index} />
            </div>
          ))}
        </div>
      </div>
      <MobileDots />
    </section>
  );
}
