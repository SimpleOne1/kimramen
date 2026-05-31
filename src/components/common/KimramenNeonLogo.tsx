"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

type KimramenNeonLogoProps = {
  variant?: "desktop" | "mobile";
  className?: string;
};

const LOGO_SRC = {
  desktop: "/images/logo/kimramen-logo-desktop1.png",
  mobile: "/images/logo/kimramen-logo-mobile1.png",
} as const;

const LOGO_SIZE = {
  desktop: { width: 312, height: 96, sizes: "312px" },
  mobile: { width: 212, height: 66, sizes: "212px" },
} as const;

export default function KimramenNeonLogo({
  variant = "desktop",
  className = "",
}: KimramenNeonLogoProps) {
  const src = LOGO_SRC[variant];
  const size = LOGO_SIZE[variant];

  return (
    <Link
      href="/"
      aria-label="Kimramen — на главную"
      className={`kr-header-neon-logo kr-header-neon-logo--${variant} ${className}`}
    >
      <span
        className="kr-header-neon-logo__stage"
        aria-hidden="true"
        style={
          {
            "--kr-logo-src": `url("${src}")`,
          } as CSSProperties
        }
      >
        <Image
          src={src}
          alt=""
          width={size.width}
          height={size.height}
          sizes={size.sizes}
          priority
          className="kr-header-neon-logo__image"
        />
      </span>

      <span className="sr-only">Kimramen</span>
    </Link>
  );
}