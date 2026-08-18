"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import KimramenNeonLogo from "../common/KimramenNeonLogo";

const menuLinks = [
  ["Каталог", "/catalog"],
  ["Акции", "/promotions"],
  ["Оплата и доставка", "/payment-and-shipping"],
  ["Обмен и возврат", "/exchange-return"],
  ["Контакты", "/contacts"],
  ["Личный кабинет", "/account"],
] as const;

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="bg-white px-0 pb-2 pt-2 lg:hidden">
        <div className="mx-auto flex h-10 w-[calc(100%-28px)] max-w-[320px] items-center justify-between rounded-[11px] bg-black px-2.5 shadow-sm">
        <button
          type="button"
          aria-label="Открыть меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="grid h-8 w-8 place-items-center text-white"
        >
          <span className="flex w-5 flex-col gap-[4px]">
            <span className="h-[2px] rounded-full bg-white" />
            <span className="h-[2px] rounded-full bg-white" />
            <span className="h-[2px] rounded-full bg-white" />
          </span>
        </button>

        <KimramenNeonLogo variant="mobile" className="shrink-0" />

        <Link
          href="/search"
          aria-label="Поиск"
          className="grid h-7 w-7 place-items-center rounded-[7px] bg-white text-black"
        >
          <Image src="/images/icons/search.svg" alt="" width={16} height={16} className="invert" />
        </Link>
      </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-3 right-3 top-2 mx-auto max-w-[320px] overflow-hidden rounded-2xl bg-white text-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="text-sm font-extrabold">Меню</span>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setMenuOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <nav className="grid gap-1 p-3">
              {menuLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-black/5"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
