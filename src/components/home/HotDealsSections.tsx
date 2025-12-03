// src/components/home/HotDealsSection.tsx
// HotDealsSection shows list of mocked products for promo

"use client";

import { useTranslation } from "react-i18next";

type Product = {
  id: string;
  name: string;
  price: string;
};

const mockProducts: Product[] = [
  { id: "p1", name: "Лапша рамен классическая 120 г", price: "119 ₴" },
  { id: "p2", name: "Соус острый чили 250 мл", price: "89 ₴" },
  { id: "p3", name: "Снеки кукурузные 80 г", price: "49 ₴" },
  { id: "p4", name: "Напиток лимонный 0.5 л", price: "39 ₴" },
  { id: "p5", name: "Лапша рамен кимчи 120 г", price: "129 ₴" },
  { id: "p6", name: "Соус соевый классический", price: "79 ₴" },
  { id: "p7", name: "Снеки картофельные", price: "55 ₴" },
  { id: "p8", name: "Напиток манго 0.5 л", price: "45 ₴" }
];

export default function HotDealsSection() {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">
        {t("home.hotDealsTitle")}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {mockProducts.map((product) => (
          <article
            key={product.id}
            className="flex flex-col rounded-lg bg-white p-3 text-xs shadow-sm hover:shadow-md"
          >
            <div className="mb-2 h-24 w-full rounded-md bg-slate-100" />
            <h3 className="mb-1 line-clamp-3 text-[11px] font-semibold">
              {product.name}
            </h3>
            <div className="mt-auto text-sm font-bold text-[#0067c7]">
              {product.price}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}