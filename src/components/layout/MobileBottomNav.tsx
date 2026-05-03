"use client";

import Image from "next/image";
import Link from "next/link";

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] lg:hidden bg-black/95 px-6 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-[520px] items-center justify-between text-white">
        <Link href="/catalog" aria-label="Каталог" className="grid h-10 w-10 place-items-center rounded-lg bg-white text-black">
          <Image src="/images/icons/menu.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/catalog" aria-label="Поиск" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/search.svg" alt="" width={30} height={30} className="invert" />
        </Link>
        <Link href="/favorites" aria-label="Избранное" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/heart.svg" alt="" width={32} height={32} />
        </Link>
        <Link href="/account" aria-label="Аккаунт" className="grid h-10 w-10 place-items-center">
          <Image src="/images/icons/user.svg" alt="" width={30} height={30} />
        </Link>
        <Link href="/cart" aria-label="Корзина" className="relative grid h-10 w-10 place-items-center">
          <Image src="/images/icons/cart.svg" alt="" width={34} height={34} />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#E56A54] px-1 text-[11px] font-bold text-white">4</span>
        </Link>
      </div>
    </nav>
  );
}
