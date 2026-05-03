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
    <section className="mt-6">
      <div className="mb-5 flex justify-center gap-5 px-2">
        <button
          type="button"
          onClick={() => setTab("bestsellers")}
          className={`h-11 min-w-[150px] rounded-lg px-5 text-[18px] font-bold shadow-lg ${tab === "bestsellers" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Бестселлеры
        </button>
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`h-11 min-w-[150px] rounded-lg px-5 text-[18px] font-bold shadow-lg ${tab === "new" ? "bg-[#0070c9] text-white" : "bg-white text-black ring-1 ring-black/30"}`}
        >
          Новинки
        </button>
      </div>

      <div className="overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-8">
          {products.slice(0, 10).map((product, index) => (
            <div key={product.id} className="w-[210px] shrink-0">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </div>
      <MobileDots />
    </section>
  );
}
