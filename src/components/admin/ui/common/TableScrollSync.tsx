"use client";

import { ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
};

export default function TableScrollSync({ children }: Props) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = topScrollRef.current;
    const topInner = topInnerRef.current;
    const bottom = bottomScrollRef.current;

    if (!top || !topInner || !bottom) return;

    const syncWidth = () => {
      topInner.style.width = `${bottom.scrollWidth}px`;
    };

    syncWidth();

    let isSyncingTop = false;
    let isSyncingBottom = false;

    const handleTopScroll = () => {
      if (isSyncingBottom) return;
      isSyncingTop = true;
      bottom.scrollLeft = top.scrollLeft;
      isSyncingTop = false;
    };

    const handleBottomScroll = () => {
      if (isSyncingTop) return;
      isSyncingBottom = true;
      top.scrollLeft = bottom.scrollLeft;
      isSyncingBottom = false;
    };

    top.addEventListener("scroll", handleTopScroll);
    bottom.addEventListener("scroll", handleBottomScroll);

    const resizeObserver = new ResizeObserver(() => {
      syncWidth();
    });

    resizeObserver.observe(bottom);

    return () => {
      top.removeEventListener("scroll", handleTopScroll);
      bottom.removeEventListener("scroll", handleBottomScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={topScrollRef}
        className="overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200"
      >
        <div ref={topInnerRef} className="h-4" />
      </div>

      <div
        ref={bottomScrollRef}
        className="overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
}