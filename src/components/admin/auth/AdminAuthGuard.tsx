"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AuthState = "checking" | "allowed" | "denied";

type AdminAuthGuardProps = {
  children: ReactNode;
};

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>("checking");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function verifyAdminSession() {
      try {
        const response = await fetch("/api/admin/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (response.ok) {
          setState("allowed");
          return;
        }

        setState("denied");
        const target = pathname && pathname !== "/admin/login" ? pathname : "/admin";
        router.replace(`/admin/login?from=${encodeURIComponent(target)}`);
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;
        setState("denied");
        router.replace("/admin/login");
      }
    }

    verifyAdminSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pathname, router]);

  if (state !== "allowed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <section className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-950" />
          <h1 className="text-lg font-semibold text-gray-950">Проверяем доступ</h1>
          <p className="mt-2 text-sm text-gray-500">Если сессия недействительна, откроется вход в админ-панель.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
