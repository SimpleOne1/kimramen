"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: number;
  login: string;
  email: string | null;
  displayName: string;
  role: "master_admin" | "moderator";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type CurrentAdmin = {
  id: number;
  role: "master_admin" | "moderator";
};

const emptyForm = {
  login: "",
  email: "",
  displayName: "",
  password: "",
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const canManage = currentAdmin?.role === "master_admin";

  async function loadAdmins() {
    setIsLoading(true);
    const response = await adminFetch("/api/admin/admins", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.success) {
      setAdmins(data.admins || []);
      setCurrentAdmin(data.currentAdmin || null);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialAdmins() {
      try {
        const response = await adminFetch("/api/admin/admins", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!isMounted) return;

        if (response.ok && data?.success) {
          setAdmins(data.admins || []);
          setCurrentAdmin(data.currentAdmin || null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialAdmins();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await adminFetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось создать модератора");
      return;
    }

    setForm(emptyForm);
    setIsModalOpen(false);
    await loadAdmins();
  }

  async function toggleActive(admin: AdminUser) {
    const response = await adminFetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin.id, isActive: !admin.isActive }),
    });

    if (response.ok) await loadAdmins();
  }

  const stats = useMemo(() => {
    return {
      total: admins.length,
      active: admins.filter((admin) => admin.isActive).length,
      moderators: admins.filter((admin) => admin.role === "moderator").length,
    };
  }, [admins]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Администраторы</h1>
          <p className="mt-1 text-sm text-gray-500">Master admin управляет доступом модераторов.</p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-11 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-black"
          >
            Новый модератор
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Всего</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Активные</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.active}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Модераторы</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.moderators}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Пользователь</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Последний вход</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-4 py-5 text-gray-500" colSpan={5}>Загрузка...</td></tr>
              ) : admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{admin.displayName}</div>
                    <div className="text-xs text-gray-500">{admin.login}{admin.email ? ` · ${admin.email}` : ""}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {admin.role === "master_admin" ? "Master admin" : "Moderator"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${admin.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {admin.isActive ? "Активен" : "Отключён"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{admin.lastLoginAt || "—"}</td>
                  <td className="px-4 py-4 text-right">
                    {canManage && admin.role !== "master_admin" ? (
                      <button
                        type="button"
                        onClick={() => toggleActive(admin)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        {admin.isActive ? "Отключить" : "Включить"}
                      </button>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Новый модератор</h2>
                <p className="mt-1 text-sm text-gray-500">Создаётся обычный модератор без master-прав.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Закрыть</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Логин" value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} />
              <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Имя в админке" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
              <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Email, необязательно" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Пароль минимум 8 символов" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />

              {message ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700">Отмена</button>
                <button type="submit" className="h-11 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white">Создать</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
