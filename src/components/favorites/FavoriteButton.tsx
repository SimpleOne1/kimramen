"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY_HEART = "/images/icons/heart-empty-orange-outline.png";
const FILLED_HEART = "/images/icons/heart-filled-orange.png";

export type FavoriteButtonVariant = "card" | "inline";

type Props = {
  productId: number;
  productName?: string;
  variant?: FavoriteButtonVariant;
  className?: string;
};

export default function FavoriteButton({ productId, productName, variant = "card", className = "" }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch(`/api/customer/favorites/check?productId=${productId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        setIsFavorite(Boolean(data.isFavorite));
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (!alive) return;
        setAuthenticated(false);
      });

    return () => {
      alive = false;
    };
  }, [productId]);

  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    if (authenticated === false) {
      router.push(`/account?next=${encodeURIComponent("/favorites")}`);
      return;
    }

    setLoading(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const response = await fetch(
        nextState ? "/api/customer/favorites" : `/api/customer/favorites?productId=${productId}`,
        {
          method: nextState ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: nextState ? JSON.stringify({ productId }) : undefined,
        }
      );

      if (response.status === 401) {
        setIsFavorite(!nextState);
        setAuthenticated(false);
        router.push(`/account?next=${encodeURIComponent("/favorites")}`);
        return;
      }

      if (!response.ok) {
        setIsFavorite(!nextState);
        return;
      }

      const data = await response.json().catch(() => null);
      window.dispatchEvent(
        new CustomEvent("kimramen:favorites-updated", {
          detail: { productId, isFavorite: nextState, count: data?.count },
        })
      );
    } finally {
      setLoading(false);
    }
  }

  const sizeClass = variant === "inline" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = variant === "inline" ? 26 : 28;

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-label={isFavorite ? `Убрать ${productName || "товар"} из избранного` : `Добавить ${productName || "товар"} в избранное`}
      aria-pressed={isFavorite}
      className={`grid ${sizeClass} place-items-center rounded-none border-0 bg-transparent p-0 transition hover:scale-105 disabled:opacity-60 ${className}`}
    >
      <Image src={isFavorite ? FILLED_HEART : EMPTY_HEART} alt="" width={iconSize} height={iconSize} />
    </button>
  );
}
