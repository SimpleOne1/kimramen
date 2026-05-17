"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

type PromotionProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  mainImage: string | null;
  sku: string | null;
};

type Promotion = {
  id: number;
  title: string;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  productsCount: number;
  products: PromotionProduct[];
};

type ProductSearchItem = PromotionProduct & {
  stockQuantity?: number;
  isActive?: boolean;
};

type PromotionDraft = {
  id?: number;
  title: string;
  discountPercent: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  selectedProducts: PromotionProduct[];
};

const emptyDraft: PromotionDraft = {
  title: "",
  discountPercent: "10",
  startsAt: "",
  endsAt: "",
  isActive: true,
  selectedProducts: [],
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

function formatPeriod(promotion: Promotion) {
  if (!promotion.startsAt && !promotion.endsAt) return "Бессрочно";
  if (promotion.startsAt && !promotion.endsAt) return `С ${promotion.startsAt}`;
  if (!promotion.startsAt && promotion.endsAt) return `До ${promotion.endsAt}`;
  return `${promotion.startsAt} — ${promotion.endsAt}`;
}

function formatPrice(price: number, currency = "MDL") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

function promotionToDraft(promotion: Promotion): PromotionDraft {
  return {
    id: promotion.id,
    title: promotion.title,
    discountPercent: String(promotion.discountPercent),
    startsAt: toDateTimeLocal(promotion.startsAt),
    endsAt: toDateTimeLocal(promotion.endsAt),
    isActive: promotion.isActive,
    selectedProducts: promotion.products || [],
  };
}

export default function AdminPromotionsClient() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [draft, setDraft] = useState<PromotionDraft>(emptyDraft);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedProductIds = useMemo(
    () => new Set(draft.selectedProducts.map((product) => product.id)),
    [draft.selectedProducts],
  );

  async function loadPromotions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/promotions", { cache: "no-store" });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось загрузить акции");
      setPromotions(Array.isArray(data.promotions) ? data.promotions : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить акции");
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts(query: string) {
    setProductsLoading(true);

    try {
      const params = new URLSearchParams({ limit: "30", page: "1" });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось загрузить товары");

      setProductResults(
        (data.products || []).map((product: Record<string, unknown>) => ({
          id: Number(product.id),
          name: String(product.name || "Без названия"),
          slug: String(product.slug || ""),
          price: Number(product.price || 0),
          currency: String(product.currency || "MDL"),
          mainImage: typeof product.mainImage === "string" ? product.mainImage : null,
          sku: typeof product.sku === "string" ? product.sku : null,
          stockQuantity: Number(product.stockQuantity || 0),
          isActive: Boolean(product.isActive),
        })),
      );
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Не удалось загрузить товары");
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
    searchProducts("");
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      searchProducts(productQuery);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [productQuery]);

  function resetDraft() {
    setDraft(emptyDraft);
    setSuccessMessage(null);
  }

  function addProduct(product: PromotionProduct) {
    if (selectedProductIds.has(product.id)) return;
    setDraft((current) => ({
      ...current,
      selectedProducts: [...current.selectedProducts, product],
    }));
  }

  function removeProduct(productId: number) {
    setDraft((current) => ({
      ...current,
      selectedProducts: current.selectedProducts.filter((product) => product.id !== productId),
    }));
  }

  async function submitPromotion() {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        id: draft.id,
        title: draft.title,
        discountPercent: Number(draft.discountPercent),
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
        isActive: draft.isActive,
        productIds: draft.selectedProducts.map((product) => product.id),
      };

      const response = await adminFetch("/api/admin/promotions", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось сохранить акцию");

      setSuccessMessage(draft.id ? "Акция обновлена" : "Акция создана");
      resetDraft();
      await loadPromotions();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить акцию");
    } finally {
      setSaving(false);
    }
  }

  async function deletePromotion(id: number) {
    const confirmed = window.confirm("Удалить эту акцию? Товары не удалятся, будет удалена только связь с акцией.");
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      const response = await adminFetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось удалить акцию");

      if (draft.id === id) resetDraft();
      await loadPromotions();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить акцию");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Акции</h1>
          <p className="mt-1 text-sm text-gray-500">
            Создание скидок по проценту, сроку действия и выбранным товарам.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDraft}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          + Новая акция
        </button>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {successMessage ? <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Список акций</h2>
              <p className="text-sm text-gray-500">Редактирование открывается справа в форме.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {promotions.length} шт.
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Загружаю акции...</div> : null}

            {!loading && promotions.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                Акций пока нет. Создай первую акцию справа.
              </div>
            ) : null}

            {promotions.map((promotion) => (
              <article key={promotion.id} className="rounded-2xl border border-gray-200 p-4 transition hover:border-brand-200 hover:bg-brand-50/20">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{promotion.title}</h3>
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        -{promotion.discountPercent}%
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${promotion.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {promotion.isActive ? "Активна" : "Выключена"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{formatPeriod(promotion)}</p>
                    <p className="mt-1 text-sm text-gray-500">Товаров в акции: {promotion.productsCount}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft(promotionToDraft(promotion))}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePromotion(promotion.id)}
                      disabled={saving}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {promotion.products.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {promotion.products.slice(0, 8).map((product) => (
                      <span key={product.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {product.name}
                      </span>
                    ))}
                    {promotion.products.length > 8 ? (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        +{promotion.products.length - 8}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{draft.id ? "Редактировать акцию" : "Создать акцию"}</h2>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Название акции</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Например: Скидка на рамен"
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Процент скидки</span>
                <input
                  type="number"
                  min="1"
                  max="95"
                  value={draft.discountPercent}
                  onChange={(event) => setDraft((current) => ({ ...current, discountPercent: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Акция включена</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Начало</span>
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Окончание</span>
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </label>
            </div>

            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Если даты не выбраны, акция считается бессрочной. Если выбрать только окончание — акция работает до этой даты.
            </p>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Товары в акции</h3>
                <span className="text-xs font-medium text-gray-500">Выбрано: {draft.selectedProducts.length}</span>
              </div>

              <input
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Поиск товара по названию, SKU, slug, бренду..."
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />

              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-2">
                {productsLoading ? <div className="p-3 text-sm text-gray-500">Ищу товары...</div> : null}

                {!productsLoading && productResults.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Товары не найдены</div>
                ) : null}

                {productResults.map((product) => {
                  const selected = selectedProductIds.has(product.id);

                  return (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.mainImage ? (
                          <Image src={product.mainImage} alt={product.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">no img</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                        <p className="truncate text-xs text-gray-500">
                          {formatPrice(product.price, product.currency)} {product.sku ? `· ${product.sku}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => (selected ? removeProduct(product.id) : addProduct(product))}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
                          selected
                            ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-brand-500 text-white hover:bg-brand-600"
                        }`}
                        style={!selected ? { color: "#ffffff" } : undefined}
                        aria-label={selected ? "Убрать товар из акции" : "Добавить товар в акцию"}
                      >
                        {selected ? "−" : "+"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {draft.selectedProducts.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.selectedProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-red-50 hover:text-red-600"
                      title="Нажми, чтобы убрать"
                    >
                      {product.name} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={submitPromotion}
                disabled={saving}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
                style={{ color: "#ffffff" }}
              >
                {saving ? "Сохраняю..." : draft.id ? "Сохранить изменения" : "Создать акцию"}
              </button>

              {draft.id ? (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Отмена
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
