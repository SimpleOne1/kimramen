// src/components/home/HomeProductsModule.tsx
"use client";

import { useEffect, useState } from "react";
import ProductCard from "../product/productCard"; // твой путь
import type { Product } from "../../models/product";

type Tab = "bestsellers" | "new";

export default function HomeProductsModule() {
  const [tab, setTab] = useState<Tab>("bestsellers");
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products/home")
      .then((res) => res.json())
      .then((data) => setAllProducts(data));
  }, []);

  // пока без реальных флагов is_bestseller / is_new — берём просто первые 10
  const products = allProducts.slice(0, 10);

  return (
    <section className="w-full mt-12">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setTab("bestsellers")}
          className={`px-6 py-2 rounded-full font-medium ${
            tab === "bestsellers"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Бестселлеры
        </button>

        <button
          type="button"
          onClick={() => setTab("new")}
          className={`px-6 py-2 rounded-full font-medium ${
            tab === "new"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Новинки
        </button>
      </div>

      {/* Grid: 5 карточек в ряд на lg → 2 строки по 5 при 10 товарах */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.map((p, index) => (
          <ProductCard
            key={p.id}
            product={p}
            index={index} // <-- вот здесь передаём индекс
          />
        ))}
      </div>
    </section>
  );
}