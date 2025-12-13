"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Frame = "swing" | "hit";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function TinyClimber() {
  const SIZE = 28;
  const OFFSET_DOWN = 120;

  // Чтобы удар запускался только когда реально есть движение
  const MOVE_TRIGGER_PX = 6;

  // === Пороги скорости (px/sec) для режима ускорения ===
  // Включаем ускорение только после FAST_ON, выключаем когда упало ниже FAST_OFF
  const SPEED_FAST_ON = 1200;
  const SPEED_FAST_OFF = 850;

  // === Slow mode (читаемый удар) ===
  const HIT_HOLD_SLOW = 260;      // удар держится заметно
  const HIT_COOLDOWN_SLOW = 260;  // реже бьёт (спокойно)

  // === Fast mode (мультяшное ускорение) ===
  const HIT_HOLD_FAST = 90;       // удар короче
  const HIT_COOLDOWN_FAST = 70;   // чаще бьёт

  const [y, setY] = useState(0);
  const [frame, setFrame] = useState<Frame>("swing");

  const raf = useRef<number | null>(null);

  const lastScrollY = useRef(0);
  const lastTs = useRef(performance.now());

  const speedSmoothed = useRef(0);
  const isFastMode = useRef(false);

  const lastHitTs = useRef(0);
  const hitUntilTs = useRef(0);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const scrollY = window.scrollY;
      const doc = document.documentElement;

      // === 1) позиция по прогрессу скролла ===
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = scrollY / maxScroll;

      const minY = 12 + OFFSET_DOWN;
      const maxY = window.innerHeight - SIZE - 12 + OFFSET_DOWN;

      const clampedMaxY = Math.min(maxY, window.innerHeight - SIZE - 8);
      const clampedMinY = Math.min(minY, clampedMaxY);

      setY(clampedMinY + progress * (clampedMaxY - clampedMinY));

      // === 2) скорость скролла (px/sec) ===
      const dt = Math.max(1, now - lastTs.current);
      const dy = Math.abs(scrollY - lastScrollY.current);
      const speed = (dy / dt) * 1000;

      // сглаживаем, чтобы трекпад не дрожал
      const SMOOTH = 0.18;
      speedSmoothed.current = speedSmoothed.current * (1 - SMOOTH) + speed * SMOOTH;

      // === 3) fast-mode с гистерезисом ===
      if (!isFastMode.current && speedSmoothed.current >= SPEED_FAST_ON) {
        isFastMode.current = true;
      } else if (isFastMode.current && speedSmoothed.current <= SPEED_FAST_OFF) {
        isFastMode.current = false;
      }

      // === 4) анимация удара ===
      // если почти не скроллим — стоим в замахе
      if (dy < 1) {
        setFrame("swing");
      } else {
        const HIT_HOLD = isFastMode.current ? HIT_HOLD_FAST : HIT_HOLD_SLOW;
        const HIT_COOLDOWN = isFastMode.current ? HIT_COOLDOWN_FAST : HIT_COOLDOWN_SLOW;

        if (now < hitUntilTs.current) {
          setFrame("hit");
        } else {
          setFrame("swing");

          if (dy >= MOVE_TRIGGER_PX && now - lastHitTs.current >= HIT_COOLDOWN) {
            setFrame("hit");
            lastHitTs.current = now;
            hitUntilTs.current = now + HIT_HOLD;
          }
        }
      }

      lastScrollY.current = scrollY;
      lastTs.current = now;

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-[10px] top-0 z-[9999] hidden md:block"
      style={{ transform: `translateY(${y}px)` }}
    >
      <Image
        src={frame === "swing" ? "/images/climber/swing.png" : "/images/climber/hit.png"}
        alt=""
        width={SIZE}
        height={SIZE}
        priority
        className="select-none"
      />
    </div>
  );
}