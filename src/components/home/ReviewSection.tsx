"use client";

import Image from "next/image";
import { useRef } from "react";

type ReviewItem = {
  id: string;
  productTitle: string;
  productImage: string;
  text: string;
  authorName: string;
  dateLabel: string;
};

const REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    productTitle: "Лапша Bull Ramen Carbonara KEKESHI",
    productImage: "/images/products/example10.png",
    text:
      "Классное сочетание — сливочная карбонара в формате рамена. Соус получается насыщенный, с приятной ноткой чеснока. Лапша упругая, не разваривается, соус держится на ней. Отличный вариант, когда нужен быстрый, но плотный обед.",
    authorName: "Светлана",
    dateLabel: "29 декабря 2025",
  },
  {
    id: "r2",
    productTitle: "Лапша Mild Япончи Easy Veggie Ramen KEKESHI",
    productImage: "/images/products/example9.png",
    text:
      "Приятный, сбалансированный вкус, не острый. Овощные ноты чувствуются хорошо, бульон ароматный. Подойдёт тем, кто не любит острое. Удобно брать на работу — быстро готовится и хорошо насыщает.",
    authorName: "Игорь",
    dateLabel: "15 мая 2025",
  },
  {
    id: "r3",
    productTitle: "Лапша рамен со вкусом чили и сыра чеддер",
    productImage: "/images/products/example8.png",
    text:
      "Неплохая находка для любителей острого! Перчинка яркая, но не обжигающая, а чеддер добавляет сливочность и глубину. Вкусно и довольно сытно — точно возьму ещё.",
    authorName: "Елена",
    dateLabel: "16 сентября 2025",
  },
  {
    id: "r4",
    productTitle: "Жареная лапша со вкусом краба",
    productImage: "/images/products/example7.png",
    text:
      "Вкус максимально близок к уличной азиатской лапше. Аромат краба выраженный, но не резкий. Хорошо заходит как перекус или быстрый ужин. Соус — просто бомба.",
    authorName: "Иван",
    dateLabel: "30 ноября 2024",
  },
];

function Stars5() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className="fill-[#E56A54]"
          aria-hidden="true"
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="rounded-2xl p-0">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Последние отзывы
            </h2>

            {/* стрелки не трогаем */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
                aria-label="Назад"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => scrollByCards(1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
                aria-label="Вперёд"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-2"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // old Edge
            }}
          >
            {REVIEWS.map((r) => (
              <article
                key={r.id}
                className="min-w-[290px] max-w-[290px] shrink-0 rounded-2xl bg-white p-5 shadow-[0_6px_18px_rgba(0,0,0,0.12)] flex flex-col"
              >
                {/* TOP: image left, title+stars right */}
                <div className="flex gap-4">
                  <div className="relative h-[72px] w-[72px] shrink-0 rounded-xl bg-white">
                    <Image
                      src={r.productImage}
                      alt={r.productTitle}
                      fill
                      className="object-contain"
                      sizes="72px"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#111827] leading-snug">
                      {r.productTitle}
                    </div>
                    <div className="mt-2">
                      <Stars5 />
                    </div>
                  </div>
                </div>

                {/* text */}
                <p className="mt-4 text-[13px] leading-relaxed text-[#374151]">
                  {r.text}
                </p>

                {/* Footer pinned to bottom */}
                <div className="mt-auto pt-5 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#E5E7EB] text-[#6B7280]">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5C20 16 16.42 14 12 14Z"
                      />
                    </svg>
                  </div>

                  <div className="leading-tight">
                    <div className="text-[14px] font-semibold text-[#111827]">
                      {r.authorName}
                    </div>
                    <div className="text-[12px] text-[#6B7280]">{r.dateLabel}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* ВАЖНО: скрываем webkit-scrollbar без style jsx */}
          <style>{`
            /* локально для этой секции */
            section ::-webkit-scrollbar { display: none; }
          `}</style>
        </div>
      </div>
    </section>
  );
}