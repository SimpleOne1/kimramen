"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type CategoryKey =
  | "rice"
  | "noodles"
  | "desserts"
  | "spices"
  | "snacks"
  | "saucesPastes"
  | "readyMeals"
  | "drinks";

type CategoryItem = {
  key: CategoryKey;
  href: string;
  imageSrc: string;
};

const CATEGORY_CONFIG: CategoryItem[] = [
  {
    key: "rice",
    href: "/catalog?category=rice",
    imageSrc: "/images/categories/rice.png",
  },
  {
    key: "noodles",
    href: "/catalog?category=noodles",
    imageSrc: "/images/categories/noodles.png",
  },
  {
    key: "desserts",
    href: "/catalog?category=desserts",
    imageSrc: "/images/categories/desserts.png",
  },
  {
    key: "spices",
    href: "/catalog?category=spices",
    imageSrc: "/images/categories/spices.png",
  },
  {
    key: "snacks",
    href: "/catalog?category=snacks",
    imageSrc: "/images/categories/snacks.png",
  },
  {
    key: "saucesPastes",
    href: "/catalog?category=sauces-pastes",
    imageSrc: "/images/categories/sauces.png",
  },
  {
    key: "readyMeals",
    href: "/catalog?category=ready-meals",
    imageSrc: "/images/categories/ready-meals.png",
  },
  {
    key: "drinks",
    href: "/catalog?category=drinks",
    imageSrc: "/images/categories/drinks.png",
  },
];

const labelKeyMap: Record<CategoryKey, string> = {
  rice: "categories.rice",
  noodles: "categories.noodles",
  desserts: "categories.desserts",
  spices: "categories.spices",
  snacks: "categories.snacks",
  saucesPastes: "categories.saucesPastes",
  readyMeals: "categories.readyMeals",
  drinks: "categories.drinks",
};

export default function CategoriesSection() {
  const { t } = useTranslation();

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-bold">
        {t("home.categoriesTitle")}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {CATEGORY_CONFIG.map((category) => (
          <Link
            key={category.key}
            href={category.href}
            className="group flex flex-col items-center gap-2 rounded-xl bg-white/90 p-3 text-center text-xs shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={category.imageSrc}
                alt={t(labelKeyMap[category.key])}
                fill
                className="object-cover transition group-hover:scale-105"
              />
            </div>
            <span className="mt-1 font-semibold">
              {t(labelKeyMap[category.key])}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}