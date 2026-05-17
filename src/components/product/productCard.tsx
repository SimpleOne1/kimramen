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

export default function ProductCard({ product }: Props) {
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
    <article className="group relative flex min-h-[286px] flex-col rounded-2xl border border-[#d8d1ce] bg-white px-4 pb-3 pt-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <FavoriteButton
        productId={product.id}
        productName={name}
        className="absolute right-3 top-3 z-20"
      />

      <Link
        href={productUrl}
        className="mb-2 flex h-[136px] w-full items-center justify-center pt-3"
      >
        <Image
          src={imageSrc}
          alt={name}
          width={255}
          height={178}
          className="max-h-[134px] w-auto object-contain transition group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mb-2 flex min-h-[22px] items-center gap-2 overflow-hidden">
        {weight ? (
          <span className="inline-flex h-[22px] shrink-0 items-center rounded-md bg-[#fff9df] px-2 text-[12px] font-medium text-[#5a514b]">
            {weight}
          </span>
        ) : null}

        {article ? (
          <span className="truncate text-[12px] leading-none text-gray-400">
            {article}
          </span>
        ) : null}
      </div>

      <Link
        href={productUrl}
        className="mb-2 line-clamp-3 text-[16px] font-bold leading-[1.16] text-[#20232a] transition hover:text-[#0067B9]"
      >
        {name}
      </Link>

      <div className="mb-2 flex min-h-[18px] items-center gap-1.5 overflow-hidden text-[12px] text-[#4f5968]">
        <CountryFlag country={country} className="shrink-0" />
        {brand ? (
          <>
            {country ? <span className="shrink-0 text-gray-300">•</span> : null}
            <span className="truncate">{brand}</span>
          </>
        ) : null}
      </div>

      {showDiscount && oldPrice && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[12px] text-gray-400 line-through">
            {money(oldPrice, product.currency)}
          </span>
          <span className="grid h-[20px] w-[44px] place-items-center rounded-md bg-[#E95F4D] text-[11px] font-bold leading-none text-white">
            -{Math.round(discountPercent)}%
          </span>
        </div>
      )}

      <div className="mt-auto flex items-end justify-between pt-1">
        <span className="text-[24px] font-semibold leading-none text-black">
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
        />
      </div>
    </article>
  );
}
