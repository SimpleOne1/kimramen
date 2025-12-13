"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  avatarSrc?: string;
};

// настройки поведения
const AUTO_OPEN_DELAY = 10_000; // 10 секунд
const AUTO_VISIBLE_TIME = 5_000; // показывать 5 секунд
const SESSION_KEY = "support_widget_autoshow_done";

export default function SupportWidget({
  avatarSrc = "/images/avatar.jpg",
}: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // SSR-safe
    if (typeof window === "undefined") return;

    // если уже показывали в этой сессии — не делаем ничего
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    openTimerRef.current = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);

      // авто-закрытие
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, AUTO_VISIBLE_TIME);
    }, AUTO_OPEN_DELAY);

    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  /** пользователь нажал кнопку */
  const handleToggle = () => {
    // если был авто-таймер закрытия — отменяем
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen((v) => !v);
  };

  /** пользователь нажал крестик */
  const handleClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* ===== ПАНЕЛЬ ===== */}
      <div
        className={[
          "absolute bottom-[86px] right-0",
          "w-[320px] sm:w-[360px]",
          "transition-all duration-300 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none",
        ].join(" ")}
      >
        <div className="relative rounded-2xl bg-[#2D2F33] px-5 py-4 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          {/* крестик */}
          <button
            type="button"
            aria-label={t("supportWidget.close")}
            onClick={handleClose}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-white/70 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31z"
              />
            </svg>
          </button>

          <div className="flex gap-4">
            {/* Аватар */}
            <div className="relative h-[72px] w-[72px] shrink-0">
              <div className="absolute inset-0 rounded-full ring-2 ring-[#FF5A3A] shadow-[0_0_0_6px_rgba(255,90,58,0.18)]" />
              <div className="absolute inset-[4px] overflow-hidden rounded-full bg-[#111]">
                <Image
                  src={avatarSrc}
                  alt={t("supportWidget.name")}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Текст */}
            <div className="min-w-0 pr-6">
              <div className="text-[18px] font-semibold leading-tight">
                {t("supportWidget.name")}
              </div>
              <div className="mt-2 whitespace-pre-line text-[15px] leading-snug text-white/90 text-justify">
                {t("supportWidget.text")}
              </div>
            </div>
          </div>

          {/* хвостик */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-[#2D2F33]" />
        </div>
      </div>

      {/* ===== КНОПКА ===== */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t("supportWidget.open")}
        className="relative grid h-[68px] w-[68px] place-items-center rounded-full bg-[#FF5A3A] shadow-[0_16px_30px_rgba(255,90,58,0.45)]"
      >
        {/* пульс */}
        <span className="support-pulse absolute inset-0 rounded-full" />
        <span className="support-pulse support-pulse--delay absolute inset-0 rounded-full" />

        {/* иконка — два облачка */}
        <svg width="34" height="34" viewBox="0 0 24 24">
          <path
            fill="white"
            d="M20 2H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1v3a1 1 0 0 0 1.6.8L15 15h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
          />
          <path
            fill="white"
            opacity="0.9"
            d="M4 7H3a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h6l3.4 2.8A1 1 0 0 0 14 22v-2h1a2 2 0 0 0 2-2v-1h-2v1H12v1.9L9.7 18H3V9h1V7Z"
          />
        </svg>
      </button>
    </div>
  );
}