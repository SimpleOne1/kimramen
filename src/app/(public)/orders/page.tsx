"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В доставке",
  completed: "Выполнен",
  cancelled_by_manager: "Отменён менеджером",
};

function money(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(0)} ${currency.toLowerCase()}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/customer/orders", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          setMessage(data?.message || "Войдите в аккаунт, чтобы увидеть заказы");
          return;
        }
        setOrders(data.orders || []);
      })
      .catch(() => setMessage("Не удалось загрузить заказы"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Мои заказы</h1>
          <p className="mt-1 text-sm text-gray-500">История заказов, созданных после входа в аккаунт.</p>
        </div>
        <Link href="/cart" className="inline-flex h-11 items-center justify-center rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white">Корзина</Link>
      </div>

      {isLoading ? <div className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-600">Загрузка заказов...</div> : null}

      {!isLoading && message ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="font-semibold text-gray-950">{message}</p>
          <Link href="/account" className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white">Войти в кабинет</Link>
        </div>
      ) : null}

      {!isLoading && !message && !orders.length ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
          <p className="font-semibold text-gray-950">Заказов пока нет</p>
          <p className="mt-1 text-sm text-gray-500">После оформления заказа он появится здесь.</p>
          <Link href="/catalog" className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white">Перейти в каталог</Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">Заказ {order.orderNumber}</h2>
                <p className="mt-1 text-sm text-gray-500">{dateLabel(order.createdAt)} · {statusLabels[order.status] || order.status}</p>
              </div>
              <p className="text-lg font-bold text-gray-950">{money(order.totalAmount, order.currency)}</p>
            </div>
            <div className="mt-4 divide-y divide-gray-100 rounded-2xl bg-gray-50 px-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                  <span className="font-semibold text-gray-950">{money(item.totalPrice, item.currency)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
