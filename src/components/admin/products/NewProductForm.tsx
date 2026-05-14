"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [brand, setBrand] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          brand,
          countryOfOrigin: country,
          translations: {
            ru: { name },
            en: { name },
            ro: { name },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Ошибка создания");
      router.push(`/admin/products/${data.id}/edit`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка создания");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Добавить товар вручную</h1>
        <p className="mt-1 text-sm text-gray-500">После создания откроется полная карточка редактирования.</p>
      </div>
      {message && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
      <Input label="Название RU" value={name} onChange={setName} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Цена" value={price} onChange={setPrice} />
        <Input label="Бренд" value={brand} onChange={setBrand} />
        <Input label="Страна" value={country} onChange={setCountry} />
      </div>
      <button disabled={saving || !name.trim()} className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">{saving ? "Создаю..." : "Создать товар"}</button>
    </form>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900" /></label>;
}
