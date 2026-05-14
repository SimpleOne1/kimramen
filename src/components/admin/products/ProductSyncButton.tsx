"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncProducts() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/products/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Ошибка синхронизации");
      setMessage("Синхронизация завершена, ручные правки сохранены");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка синхронизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={syncProducts}
        disabled={loading}
        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Синхронизация..." : "↻ Синхронизировать"}
      </button>
      {message && <span className="max-w-[260px] text-right text-xs text-gray-500">{message}</span>}
    </div>
  );
}
