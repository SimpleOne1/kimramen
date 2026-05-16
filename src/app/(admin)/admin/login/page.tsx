"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => {
    const rawFrom = searchParams?.get("from") || "/admin";
    return rawFrom.startsWith("/admin") && rawFrom !== "/admin/login" ? rawFrom : "/admin";
  }, [searchParams]);
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    adminFetch("/api/admin/auth/me", { cache: "no-store" })
      .then((response) => {
        if (isMounted && response.ok) router.replace(from);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [from, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await adminFetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || "Не удалось войти в админ-панель");
        return;
      }

      router.replace(from);
      router.refresh();
    } catch {
      setError("Проверь подключение и попробуй ещё раз");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-4 py-10">
      <section className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <Image
              src="/images/neon-logo.png"
              alt="Kimramen"
              width={82}
              height={82}
              priority
              className="h-[82px] w-[82px] object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-950">Вход в админ-панель</h1>
          <p className="mt-2 text-sm text-gray-500">Доступ только для администраторов Kimramen.</p>
          {from !== "/admin" ? (
            <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              После входа откроется запрошенный раздел админки.
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Логин</span>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-950"
              placeholder="admin"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Пароль</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-950"
              placeholder="Введите пароль"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Входим..." : "Войти"}
          </button>
        </form>
      </section>
    </main>
  );
}
function AdminLoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-4 py-10">
      <section className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-950" />
        <h1 className="text-lg font-semibold text-gray-950">Открываем вход</h1>
        <p className="mt-2 text-sm text-gray-500">Подготовка страницы авторизации админ-панели.</p>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
