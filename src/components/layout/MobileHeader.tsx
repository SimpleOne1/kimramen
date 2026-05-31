"use client";

import Image from "next/image";
import Link from "next/link";
import KimramenNeonLogo from "../common/KimramenNeonLogo";

export default function MobileHeader() {
  return (
    <header className="lg:hidden bg-white px-3 pt-3 pb-2">
      <div className="flex h-[58px] items-center justify-between rounded-[18px] bg-black px-6 shadow-sm">
        <button
          type="button"
          aria-label="Открыть меню"
          className="grid h-10 w-10 place-items-center text-white"
        >
          <span className="flex w-7 flex-col gap-[6px]">
            <span className="h-[3px] rounded-full bg-white" />
            <span className="h-[3px] rounded-full bg-white" />
            <span className="h-[3px] rounded-full bg-white" />
          </span>
        </button>

        <KimramenNeonLogo variant="mobile" className="shrink-0" />

        <Link
          href="/search"
          aria-label="Поиск"
          className="grid h-11 w-11 place-items-center rounded-xl bg-white text-black"
        >
          <Image src="/images/icons/search.svg" alt="" width={23} height={23} />
        </Link>
      </div>
    </header>
  );
}
