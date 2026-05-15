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

  function openFullSyrveJson() {
    window.open("/api/admin/syrve/raw-nomenclature", "_blank", "noopener,noreferrer");
  }

  function downloadFullSyrveJson() {
    window.open("/api/admin/syrve/raw-nomenclature?download=1", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={syncProducts}
          disabled={loading}
          className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Синхронизация..." : "↻ Синхронизировать"}
        </button>

        <button
          type="button"
          onClick={openFullSyrveJson}
          className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
          title="Открыть полный сырой JSON номенклатуры Syrve в новой вкладке"
        >
          ↗ Полный JSON
        </button>

        <button
          type="button"
          onClick={downloadFullSyrveJson}
          className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          title="Скачать полный сырой JSON номенклатуры Syrve файлом"
        >
          ↓ Скачать JSON
        </button>
      </div>
      {message && <span className="max-w-[420px] text-right text-xs text-gray-500">{message}</span>}
    </div>
  );
}
