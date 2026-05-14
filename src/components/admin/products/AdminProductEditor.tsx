"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type Locale = "ru" | "en" | "ro";
const locales: Locale[] = ["ru", "en", "ro"];
const localeLabels: Record<Locale, string> = { ru: "RU", en: "EN", ro: "RO" };

const darkButtonStyle = {
  backgroundColor: "#101828",
  color: "#ffffff",
} as const;

type Category = { id: number; name: string; parentId: number | null };
type ProductImage = { id?: number; path: string; altText?: string | null; sortOrder?: number; isMain?: boolean };
type Translation = { name: string; shortDescription: string; description: string; metaTitle: string; metaDescription: string };

type ProductForm = {
  id: number;
  sku: string;
  barcode: string;
  slug: string;
  price: number | string;
  oldPrice: number | string | null;
  currency: string;
  stockQuantity: number | string;
  minOrderQty: number | string;
  netWeightGrams: number | string | null;
  weightValue: number | string | null;
  weightUnit: string;
  isActive: boolean;
  mainImage: string;
  brand: string;
  manufacturer: string;
  countryOfOrigin: string;
  translations: Record<Locale, Translation>;
  categoryIds: number[];
  images: ProductImage[];
};

function emptyTranslation(): Translation {
  return { name: "", shortDescription: "", description: "", metaTitle: "", metaDescription: "" };
}

export default function AdminProductEditor({ product, categories }: { product: any; categories: Category[] }) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");
  const [activeTab, setActiveTab] = useState("main");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(() => ({
    id: product.id,
    sku: product.sku || "",
    barcode: product.barcode || "",
    slug: product.slug || "",
    price: product.price ?? 0,
    oldPrice: product.oldPrice ?? "",
    currency: product.currency || "MDL",
    stockQuantity: product.stockQuantity ?? 0,
    minOrderQty: product.minOrderQty ?? 1,
    netWeightGrams: product.netWeightGrams ?? "",
    weightValue: product.weightValue ?? "",
    weightUnit: product.weightUnit || "g",
    isActive: product.isActive ?? true,
    mainImage: product.mainImage || "",
    brand: product.brand || "",
    manufacturer: product.manufacturer || "",
    countryOfOrigin: product.countryOfOrigin || "",
    translations: {
      ru: { ...emptyTranslation(), ...(product.translations?.ru || {}) },
      en: { ...emptyTranslation(), ...(product.translations?.en || {}) },
      ro: { ...emptyTranslation(), ...(product.translations?.ro || {}) },
    },
    categoryIds: product.categoryIds || [],
    images: product.images || [],
  }));

  const mainTitle = useMemo(() => form.translations.ru.name || form.translations.en.name || "Без названия", [form.translations]);

  function setField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTranslation(locale: Locale, key: keyof Translation, value: string) {
    setForm((prev) => ({
      ...prev,
      translations: { ...prev.translations, [locale]: { ...prev.translations[locale], [key]: value } },
    }));
  }

  function toggleCategory(id: number) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((item) => item !== id)
        : [...prev.categoryIds, id],
    }));
  }

  function setMainImage(path: string) {
    setForm((prev) => ({
      ...prev,
      mainImage: path,
      images: prev.images.map((image) => ({ ...image, isMain: image.path === path })),
    }));
  }

  function removeImage(path: string) {
    setForm((prev) => {
      const images = prev.images.filter((image) => image.path !== path);
      const mainImage = prev.mainImage === path ? images[0]?.path || "" : prev.mainImage;
      return { ...prev, images: images.map((image) => ({ ...image, isMain: image.path === mainImage })), mainImage };
    });
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const data = new FormData();
    data.append("file", file);
    try {
      const response = await fetch(`/api/admin/products/${form.id}/images`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Ошибка загрузки");
      setForm((prev) => ({
        ...prev,
        mainImage: result.isMain ? result.path : prev.mainImage,
        images: [...prev.images, { path: result.path, isMain: result.isMain, sortOrder: prev.images.length }],
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Ошибка сохранения");
      setMessage("Сохранено. Эти поля больше не будут затираться синхронизацией.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    ["main", "Основное"], ["translations", "Переводы"], ["prices", "Цены и остатки"],
    ["images", "Фото"], ["seo", "SEO"], ["categories", "Категории"],
  ];

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Редактирование товара</h1>
            <p className="mt-1 text-sm text-gray-500">{mainTitle}</p><p className="mt-2 text-xs text-gray-400">После сохранения ручные поля не будут затираться следующей синхронизацией.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => router.push(`/admin/products/${form.id}`)} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Открыть карточку</button>
            <button type="submit" disabled={saving} style={darkButtonStyle} className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-60">{saving ? "Сохраняю..." : "Сохранить"}</button>
          </div>
        </div>
        {message && <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{message}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="space-y-1">
            {tabs.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)} style={activeTab === key ? darkButtonStyle : undefined} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeTab === key ? "shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}>{label}</button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {activeTab === "main" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Название RU" value={form.translations.ru.name} onChange={(v) => setTranslation("ru", "name", v)} />
              <Input label="Slug" value={form.slug} onChange={(v) => setField("slug", v)} />
              <Input label="Бренд" value={form.brand} onChange={(v) => setField("brand", v)} placeholder="Bioasia" />
              <Input label="Страна происхождения" value={form.countryOfOrigin} onChange={(v) => setField("countryOfOrigin", v)} placeholder="Таиланд" />
              <Input label="SKU / Артикул" value={form.sku} onChange={(v) => setField("sku", v)} />
              <Input label="Штрихкод" value={form.barcode} onChange={(v) => setField("barcode", v)} />
              <Input label="Вес / объём" value={String(form.weightValue ?? "")} onChange={(v) => setField("weightValue", v)} placeholder="250" />
              <Select label="Единица" value={form.weightUnit} onChange={(v) => setField("weightUnit", v)} options={["g", "kg", "ml", "l", "pcs"]} />
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-700 md:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} /> Показывать товар на сайте</label>
            </div>
          )}

          {activeTab === "translations" && (
            <div className="space-y-5">
              <div className="flex gap-2">{locales.map((locale) => <button type="button" key={locale} onClick={() => setActiveLocale(locale)} style={activeLocale === locale ? darkButtonStyle : undefined} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeLocale === locale ? "shadow-sm" : "bg-gray-100 text-gray-700"}`}>{localeLabels[locale]}</button>)}</div>
              <Input label={`Название ${localeLabels[activeLocale]}`} value={form.translations[activeLocale].name} onChange={(v) => setTranslation(activeLocale, "name", v)} />
              <Textarea label="Короткое описание" value={form.translations[activeLocale].shortDescription} onChange={(v) => setTranslation(activeLocale, "shortDescription", v)} rows={3} />
              <Textarea label="Описание / WYSIWYG пока textarea" value={form.translations[activeLocale].description} onChange={(v) => setTranslation(activeLocale, "description", v)} rows={10} />
            </div>
          )}

          {activeTab === "prices" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Цена" value={String(form.price)} onChange={(v) => setField("price", v)} />
              <Input label="Старая цена" value={String(form.oldPrice ?? "")} onChange={(v) => setField("oldPrice", v)} />
              <Select label="Валюта" value={form.currency} onChange={(v) => setField("currency", v)} options={["MDL", "EUR", "USD"]} />
              <Input label="Остаток" value={String(form.stockQuantity)} onChange={(v) => setField("stockQuantity", v)} />
              <Input label="Минимальное количество" value={String(form.minOrderQty)} onChange={(v) => setField("minOrderQty", v)} />
              <Input label="Вес в граммах для фильтров" value={String(form.netWeightGrams ?? "")} onChange={(v) => setField("netWeightGrams", v)} />
            </div>
          )}

          {activeTab === "images" && (
            <div className="space-y-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:bg-gray-100">
                <span className="text-sm font-semibold text-gray-800">{uploading ? "Загружаю..." : "Загрузить фото"}</span>
                <span className="mt-1 text-xs text-gray-500">Файл будет сохранён в /public/uploads/products и конвертирован в WebP, если установлен sharp.</span>
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {form.images.map((image) => (
                  <div key={image.path} className="rounded-2xl border border-gray-200 p-3">
                    <div className="relative h-44 overflow-hidden rounded-xl bg-gray-100">
                      <Image src={image.path} alt={mainTitle} fill className="object-contain" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setMainImage(image.path)} style={form.mainImage === image.path ? darkButtonStyle : undefined} className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${form.mainImage === image.path ? "shadow-sm" : "bg-gray-100 text-gray-700"}`}>Главное</button>
                      <button type="button" onClick={() => removeImage(image.path)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-5">
              <div className="flex gap-2">{locales.map((locale) => <button type="button" key={locale} onClick={() => setActiveLocale(locale)} style={activeLocale === locale ? darkButtonStyle : undefined} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeLocale === locale ? "shadow-sm" : "bg-gray-100 text-gray-700"}`}>{localeLabels[locale]}</button>)}</div>
              <Input label="Meta title" value={form.translations[activeLocale].metaTitle} onChange={(v) => setTranslation(activeLocale, "metaTitle", v)} />
              <Textarea label="Meta description" value={form.translations[activeLocale].metaDescription} onChange={(v) => setTranslation(activeLocale, "metaDescription", v)} rows={4} />
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid gap-2 md:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
                  <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  {category.name}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span><input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900" /></label>;
}
function Textarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span><textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900" /></label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
