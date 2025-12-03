// src/components/home/MainBannerSlider.tsx
// MainBannerSlider shows hero banner with basic slider logic

"use client";

import React from "react";
import { useTranslation } from "react-i18next";

type BannerSlide = {
  id: string;
  // image path for future use
  imageSrc: string;
};

const defaultSlides: BannerSlide[] = [
  { id: "slide-1", imageSrc: "/images/banner-1.png" },
  { id: "slide-2", imageSrc: "/images/banner-2.png" },
  { id: "slide-3", imageSrc: "/images/banner-3.png" },
];

type MainBannerSliderProps = {
  slides?: BannerSlide[];
};

export default function MainBannerSlider({
  slides = defaultSlides,
}: MainBannerSliderProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const currentSlide = slides[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex w-full items-stretch overflow-hidden rounded-xl bg-slate-100">
      <div className="flex-1 py-10 pl-8 pr-4">
        <div className="mb-4 text-3xl font-extrabold tracking-wide">
          {t("home.bannerTitle")}
        </div>
        <p className="mb-6 max-w-md text-sm text-slate-600">
          {/* placeholder description for now */}
          Азиатский маркет Kimramen — лапша, соусы, снеки и напитки с доставкой.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
          >
            ›
          </button>
          <div className="ml-2 flex gap-1">
            {slides.map((slide, index) => (
              <span
                key={slide.id}
                className={`h-2 w-2 rounded-full ${
                  index === activeIndex ? "bg-[#0067c7]" : "bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-white lg:flex">
        {/* placeholder instead of real image */}
        <div className="flex h-56 w-full items-center justify-center bg-slate-100">
          <span className="text-6xl">🐼</span>
        </div>
      </div>
    </div>
  );
}