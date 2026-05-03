"use client";

import Image from "next/image";
import Link from "next/link";

const categories = [
  ["РИС", "/catalog?category=rice", "/images/categories/rice.png"],
  ["ЛАПША", "/catalog?category=noodles", "/images/categories/noodles.png"],
  ["ДЕСЕРТЫ", "/catalog?category=desserts", "/images/categories/desserts.png"],
  ["СПЕЦИИ", "/catalog?category=spices", "/images/categories/spices.png"],
  ["СНЕКИ", "/catalog?category=snacks", "/images/categories/snacks.png"],
  ["СОУСЫ И ПАСТЫ", "/catalog?category=sauces-pastes", "/images/categories/sauces.png"],
  ["ГОТОВЫЕ БЛЮДА", "/catalog?category=ready-meals", "/images/categories/ready-meals.png"],
  ["НАПИТКИ", "/catalog?category=drinks", "/images/categories/drinks.png"],
] as const;

export default function MobileCategories() {
  return (
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-[18px] font-bold">Категории</h2>
      <div className="grid grid-cols-4 gap-x-5 gap-y-4">
        {categories.map(([title, href, image]) => (
          <Link key={title} href={href} className="flex flex-col items-center text-center">
            <div className="relative h-[78px] w-full">
              <Image src={image} alt={title} fill sizes="25vw" className="object-contain" />
            </div>
            <span className="mt-1 min-h-[30px] text-[13px] font-extrabold leading-tight">{title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
