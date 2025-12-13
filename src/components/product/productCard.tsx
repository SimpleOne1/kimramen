// src/components/catalog/ProductCard.tsx
"use client";

import Image from "next/image";
const HeartIcon = "/images/icons/heart-orange.svg";
import type { Product } from "../../models/product";

interface Props {
  product: Product;
  index?: number; // для первых пяти товаров
}

export default function ProductCard({ product, index }: Props) {
  const imageSrc = product.main_image || "/images/placeholder-product.png";

  // показываем “старую цену” только для первых 5 товаров
  const showDiscount = typeof index === "number" && index < 5;
  const oldPrice = showDiscount ? product.price * 1.25 : null;

  const currencyLabel =
    product.currency.toLowerCase() === "mdl"
      ? "mdl"
      : product.currency;

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-300 p-4 flex flex-col hover:shadow-md transition">

      {/* Heart */}
      <button
        type="button"
        className="absolute top-3 right-3"
        aria-label="Добавить в избранное"
      >
        <Image src={HeartIcon} alt="" width={20} height={20} />
      </button>

      {/* Image */}
      <div className="w-full h-40 flex items-center justify-center mb-3">
        <Image
          src={imageSrc}
          alt={product.translations.name}
          width={200}
          height={160}
          className="object-contain"
        />
      </div>

      {/* 🔥 WEIGHT BADGE — Жёлтый прямоугольник */}
      {product.net_weight_grams && (
        <div className="mb-2">
          <span className="
            inline-flex items-center justify-center
            h-[18px] px-2 rounded-[4px]
            text-[11px] font-medium
            bg-[var(--sunray-yellow)]
            text-black
          ">
            {product.net_weight_grams} g
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold line-clamp-2 text-sm mb-2">
        {product.translations.name}
      </h3>

      {/* Доп. инфо */}
      <div className="flex items-center text-xs text-gray-500 gap-2 mb-1">
        {product.country_of_origin && <span>{product.country_of_origin}</span>}
        <span className="opacity-60">#{product.slug}</span>
      </div>

      {/* Старая цена + бэйдж 25% */}
      {showDiscount && oldPrice && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400 line-through">
            {oldPrice.toFixed(0)} {currencyLabel}
          </span>
          <span className="h-[18px] w-[42px] rounded-[4px] bg-[var(--terracotta-accent)] text-[10px] leading-none text-white flex items-center justify-center">
            25%
          </span>
        </div>
      )}

      {/* Price + button */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-lg font-semibold">
          {product.price} {currencyLabel}
        </span>

        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-md text-xl shadow-md shadow-gray-400/60"
        >
          +
        </button>
      </div>
    </div>
  );
}