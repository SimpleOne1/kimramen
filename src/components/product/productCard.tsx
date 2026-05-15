// src/components/product/productCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../models/product";
import AddToCartButton from "./AddToCartButton";
import CountryFlag from "./CountryFlag";

const HeartIcon = "/images/icons/heart-orange.svg";

interface Props {
  product: Product;
  index?: number;
}

function money(value: number, currency = "MDL") {
  const label = currency.toLowerCase() === "mdl" ? "mdl" : currency;
  return `${Number(value || 0).toFixed(0)} ${label}`;
}

export default function ProductCard({ product, index }: Props) {
  const imageSrc = product.main_image || "/images/products/example1.png";
  const showDiscount = typeof index === "number" && index < 5;
  const oldPrice = showDiscount ? product.price * 1.25 : null;
  const name = product.translations.name || "Товар Kimramen";
  const productUrl = `/product/${product.id}`;

  return (
    <article className="group relative flex min-h-[330px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {showDiscount && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-[#E56A54] px-2 py-1 text-[11px] font-bold text-white">
          🔥 Подарок
        </span>
      )}

      <Link href={productUrl} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white/90 transition hover:bg-white" aria-label="Добавить в избранное">
        <Image src={HeartIcon} alt="" width={18} height={18} />
      </Link>

      <Link href={productUrl} className="mb-3 flex h-40 w-full items-center justify-center pt-4">
        <Image src={imageSrc} alt={name} width={210} height={160} className="max-h-40 w-auto object-contain transition group-hover:scale-[1.03]" />
      </Link>

      <div className="mb-2 flex min-h-[18px] items-center gap-2">
        {product.net_weight_grams && (
          <span className="inline-flex h-[18px] items-center justify-center rounded bg-[var(--sunray-yellow)] px-2 text-[11px] font-bold text-black">
            {product.net_weight_grams} g
          </span>
        )}
      </div>

      <Link href={productUrl} className="mb-2 line-clamp-3 text-sm font-semibold leading-snug text-black transition hover:text-[#0067B9]">
        {name}
      </Link>

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
        <CountryFlag country={product.country_of_origin} />
        {product.brand && <span className="truncate">{product.brand}</span>}
      </div>

      {showDiscount && oldPrice && (
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 line-through">{money(oldPrice, product.currency)}</span>
          <span className="grid h-[18px] w-[42px] place-items-center rounded bg-[#E56A54] text-[10px] font-bold leading-none text-white">25%</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-lg font-bold text-black">{money(product.price, product.currency)}</span>
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
