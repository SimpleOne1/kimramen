"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled_by_manager";

type AdminOrderItem = {
  id: number;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
};

type AdminOrder = {
  id: number;
  orderNumber: string;
  customerId: number | null;
  status: OrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryCity: string | null;
  deliveryStreet: string | null;
  deliveryHouse: string | null;
  deliveryApartment: string | null;
  deliveryComment: string | null;
  customerComment: string | null;
  managerNote: string | null;
  subtotalAmount: number;
  deliveryAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: AdminOrderItem[];
};

type AdminOrderStats = {
  newOrders: number;
  confirmedOrders?: number;
  activeOrders?: number;
  processingOrders?: number;
  todayOrders: number;
  todayRevenue: number;
};

const statuses: Array<{ value: "" | OrderStatus; label: string }> = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "preparing", label: "Готовятся" },
  { value: "ready", label: "Готовы" },
  { value: "delivering", label: "В доставке" },
  { value: "completed", label: "Завершены" },
  { value: "cancelled_by_manager", label: "Отменены менеджером" },
];

const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В доставке",
  completed: "Завершён",
  cancelled_by_manager: "Отменён менеджером",
};

const statusClasses: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  confirmed: "bg-indigo-50 text-indigo-700",
  preparing: "bg-amber-50 text-amber-700",
  ready: "bg-orange-50 text-orange-700",
  delivering: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled_by_manager: "bg-gray-100 text-gray-600",
};

function formatMoney(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminOrderStats>({ newOrders: 0, confirmedOrders: 0, activeOrders: 0, todayOrders: 0, todayRevenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setIsLoading(true);
    setMessage("");

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);

    const response = await adminFetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      setOrders(data.orders || []);
      setStats(data.stats || { newOrders: 0, confirmedOrders: 0, activeOrders: 0, todayOrders: 0, todayRevenue: 0 });
    } else {
      setMessage(data?.message || "Не удалось загрузить заказы");
    }

    setIsLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOrders();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, status]);

  async function updateStatus(order: AdminOrder, nextStatus: OrderStatus) {
    const response = await adminFetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: nextStatus }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось изменить статус");
      return;
    }

    const updated = { ...order, status: nextStatus };
    setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
    setSelectedOrder((current) => (current?.id === order.id ? updated : current));
    await loadOrders();
  }

  async function updateManagerNote(order: AdminOrder) {
    const response = await adminFetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, managerNote: order.managerNote || "" }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось сохранить заметку менеджера");
      return;
    }

    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, managerNote: order.managerNote } : item)));
  }

  const visibleTotal = useMemo(() => orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0), [orders]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Заказы</h1>
          <p className="mt-1 text-sm text-gray-500">Обработка реальных заказов из корзины сайта.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск: номер, имя, телефон, email"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-950 sm:w-[280px]"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | OrderStatus)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-950"
          >
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Новые</div><div className="mt-1 text-2xl font-semibold text-gray-900">{stats.newOrders}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Активные</div><div className="mt-1 text-2xl font-semibold text-gray-900">{stats.activeOrders ?? stats.processingOrders ?? 0}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Сегодня</div><div className="mt-1 text-2xl font-semibold text-gray-900">{stats.todayOrders}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Сумма сегодня</div><div className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(stats.todayRevenue)}</div></div>
      </div>

      {message ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-gray-900">Найдено заказов: {orders.length}</div>
          <div className="text-sm text-gray-500">Сумма в текущем списке: {formatMoney(visibleTotal, orders[0]?.currency || "MDL")}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Заказ</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Загрузка...</td></tr>
              ) : orders.length ? orders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-4"><div className="font-semibold text-gray-900">{order.orderNumber}</div><div className="text-xs text-gray-500">{order.items.length} поз.</div></td>
                  <td className="px-4 py-4"><div className="font-medium text-gray-900">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerPhone}</div></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[order.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[order.status]}</span></td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{formatMoney(order.totalAmount, order.currency)}</td>
                  <td className="px-4 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedOrder(order)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">Открыть</button></td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Заказы не найдены.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="mt-1 text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Закрыть</button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Клиент</div>
                <div className="mt-2 text-sm text-gray-700">{selectedOrder.customerName}</div>
                <div className="text-sm text-gray-500">{selectedOrder.customerPhone}</div>
                {selectedOrder.customerEmail ? <div className="text-sm text-gray-500">{selectedOrder.customerEmail}</div> : null}
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Доставка</div>
                <div className="mt-2 text-sm text-gray-700">{[selectedOrder.deliveryCity, selectedOrder.deliveryStreet, selectedOrder.deliveryHouse, selectedOrder.deliveryApartment].filter(Boolean).join(", ") || "Адрес не указан"}</div>
                {selectedOrder.deliveryComment ? <div className="mt-1 text-sm text-gray-500">{selectedOrder.deliveryComment}</div> : null}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 border-b border-gray-100 p-4 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    <div className="text-xs text-gray-500">{item.sku || "без SKU"} · {item.quantity} × {formatMoney(item.unitPrice, item.currency)}</div>
                  </div>
                  <div className="text-right font-semibold text-gray-900">{formatMoney(item.totalPrice, item.currency)}</div>
                </div>
              ))}
            </div>

            {selectedOrder.customerComment ? <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Комментарий клиента: {selectedOrder.customerComment}</div> : null}

            <div className="mt-4 rounded-2xl border border-gray-200 p-4">
              <label className="text-sm font-semibold text-gray-900">Заметка менеджера</label>
              <textarea
                value={selectedOrder.managerNote || ""}
                onChange={(event) => setSelectedOrder((current) => current ? { ...current, managerNote: event.target.value } : current)}
                onBlur={() => updateManagerNote(selectedOrder)}
                placeholder="Например: клиент попросил перезвонить, сдача с 500 MDL..."
                className="mt-2 min-h-[86px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-gray-500">Итого</div>
                <div className="text-2xl font-semibold text-gray-900">{formatMoney(selectedOrder.totalAmount, selectedOrder.currency)}</div>
              </div>
              <select
                value={selectedOrder.status}
                onChange={(event) => updateStatus(selectedOrder, event.target.value as OrderStatus)}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-950"
              >
                {statuses.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
