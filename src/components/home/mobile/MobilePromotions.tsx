"use client";

import Image from "next/image";
import Link from "next/link";
import MobileDots from "./MobileDots";

const ACTION_IMAGES = [
  "/images/actions3/action1.png",
  "/images/actions3/action2.png",
  "/images/actions3/action3.png",
  "/images/actions3/action4.png",
  "/images/actions3/action5.png",
  "/images/actions3/action6.png",
];

export default function MobilePromotions() {
  return (
    <section className="mx-auto mt-5 w-full max-w-[320px] px-1">
      <h2 className="mb-1 px-1 text-[9px] font-bold">Акции</h2>
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ACTION_IMAGES.slice(0, 3).map((src) => (
          <div key={src} className="relative h-[64px] w-[86px] shrink-0 overflow-hidden rounded-[3px] bg-gray-100">
            <Image src={src} alt="Акция" fill className="object-cover" sizes="116px" />
          </div>
        ))}
        <Link href="/promotions" className="flex h-[64px] w-[70px] shrink-0 flex-col items-center justify-center rounded-[3px] bg-[#ebe8e8] text-[8px] text-[#0067B9]">
          <span className="mb-1 grid h-4 w-4 place-items-center rounded-md bg-white text-gray-400">›</span>
          Все акции
        </Link>
      </div>
      <MobileDots />
    </section>
  );
}
