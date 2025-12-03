// src/components/home/CategoriesSection.tsx
// CategoriesSection shows main product categories with icons

"use client";

import { useTranslation } from "react-i18next";

type CategoryItem = {
  key: keyof typeof labelKeyMap;
  icon: string;
};

const labelKeyMap = {
  ramen: "categories.ramen",
  sauces: "categories.sauces",
  snacks: "categories.snacks",
  drinks: "categories.drinks",
  rice: "categories.rice",
  readyMeals: "categories.readyMeals",
  teaCoffee: "categories.teaCoffee",
  desserts: "categories.desserts",
  seafood: "categories.seafood",
  condiments: "categories.condiments",
} as const;

const categories: CategoryItem[] = [
  { key: "ramen", icon: "🍜" },
  { key: "sauces", icon: "🧴" },
  { key: "snacks", icon: "🍘" },
  { key: "drinks", icon: "🥤" },
  { key: "rice", icon: "🍚" },
  { key: "readyMeals", icon: "🥡" },
  { key: "teaCoffee", icon: "☕️" },
  { key: "desserts", icon: "🍮" },
  { key: "seafood", icon: "🦐" },
  { key: "condiments", icon: "🧂" }
];

export default function CategoriesSection() {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">
        {t("home.categoriesTitle")}
      </h2>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-10">
        {categories.map((category) => (
          <div
            key={category.key}
            className="flex flex-col items-center gap-2 rounded-lg bg-white p-3 text-center text-[11px] shadow-sm hover:shadow-md"
          >
            <span className="text-3xl">{category.icon}</span>
            <span className="font-semibold">
              {t(labelKeyMap[category.key])}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}