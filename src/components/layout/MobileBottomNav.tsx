"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CART_KEY = "kimramen_cart";

function readCartCount() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const items = raw ? (JSON.parse(raw) as Array<{ quantity?: number }>) : [];
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default function MobileBottomNav() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncCartCount = () => setCartCount(readCartCount());
    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener("kimramen:cart-updated", syncCartCount);
    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener("kimramen:cart-updated", syncCartCount);
    };
  }, []);

  return (
    <nav className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-16px)] -translate-x-1/2 rounded-[15px] bg-[#101A2B]/95 px-3 py-2 shadow-[0_-8px_30px_rgba(16,26,43,0.38),0_0_18px_rgba(16,26,43,0.22)] backdrop-blur lg:hidden">
      <div className="mx-auto flex items-center justify-between text-white">
        <Link href="/catalog" aria-label="Каталог" className="grid h-11 w-11 place-items-center rounded-xl bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.28)]">
          <Image src="/images/icons/menu.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/search" aria-label="Поиск" className="grid h-11 w-11 place-items-center">
          <Image src="/images/icons/search.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/cart" aria-label="Корзина" className="relative grid h-11 w-11 place-items-center">
          <Image src="/images/icons/cart.svg" alt="" width={26} height={26} />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E56A54] px-1 text-[9px] font-bold text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
        <Link href="/favorites" aria-label="Избранное" className="grid h-11 w-11 place-items-center">
          <Image src="/images/icons/heart.svg" alt="" width={25} height={25} />
        </Link>
        <Link href="/account" aria-label="Аккаунт" className="grid h-11 w-11 place-items-center">
          <Image src="/images/icons/user.svg" alt="" width={25} height={25} />
        </Link>
      </div>
    </nav>
  );
}
