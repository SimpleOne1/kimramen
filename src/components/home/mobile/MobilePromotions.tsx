"use client";

import Image from "next/image";
import Link from "next/link";
import MobileDots from "./MobileDots";

const ACTION_IMAGES = [
  "/images/actions2/action1.png",
  "/images/actions2/action2.png",
  "/images/actions2/action3.png",
  "/images/actions2/action4.png",
  "/images/actions2/action5.png",
  "/images/actions2/action6.png",
];

export default function MobilePromotions() {
  return (
    <section className="mt-8 px-2">
      <h2 className="mb-2 px-1 text-[13px] font-bold">Акции</h2>
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ACTION_IMAGES.slice(0, 3).map((src) => (
          <div key={src} className="relative h-[86px] w-[116px] shrink-0 overflow-hidden rounded-[4px] bg-gray-100">
            <Image src={src} alt="Акция" fill className="object-cover" sizes="116px" />
          </div>
        ))}
        <Link href="/promotions" className="flex h-[86px] w-[92px] shrink-0 flex-col items-center justify-center rounded-[4px] bg-[#ebe8e8] text-[14px] text-[#0067B9]">
          <span className="mb-3 grid h-5 w-5 place-items-center rounded-md bg-white text-gray-400">›</span>
          Все акции
        </Link>
      </div>
      <MobileDots />
    </section>
  );
}
