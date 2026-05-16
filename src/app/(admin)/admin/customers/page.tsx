"use client";

import { useEffect, useMemo, useState } from "react";

type CustomerOrder = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
};

type AdminCustomer = {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  defaultDeliveryName: string | null;
  defaultDeliveryPhone: string | null;
  defaultDeliveryCity: string | null;
  defaultDeliveryStreet: string | null;
  defaultDeliveryHouse: string | null;
  defaultDeliveryApartment: string | null;
  defaultDeliveryComment: string | null;
  authProvider: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  recentOrders: CustomerOrder[];
};

const statusLabels: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  completed: "Завершён",
  cancelled: "Отменён",
};

function formatMoney(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function customerName(customer: AdminCustomer) {
  const joinedName = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  return joinedName || customer.defaultDeliveryName || customer.email || customer.phone || `Клиент #${customer.id}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCustomers() {
    setIsLoading(true);
    setMessage("");

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(`/api/admin/customers?${params.toString()}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      setCustomers(data.customers || []);
    } else {
      setMessage(data?.message || "Не удалось загрузить клиентов");
    }

    setIsLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCustomers();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withOrders: customers.filter((customer) => customer.ordersCount > 0).length,
      totalSpent: customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0),
    };
  }, [customers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Клиенты</h1>
          <p className="mt-1 text-sm text-gray-500">Контакты, сохранённые данные доставки и история заказов.</p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск: имя, email, телефон"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-950 sm:w-[320px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Клиентов</div><div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">С заказами</div><div className="mt-1 text-2xl font-semibold text-gray-900">{stats.withOrders}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Сумма заказов</div><div className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(stats.totalSpent)}</div></div>
      </div>

      {message ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Контакты</th>
                <th className="px-4 py-3">Заказы</th>
                <th className="px-4 py-3">Последний заказ</th>
                <th className="px-4 py-3">Регистрация</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Загрузка...</td></tr>
              ) : customers.length ? customers.map((customer) => (
                <tr key={customer.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{customerName(customer)}</div>
                    <div className="text-xs text-gray-500">ID {customer.id} · {customer.authProvider}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-700">{customer.phone || customer.defaultDeliveryPhone || "—"}</div>
                    <div className="text-xs text-gray-500">{customer.email || "email не указан"}</div>
                  </td>
                  <td className="px-4 py-4"><div className="font-semibold text-gray-900">{customer.ordersCount}</div><div className="text-xs text-gray-500">{formatMoney(customer.totalSpent)}</div></td>
                  <td className="px-4 py-4 text-gray-500">{formatDate(customer.lastOrderAt)}</td>
                  <td className="px-4 py-4 text-gray-500">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedCustomer(customer)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">Открыть</button></td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Клиенты не найдены.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{customerName(selectedCustomer)}</h2>
                <p className="mt-1 text-sm text-gray-500">Клиент #{selectedCustomer.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Закрыть</button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Контакты</div>
                <div className="mt-2 text-sm text-gray-700">Телефон: {selectedCustomer.phone || selectedCustomer.defaultDeliveryPhone || "—"}</div>
                <div className="text-sm text-gray-700">Email: {selectedCustomer.email || "—"}</div>
                <div className="text-sm text-gray-500">Последний вход: {formatDate(selectedCustomer.lastLoginAt)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Сохранённая доставка</div>
                <div className="mt-2 text-sm text-gray-700">{[selectedCustomer.defaultDeliveryCity, selectedCustomer.defaultDeliveryStreet, selectedCustomer.defaultDeliveryHouse, selectedCustomer.defaultDeliveryApartment].filter(Boolean).join(", ") || "Адрес не указан"}</div>
                {selectedCustomer.defaultDeliveryComment ? <div className="mt-1 text-sm text-gray-500">{selectedCustomer.defaultDeliveryComment}</div> : null}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-semibold text-gray-900">Последние заказы</div>
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                {selectedCustomer.recentOrders.length ? selectedCustomer.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-start justify-between gap-4 border-b border-gray-100 p-4 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)} · {statusLabels[order.status] || order.status}</div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatMoney(order.totalAmount, order.currency)}</div>
                  </div>
                )) : <div className="p-4 text-sm text-gray-500">Заказов пока нет.</div>}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
