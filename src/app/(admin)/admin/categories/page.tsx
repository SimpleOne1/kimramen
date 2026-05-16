"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Locale = "ru" | "en" | "ro";

type Translation = {
  name: string;
  description: string;
};

type Category = {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  translations: Record<Locale, Translation>;
};

type CategoryForm = {
  id: number | null;
  parentId: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
  translations: Record<Locale, Translation>;
};

const emptyForm: CategoryForm = {
  id: null,
  parentId: "",
  slug: "",
  sortOrder: "0",
  isActive: true,
  translations: {
    ru: { name: "", description: "" },
    en: { name: "", description: "" },
    ro: { name: "", description: "" },
  },
};

const locales: { key: Locale; label: string }[] = [
  { key: "ru", label: "RU" },
  { key: "en", label: "EN" },
  { key: "ro", label: "RO" },
];

function toForm(category: Category): CategoryForm {
  return {
    id: category.id,
    parentId: category.parentId ? String(category.parentId) : "",
    slug: category.slug,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
    translations: {
      ru: { ...category.translations.ru },
      en: { ...category.translations.en },
      ro: { ...category.translations.ro },
    },
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((category) => {
      const text = [
        category.name,
        category.slug,
        category.translations.ru.name,
        category.translations.en.name,
        category.translations.ro.name,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [categories, search]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/categories", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Не удалось загрузить категории");
      }

      setCategories(data.categories || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка загрузки категорий",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setForm(emptyForm);
    setActiveLocale("ru");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setForm(toForm(category));
    setActiveLocale("ru");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
    setActiveLocale("ru");
  };

  const resetForm = closeModal;

  const updateTranslation = (
    locale: Locale,
    field: keyof Translation,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: {
          ...current.translations[locale],
          [field]: value,
        },
      },
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/categories", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          parentId: form.parentId ? Number(form.parentId) : null,
          slug: form.slug,
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
          translations: form.translations,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Не удалось сохранить категорию");
      }

      await loadCategories();
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка сохранения категории",
      );
    } finally {
      setSaving(false);
    }
  };

  const seedCategories = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Не удалось добавить базовые категории",
        );
      }

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка добавления категорий",
      );
    } finally {
      setSaving(false);
    }
  };

  const activeTranslation = form.translations[activeLocale];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Категории</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление разделами каталога, переводами, slug и сортировкой.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={seedCategories}
            disabled={saving}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Добавить базовые категории
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-[#08090b] px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            Новая категория
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Список категорий
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Всего: {categories.length}
                </p>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по названию или slug..."
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-gray-400 md:max-w-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Категория</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Товары</th>
                  <th className="px-5 py-3">Сорт.</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      Загружаю категории...
                    </td>
                  </tr>
                ) : filteredCategories.length ? (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {category.id}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {category.slug}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {category.productCount}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {category.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {category.isActive ? "Активна" : "Скрыта"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black"
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      Категорий пока нет. Нажми «Добавить базовые категории».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {form.id ? "Редактировать категорию" : "Новая категория"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Основной язык — русский, но поля уже готовы для EN и RO.
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
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                    placeholder="rice"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  Сортировка
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm font-medium text-gray-700">
                Родительская категория
                <select
                  value={form.parentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      parentId: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                >
                  <option value="">Без родителя</option>
                  {categories
                    .filter((category) => category.id !== form.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Активная категория
              </label>

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="mb-4 flex gap-2">
                  {locales.map((locale) => (
                    <button
                      key={locale.key}
                      type="button"
                      onClick={() => setActiveLocale(locale.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        activeLocale === locale.key
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {locale.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="space-y-1 text-sm font-medium text-gray-700">
                    Название ({activeLocale.toUpperCase()})
                    <input
                      value={activeTranslation.name}
                      onChange={(event) =>
                        updateTranslation(
                          activeLocale,
                          "name",
                          event.target.value,
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </label>

                  <label className="space-y-1 text-sm font-medium text-gray-700">
                    Описание ({activeLocale.toUpperCase()})
                    <textarea
                      value={activeTranslation.description}
                      onChange={(event) =>
                        updateTranslation(
                          activeLocale,
                          "description",
                          event.target.value,
                        )
                      }
                      rows={5}
                      className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#08090b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
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
