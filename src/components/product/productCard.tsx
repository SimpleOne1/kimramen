// src/components/product/productCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../models/product";
import AddToCartButton from "./AddToCartButton";
import CountryFlag from "./CountryFlag";
import FavoriteButton from "@/src/components/favorites/FavoriteButton";

interface Props {
  product: Product;
  index?: number;
  compact?: boolean;
}

function money(value: number, currency = "MDL") {
  const label = currency.toLowerCase() === "mdl" ? "mdl" : currency;
  return `${Number(value || 0).toFixed(0)} ${label}`;
}

function weightLabel(value: number | null | undefined) {
  if (!value) return null;
  return `${value} г`;
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export default function ProductCard({ product, compact = false }: Props) {
  const imageSrc = product.main_image || "/images/products/example1.png";
  const discountPercent = Number(product.discount_percent || 0);
  const showDiscount = discountPercent > 0 && Boolean(product.old_price);
  const oldPrice = showDiscount ? Number(product.old_price || 0) : null;
  const name = product.translations.name || "Товар Kimramen";
  const productUrl = `/product/${product.id}`;
  const weight = weightLabel(product.net_weight_grams);
  const article = product.sku ? `Арт.${product.sku}` : null;
  const country = product.country_of_origin || null;
  const brand = product.brand && normalizeText(product.brand) !== normalizeText(country)
    ? product.brand
    : null;

  return (
    <article className={`group relative flex flex-col border border-[#d8d1ce] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${compact ? "min-h-[122px] rounded-[5px] px-1 pb-1 pt-1" : "min-h-[286px] rounded-2xl px-4 pb-3 pt-4"}`}>
      <FavoriteButton
        productId={product.id}
        productName={name}
        variant={compact ? "compact" : "card"}
        className={`absolute z-20 ${compact ? "right-1 top-1" : "right-3 top-3"}`}
      />

      <Link
        href={productUrl}
        className={compact ? "mb-0 flex h-[55px] w-full items-center justify-center pt-1" : "mb-2 flex h-[136px] w-full items-center justify-center pt-3"}
      >
        <Image
          src={imageSrc}
          alt={name}
          width={compact ? 120 : 255}
          height={compact ? 86 : 178}
          className={`${compact ? "max-h-[50px]" : "max-h-[134px]"} w-auto object-contain transition group-hover:scale-[1.03]`}
        />
      </Link>

      <div className={`${compact ? "mb-0 min-h-[12px] gap-0.5" : "mb-2 min-h-[22px] gap-2"} flex items-center overflow-hidden`}>
        {weight ? (
          <span className={`inline-flex shrink-0 items-center rounded-md bg-[#fff9df] font-medium text-[#5a514b] ${compact ? "h-[12px] px-1 text-[7px]" : "h-[22px] px-2 text-[12px]"}`}>
            {weight}
          </span>
        ) : null}

        {article ? (
            <span className={`truncate leading-none text-gray-400 ${compact ? "text-[7px]" : "text-[12px]"}`}>
            {article}
          </span>
        ) : null}
      </div>

      <Link
        href={productUrl}
        className={`line-clamp-3 font-bold text-[#20232a] transition hover:text-[#0067B9] ${compact ? "mb-0 line-clamp-2 text-[8px] leading-[1.05]" : "mb-2 text-[16px] leading-[1.16]"}`}
      >
        {name}
      </Link>

      <div className={`flex min-h-[10px] items-center overflow-hidden text-[#4f5968] ${compact ? "mb-0 gap-0.5 text-[7px]" : "mb-2 gap-1.5 text-[12px]"}`}>
        <CountryFlag country={country} className="shrink-0" />
        {brand ? (
          <>
            {country ? <span className="shrink-0 text-gray-300">•</span> : null}
            <span className="truncate">{brand}</span>
          </>
        ) : null}
      </div>

      {showDiscount && oldPrice && (
        <div className={`flex items-center ${compact ? "mb-0 gap-0.5" : "mb-2 gap-2"}`}>
          <span className={`text-gray-400 line-through ${compact ? "text-[7px]" : "text-[12px]"}`}>
            {money(oldPrice, product.currency)}
          </span>
          <span className={`grid place-items-center rounded-md bg-[#E95F4D] font-bold leading-none text-white ${compact ? "h-[10px] w-[20px] text-[6px]" : "h-[20px] w-[44px] text-[11px]"}`}>
            -{Math.round(discountPercent)}%
          </span>
        </div>
      )}

      <div className={`mt-auto flex items-end justify-between ${compact ? "pt-0.5" : "pt-1"}`}>
        <span className={`font-semibold leading-none text-black ${compact ? "text-[11px]" : "text-[24px]"}`}>
          {money(product.price, product.currency)}
        </span>
        <AddToCartButton
          compact
          product={{
            id: product.id,
            slug: product.slug,
            name,
            price: product.price,
            currency: product.currency,
            image: product.main_image,
          }}
          className={compact ? "!h-7 !w-7 !rounded-[7px] !text-[18px]" : ""}
        />
      </div>
    </article>
  );
}
