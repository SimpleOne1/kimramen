"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../product/productCard";
import type { Product } from "../../../models/product";
import MobileDots from "./MobileDots";

type Tab = "bestsellers" | "new";

export default function MobileProductsSection() {
  const [tab, setTab] = useState<Tab>("bestsellers");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products/home")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <section className="mx-auto mt-4 w-full">
      <div className="mb-3 flex justify-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setTab("bestsellers")}
          className={`h-7 min-w-0 flex-1 rounded-md px-2 text-[11px] font-bold shadow-sm ${tab === "bestsellers" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Бестселлеры
        </button>
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`h-7 min-w-0 flex-1 rounded-md px-2 text-[11px] font-bold shadow-sm ${tab === "new" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Новинки
        </button>
      </div>

      <div className="overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
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
