"use client";

import { useEffect, useState } from "react";

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
const MAX_QUANTITY = 99;

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

function getProductQuantity(productId: number) {
  return readCart().find((item) => item.id === productId)?.quantity || 0;
}

export default function AddToCartButton({ product, className = "", compact = false }: Props) {
  const [quantity, setQuantity] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const syncQuantity = () => setQuantity(getProductQuantity(product.id));

    syncQuantity();
    window.addEventListener("storage", syncQuantity);
    window.addEventListener("kimramen:cart-updated", syncQuantity as EventListener);

    return () => {
      window.removeEventListener("storage", syncQuantity);
      window.removeEventListener("kimramen:cart-updated", syncQuantity as EventListener);
    };
  }, [product.id]);

  function triggerPulse() {
    setPulse(false);
    window.requestAnimationFrame(() => {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 720);
    });
  }

  function changeQuantity(nextQuantity: number) {
    const safeQuantity = Math.max(0, Math.min(MAX_QUANTITY, nextQuantity));
    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);

    if (safeQuantity <= 0) {
      writeCart(cart.filter((item) => item.id !== product.id));
      setQuantity(0);
      return;
    }

    if (existing) {
      existing.quantity = safeQuantity;
      writeCart(cart);
    } else {
      writeCart([...cart, { ...product, quantity: safeQuantity }]);
    }

    setQuantity(safeQuantity);
    triggerPulse();
  }

  function addToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    changeQuantity(quantity > 0 ? quantity + 1 : 1);
  }

  function decrement(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    changeQuantity(quantity - 1);
  }

  if (quantity > 0) {
    return (
      <>
        <div
          className={`kimramen-quantity-control relative inline-flex shrink-0 items-center justify-between overflow-hidden border border-black bg-white text-[#111827] shadow-sm transition-all duration-300 ease-out ${
            compact ? "h-9 w-[112px] rounded-[18px] p-[2px]" : "h-10 w-[122px] rounded-[20px] p-[2px]"
          } ${pulse ? "is-pulsing" : ""} ${className}`}
          aria-label={`В корзине ${quantity}`}
        >
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0" aria-hidden="true" />

          <button
            type="button"
            onClick={decrement}
            aria-label="Уменьшить количество"
            className={`grid shrink-0 place-items-center bg-[#19191A] text-white shadow-sm transition duration-200 hover:scale-[1.03] active:scale-95 ${
              compact ? "h-8 w-8 rounded-[14px] text-[22px]" : "h-9 w-9 rounded-[15px] text-[24px]"
            } font-medium leading-none`}
          >
            <span className="-mt-0.5">−</span>
          </button>

          <span
            className={`grid min-w-0 flex-1 place-items-center text-center font-semibold leading-none text-[#111827] ${
              compact ? "text-[15px]" : "text-[17px]"
            }`}
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={addToCart}
            aria-label="Увеличить количество"
            className={`grid shrink-0 place-items-center bg-[#19191A] text-white shadow-sm transition duration-200 hover:scale-[1.03] active:scale-95 ${
              compact ? "h-8 w-8 rounded-[14px] text-[25px]" : "h-9 w-9 rounded-[15px] text-[27px]"
            } font-extralight leading-none`}
          >
            <span className="-mt-0.5">+</span>
          </button>
        </div>

        <style jsx>{`
          .kimramen-quantity-control > span[aria-hidden="true"] {
            background: linear-gradient(
              110deg,
              transparent 0%,
              transparent 34%,
              rgba(255, 255, 255, 0.1) 42%,
              rgba(205, 213, 224, 0.95) 50%,
              rgba(255, 255, 255, 0.6) 57%,
              transparent 66%,
              transparent 100%
            );
            transform: translateX(-115%);
          }

          .kimramen-quantity-control.is-pulsing {
            box-shadow: 0 0 0 1px rgba(209, 213, 219, 0.9), 0 8px 20px rgba(17, 24, 39, 0.12);
          }

          .kimramen-quantity-control.is-pulsing > span[aria-hidden="true"] {
            opacity: 1;
            animation: kimramen-metal-border-pulse 680ms ease-out both;
          }

          @keyframes kimramen-metal-border-pulse {
            0% {
              transform: translateX(-115%);
              opacity: 0;
            }
            18% {
              opacity: 1;
            }
            100% {
              transform: translateX(115%);
              opacity: 0;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={addToCart}
      aria-label="Добавить в корзину"
      className={`grid shrink-0 place-items-center bg-[#19191A] text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-all duration-300 ease-out hover:scale-[1.04] hover:bg-[#19191A] active:scale-95 ${
        compact ? "h-10 w-10 rounded-[15px] text-[30px]" : "h-11 w-11 rounded-[16px] text-[34px]"
      } ${className}`}
    >
      <span className="-mt-1 font-extralight leading-none">+</span>
    </button>
  );
}
