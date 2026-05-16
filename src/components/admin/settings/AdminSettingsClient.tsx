"use client";

import { useEffect, useMemo, useState } from "react";

type SiteSetting = {
  key: string;
  value: unknown;
  group: string;
  description: string | null;
};

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? null, null, 2);
}

function parseValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (["true", "false", "null"].includes(trimmed)) return JSON.parse(trimmed);
  if (!Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export default function AdminSettingsClient() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось загрузить настройки");
      setSettings(data.settings || []);
      setDrafts(Object.fromEntries((data.settings || []).map((setting: SiteSetting) => [setting.key, stringifyValue(setting.value)])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const groupedSettings = useMemo(() => {
    return settings.reduce<Record<string, SiteSetting[]>>((acc, setting) => {
      acc[setting.group] ||= [];
      acc[setting.group].push(setting);
      return acc;
    }, {});
  }, [settings]);

  async function save(setting: SiteSetting) {
    setSavingKey(setting.key);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: setting.key,
          group: setting.group,
          description: setting.description,
          value: parseValue(drafts[setting.key] || ""),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Не удалось сохранить настройку");
      await loadSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить настройку");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Загружаю настройки...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Настройки сайта</h1>
        <p className="mt-2 text-sm text-gray-500">
          Здесь хранятся глобальные настройки: контакты, SEO по умолчанию, доставка, часы работы и соцсети.
        </p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {Object.entries(groupedSettings).map(([group, groupSettings]) => (
        <section key={group} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold capitalize text-gray-900">{group}</h2>
          <div className="mt-4 space-y-4">
            {groupSettings.map((setting) => (
              <div key={setting.key} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{setting.key}</p>
                    {setting.description ? <p className="text-sm text-gray-500">{setting.description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => save(setting)}
                    disabled={savingKey === setting.key}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingKey === setting.key ? "Сохраняю..." : "Сохранить"}
                  </button>
                </div>
                <textarea
                  value={drafts[setting.key] || ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))}
                  className="mt-3 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
