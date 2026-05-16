"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardOrder = {
  id: number;
  orderNumber: string;
  status: "new" | "processing" | "completed" | "cancelled";
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
};

type DashboardData = {
  stats: {
    productsCount: number;
    activeProductsCount: number;
    categoriesCount: number;
    customersCount: number;
    adminsCount: number;
    ordersCount: number;
    todayOrdersCount: number;
    processingOrdersCount: number;
    newOrdersCount: number;
    todayRevenue: number;
    totalRevenue: number;
  };
  statusCounts: {
    new: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  recentOrders: DashboardOrder[];
};

const statusLabels: Record<DashboardOrder["status"], string> = {
  new: "Новый",
  processing: "В работе",
  completed: "Готово",
  cancelled: "Отменён",
};

const statusClassNames: Record<DashboardOrder["status"], string> = {
  new: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatMoney(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setError("");
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!isMounted) return;

        if (!response.ok || !data?.success) {
          setError(data?.message || "Не удалось загрузить dashboard");
          return;
        }

        setDashboard(data.dashboard);
      } catch {
        if (isMounted) setError("Не удалось загрузить dashboard");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const stats = dashboard?.stats;

    return [
      {
        label: "Заказы сегодня",
        value: stats?.todayOrdersCount ?? 0,
        href: "/admin/orders",
        helper: `${formatMoney(stats?.todayRevenue ?? 0)} сегодня`,
      },
      {
        label: "Новые заказы",
        value: stats?.newOrdersCount ?? 0,
        href: "/admin/orders?status=new",
        helper: `${stats?.processingOrdersCount ?? 0} в работе`,
      },
      {
        label: "Клиенты",
        value: stats?.customersCount ?? 0,
        href: "/admin/customers",
        helper: "зарегистрированные аккаунты",
      },
      {
        label: "Товары",
        value: stats?.productsCount ?? 0,
        href: "/admin/products",
        helper: `${stats?.activeProductsCount ?? 0} активных`,
      },
    ];
  }, [dashboard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Рабочий центр управления Kimramen с реальными данными магазина.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
            Заказы
          </Link>
          <Link href="/admin/products" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
            Товары
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{isLoading ? "—" : card.value}</div>
            <div className="mt-2 text-xs text-gray-500">{card.helper}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
              <p className="mt-0.5 text-sm text-gray-500">Быстрый контроль новых заявок.</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-gray-900 hover:underline">Все</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Заказ</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td className="px-4 py-5 text-gray-500" colSpan={5}>Загрузка...</td></tr>
                ) : dashboard?.recentOrders?.length ? dashboard.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-4 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{formatMoney(order.totalAmount, order.currency)}</td>
                    <td className="px-4 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td className="px-4 py-5 text-gray-500" colSpan={5}>Заказов пока нет.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Состояние системы</h2>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span>Всего заказов</span>
              <span className="font-semibold text-gray-900">{dashboard?.stats.ordersCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span>Выручка всего</span>
              <span className="font-semibold text-gray-900">{formatMoney(dashboard?.stats.totalRevenue ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span>Категории</span>
              <span className="font-semibold text-gray-900">{dashboard?.stats.categoriesCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span>Активные админы</span>
              <span className="font-semibold text-gray-900">{dashboard?.stats.adminsCount ?? 0}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">Статусы заказов</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">Новые: {dashboard?.statusCounts.new ?? 0}</div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">В работе: {dashboard?.statusCounts.processing ?? 0}</div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">Готово: {dashboard?.statusCounts.completed ?? 0}</div>
              <div className="rounded-xl bg-gray-100 px-3 py-2 text-gray-600">Отмена: {dashboard?.statusCounts.cancelled ?? 0}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
