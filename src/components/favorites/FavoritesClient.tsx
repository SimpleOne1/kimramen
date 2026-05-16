"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FavoriteProduct } from "@/src/lib/customer/favorites";
import ProductCard from "@/src/components/product/productCard";

type State = {
  loading: boolean;
  authenticated: boolean;
  favorites: FavoriteProduct[];
  message: string | null;
};

export default function FavoritesClient() {
  const [state, setState] = useState<State>({
    loading: true,
    authenticated: true,
    favorites: [],
    message: null,
  });

  useEffect(() => {
    let alive = true;

    async function loadFavorites() {
      try {
        const response = await fetch("/api/customer/favorites", { cache: "no-store" });
        if (!alive) return;

        if (response.status === 401) {
          setState({ loading: false, authenticated: false, favorites: [], message: null });
          return;
        }

        const data = await response.json();
        setState({
          loading: false,
          authenticated: true,
          favorites: Array.isArray(data.favorites) ? data.favorites : [],
          message: data.success ? null : data.message || "Не удалось загрузить избранное",
        });
      } catch {
        if (!alive) return;
        setState({ loading: false, authenticated: true, favorites: [], message: "Не удалось загрузить избранное" });
      }
    }

    loadFavorites();

    function reloadFavorites() {
      loadFavorites();
    }

    window.addEventListener("kimramen:favorites-updated", reloadFavorites);
    return () => {
      alive = false;
      window.removeEventListener("kimramen:favorites-updated", reloadFavorites);
    };
  }, []);

  if (state.loading) {
    return <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm">Загружаем избранное...</div>;
  }

  if (!state.authenticated) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#19191A]">Избранное</h1>
        <p className="mt-3 text-slate-600">Войдите в аккаунт, чтобы сохранять товары и быстро возвращаться к ним.</p>
        <Link href="/account" className="mt-6 inline-flex rounded-2xl bg-[#19191A] px-6 py-3 font-semibold text-white transition hover:bg-[#0067B9]">
          Войти или зарегистрироваться
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#19191A]">Избранное</h1>
        <p className="mt-2 text-slate-600">{state.favorites.length ? `${state.favorites.length} товаров сохранено` : "Пока нет сохранённых товаров."}</p>
      </div>

      {state.message && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{state.message}</div>}

      {state.favorites.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {state.favorites.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-sm">
          Добавляйте товары сердечком в карточках — они появятся здесь.
        </div>
      )}
    </section>
  );
}
