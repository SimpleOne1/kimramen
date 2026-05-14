// src/components/catalog/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
const HeartIcon = "/images/icons/heart-orange.svg";
import type { Product } from "../../models/product";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index }: Props) {
  const imageSrc = product.main_image || "/images/placeholder-product.png";
  const showDiscount = typeof index === "number" && index < 5;
  const oldPrice = showDiscount ? product.price * 1.25 : null;
  const currencyLabel = product.currency.toLowerCase() === "mdl" ? "mdl" : product.currency;

  return (
    <Link href={`/product/${product.slug}`} className="relative flex flex-col rounded-xl border border-gray-300 bg-white p-4 shadow-sm transition hover:shadow-md">
      <span className="absolute right-3 top-3" aria-label="Добавить в избранное">
        <Image src={HeartIcon} alt="" width={20} height={20} />
      </span>

      <div className="mb-3 flex h-40 w-full items-center justify-center">
        <Image src={imageSrc} alt={product.translations.name} width={200} height={160} className="object-contain" />
      </div>

      {product.net_weight_grams && (
        <div className="mb-2">
          <span className="inline-flex h-[18px] items-center justify-center rounded-[4px] bg-[var(--sunray-yellow)] px-2 text-[11px] font-medium text-black">
            {product.net_weight_grams} g
          </span>
        </div>
      )}

      <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{product.translations.name}</h3>

      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
        {product.country_of_origin && <span>{product.country_of_origin}</span>}
        <span className="opacity-60">#{product.slug}</span>
      </div>

      {showDiscount && oldPrice && (
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 line-through">{oldPrice.toFixed(0)} {currencyLabel}</span>
          <span className="flex h-[18px] w-[42px] items-center justify-center rounded-[4px] bg-[var(--terracotta-accent)] text-[10px] leading-none text-white">25%</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-lg font-semibold">{product.price} {currencyLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-xl text-white shadow-md shadow-gray-400/60">+</span>
      </div>
    </Link>
  );
}
