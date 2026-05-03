"use client";

import { useEffect, useRef } from "react";

export default function MobileHero() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    ref.current?.play().catch(() => {});
  }, []);

  return (
    <section className="mt-2 overflow-hidden border-b border-black/35 bg-[#eeeaea]">
      <video
        ref={ref}
        src="/videos/full-2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="h-[150px] w-full object-contain"
      />
    </section>
  );
}
