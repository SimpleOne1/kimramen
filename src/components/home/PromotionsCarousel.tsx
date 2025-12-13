"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// СЮДА добавляешь файлы, которые лежат в public/images/actions2/
const ACTION_IMAGES: string[] = [
  "/images/actions2/action1.png",
  "/images/actions2/action2.png",
  "/images/actions2/action3.png",
  "/images/actions2/action4.png",
  "/images/actions2/action5.png",
  "/images/actions2/action6.png",
  // можно продолжать список
];

export default function PromotionsCarousel() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleNext = () => {
    const container = scrollRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLDivElement>("[data-card]");
    const cardWidth = firstCard?.clientWidth ?? 0;

    // Скроллим на ~3 карточки за раз
    container.scrollBy({ left: cardWidth * 3, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">
        {t("home.promotionsTitle", "Акции")}
      </h2>

      <div className="flex gap-4">
        {/* Левая прозрачная колонка */}
        <div className="flex w-40 shrink-0 flex-col justify-between rounded-2xl bg-white/60 p-4 text-gray-900 shadow-sm">
          <div className="text-2xl font-bold leading-none">
            <div>{t("home.promotionsAllTop", "Все")}</div>
            <div>{t("home.promotionsAllBottom", "акции")}</div>
          </div>

          <Link
            href="/promotions"
            className="mt-4 inline-flex items-center justify-between rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-900 transition"
          >
            <span>{t("home.promotionsAllLink", "Все акции")}</span>
            <button
              type="button"
              aria-label={t("home.promotionsNext", "Следующие акции")}
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm hover:bg-gray-100"
            >
              {/* Стрелка вправо */}
              <span className="-mr-[1px] text-lg">➜</span>
            </button>
          </Link>
        </div>

        {/* Карусель с акциями */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
          <div className="flex gap-4">
            {ACTION_IMAGES.map((src, index) => (
              <div
                key={src + index}
                data-card
                className="relative aspect-[4/3] w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm md:w-52 lg:w-56"
              >
                <Image
                  src={src}
                  alt={t("home.promotionsImageAlt", "Акция KimRamen")}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}