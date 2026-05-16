"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Brand = {
  id: number;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  country: string;
  isActive: boolean;
  source: string;
  productCount: number;
};

type BrandForm = {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  country: string;
  isActive: boolean;
};

const emptyForm: BrandForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  websiteUrl: "",
  country: "",
  isActive: true,
};

function toForm(brand: Brand): BrandForm {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description || "",
    websiteUrl: brand.websiteUrl || "",
    country: brand.country || "",
    isActive: brand.isActive,
  };
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;

    return brands.filter((brand) =>
      [brand.name, brand.slug, brand.country, brand.source]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [brands, search]);

  const loadBrands = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/brands", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Не удалось загрузить бренды");
      }

      setBrands(data.brands || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки брендов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openCreateModal = () => {
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setForm(toForm(brand));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
  };

  const setField = <K extends keyof BrandForm>(field: K, value: BrandForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/brands", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Не удалось сохранить бренд");
      }

      await loadBrands();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения бренда");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Бренды</h1>
          <p className="mt-1 text-sm text-gray-500">
            Бренды подтягиваются из синхронизации Syrve и будут готовы для будущего фильтра каталога.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-[#08090b] px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
        >
          Новый бренд
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Список брендов</h2>
              <p className="mt-1 text-sm text-gray-500">Всего: {brands.length}</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по бренду, slug или стране..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-gray-400 md:max-w-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Бренд</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Страна</th>
                <th className="px-5 py-3">Товары</th>
                <th className="px-5 py-3">Источник</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Загружаю бренды...
                  </td>
                </tr>
              ) : filteredBrands.length ? (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{brand.name}</div>
                      <div className="text-xs text-gray-500">ID: {brand.id}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{brand.slug}</td>
                    <td className="px-5 py-4 text-gray-600">{brand.country || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{brand.productCount}</td>
                    <td className="px-5 py-4 text-gray-600">{brand.source}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          brand.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {brand.isActive ? "Активен" : "Скрыт"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(brand)}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black"
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Брендов пока нет. После синхронизации они появятся здесь автоматически.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {form.id ? "Редактировать бренд" : "Новый бренд"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Сейчас это справочник для админки. Позже подключим фильтр и страницу бренда на витрине.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Закрыть окно"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Название
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Bioasia"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  required
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-gray-700">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => setField("slug", event.target.value)}
                  placeholder="bioasia"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-gray-700">
                Страна / происхождение бренда
                <input
                  value={form.country}
                  onChange={(event) => setField("country", event.target.value)}
                  placeholder="Таиланд"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-gray-700">
                Сайт бренда
                <input
                  value={form.websiteUrl}
                  onChange={(event) => setField("websiteUrl", event.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-gray-700">
                Описание
                <textarea
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setField("isActive", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Активный бренд
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#08090b] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                >
                  {saving ? "Сохраняю..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
