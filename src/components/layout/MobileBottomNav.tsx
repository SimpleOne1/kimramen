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
    <nav className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-28px)] max-w-[320px] -translate-x-1/2 rounded-[11px] bg-black/95 px-3 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur lg:hidden">
      <div className="mx-auto flex items-center justify-between text-white">
        <Link href="/catalog" aria-label="Каталог" className="grid h-10 w-10 place-items-center rounded-lg bg-white text-black">
          <Image src="/images/icons/menu.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/search" aria-label="Поиск" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/search.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/cart" aria-label="Корзина" className="relative grid h-10 w-10 place-items-center">
          <Image src="/images/icons/cart.svg" alt="" width={26} height={26} />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E56A54] px-1 text-[9px] font-bold text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
        <Link href="/favorites" aria-label="Избранное" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/heart.svg" alt="" width={25} height={25} />
        </Link>
        <Link href="/account" aria-label="Аккаунт" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/user.svg" alt="" width={25} height={25} />
        </Link>
      </div>
    </nav>
  );
}
