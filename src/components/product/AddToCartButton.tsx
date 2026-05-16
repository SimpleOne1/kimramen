"use client";

import Image from "next/image";
import { useState } from "react";

type CartItem = {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  quantity: number;
};

type Props = {
  product: Omit<CartItem, "quantity">;
  className?: string;
  compact?: boolean;
};

const CART_KEY = "kimramen_cart";
const PLUS_ICON = "/images/icons/cart-plus-black.png";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("kimramen:cart-updated", { detail: items }));
}

export default function AddToCartButton({ product, className = "", compact = false }: Props) {
  const [added, setAdded] = useState(false);

  function addToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
      writeCart(cart);
    } else {
      writeCart([...cart, { ...product, quantity: 1 }]);
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  return (
    <button
      type="button"
      onClick={addToCart}
      aria-label="Добавить в корзину"
      className={`grid place-items-center rounded-xl bg-[#19191A] text-white shadow-md shadow-black/20 transition hover:scale-105 hover:bg-[#19191A] active:scale-95 ${compact ? "h-9 w-9" : "h-12 w-12"} ${className}`}
    >
      {added ? (
        <span className="text-lg font-bold leading-none">✓</span>
      ) : (
        <Image src={PLUS_ICON} alt="" width={compact ? 36 : 48} height={compact ? 36 : 48} />
      )}
    </button>
  );
}
