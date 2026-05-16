"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { FormEvent, useEffect, useState } from "react";

type SiteSettings = {
  site: { phone: string; email: string; workHours: string };
  delivery: { city: string; priceText: string; freeFrom: string };
  seo: { defaultTitle: string; defaultDescription: string };
  social: { instagram: string; facebook: string; tiktok: string };
  banners: { homepageNotice: string };
};

const emptySettings: SiteSettings = {
  site: { phone: "", email: "", workHours: "" },
  delivery: { city: "", priceText: "", freeFrom: "" },
  seo: { defaultTitle: "Kimramen", defaultDescription: "" },
  social: { instagram: "", facebook: "", tiktok: "" },
  banners: { homepageNotice: "" },
};

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  textarea?: boolean;
  onChange: (value: string) => void;
};

function Field({ label, value, placeholder, textarea, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      )}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await adminFetch("/api/admin/settings", { cache: "no-store" });
        const data = await response.json();
        if (active && data?.success && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        if (active) setMessage("Не удалось загрузить настройки");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  function patch<K extends keyof SiteSettings, F extends keyof SiteSettings[K]>(section: K, field: F, value: string) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Не удалось сохранить настройки");
      }

      setSettings(data.settings);
      setMessage("Настройки сохранены");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Загрузка настроек...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Настройки сайта</h1>
          <p className="mt-1 text-sm text-slate-500">
            Контакты, доставка, SEO по умолчанию, соцсети и служебные email-настройки.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">{message}</div>
      ) : null}

      <Section title="Контакты">
        <Field label="Телефон" value={settings.site.phone} placeholder="+373 ..." onChange={(value) => patch("site", "phone", value)} />
        <Field label="Email сайта / получатель заказов" value={settings.site.email} placeholder="orders@kimramen..." onChange={(value) => patch("site", "email", value)} />
        <Field label="Часы работы" value={settings.site.workHours} placeholder="Пн-Вс 10:00–22:00" onChange={(value) => patch("site", "workHours", value)} />
      </Section>

      <Section title="Доставка">
        <Field label="Город" value={settings.delivery.city} placeholder="Chișinău" onChange={(value) => patch("delivery", "city", value)} />
        <Field label="Бесплатная доставка от" value={settings.delivery.freeFrom} placeholder="например: от 600 MDL" onChange={(value) => patch("delivery", "freeFrom", value)} />
        <Field label="Текст условий доставки" textarea value={settings.delivery.priceText} onChange={(value) => patch("delivery", "priceText", value)} />
      </Section>

      <Section title="SEO по умолчанию">
        <Field label="Default title" value={settings.seo.defaultTitle} onChange={(value) => patch("seo", "defaultTitle", value)} />
        <Field label="Default description" textarea value={settings.seo.defaultDescription} onChange={(value) => patch("seo", "defaultDescription", value)} />
      </Section>

      <Section title="Соцсети и баннеры">
        <Field label="Instagram" value={settings.social.instagram} onChange={(value) => patch("social", "instagram", value)} />
        <Field label="Facebook" value={settings.social.facebook} onChange={(value) => patch("social", "facebook", value)} />
        <Field label="TikTok" value={settings.social.tiktok} onChange={(value) => patch("social", "tiktok", value)} />
        <Field label="Сообщение/баннер на главной" textarea value={settings.banners.homepageNotice} onChange={(value) => patch("banners", "homepageNotice", value)} />
      </Section>
    </form>
  );
}
