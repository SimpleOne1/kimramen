"use client";

import { useRef, useEffect } from "react";

export default function VideoSliderSingle() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-[400px] overflow-hidden">
      <video
        ref={videoRef}
        src="/videos/full-1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}