"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CartItem = {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  quantity: number;
};

type Customer = {
  email: string | null;
  phone: string | null;
  firstName: string | null;
  defaultDeliveryName: string | null;
  defaultDeliveryPhone: string | null;
  defaultDeliveryCity: string | null;
  defaultDeliveryStreet: string | null;
  defaultDeliveryHouse: string | null;
  defaultDeliveryApartment: string | null;
  defaultDeliveryComment: string | null;
};

const CART_KEY = "kimramen_cart";

const emptyCheckout = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  deliveryCity: "",
  deliveryStreet: "",
  deliveryHouse: "",
  deliveryApartment: "",
  deliveryComment: "",
  customerComment: "",
};

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("kimramen:cart-updated", { detail: items }));
}

function money(value: number, currency = "MDL") {
  return `${Number(value || 0).toFixed(0)} ${currency.toLowerCase()}`;
}

function buildCheckoutFromCustomer(customer: Customer | null) {
  return {
    customerName: customer?.defaultDeliveryName || customer?.firstName || "",
    customerEmail: customer?.email || "",
    customerPhone: customer?.defaultDeliveryPhone || customer?.phone || "",
    deliveryCity: customer?.defaultDeliveryCity || "",
    deliveryStreet: customer?.defaultDeliveryStreet || "",
    deliveryHouse: customer?.defaultDeliveryHouse || "",
    deliveryApartment: customer?.defaultDeliveryApartment || "",
    deliveryComment: customer?.defaultDeliveryComment || "",
    customerComment: "",
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState(emptyCheckout);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"maib" | "paynet">("maib");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setItems(readCart());

    fetch("/api/customer/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setCheckout(buildCheckoutFromCustomer(data?.customer || null)))
      .catch(() => undefined);
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const currency = items[0]?.currency || "MDL";

  function updateQuantity(id: number, quantity: number) {
    const nextItems = items
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item))
      .filter((item) => item.quantity > 0);
    setItems(nextItems);
    writeCart(nextItems);
  }

  function removeItem(id: number) {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    writeCart(nextItems);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setOrderNumber("");

    if (!items.length) {
      setMessage("Корзина пуста");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...checkout,
        paymentMethod,
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
      }),
    });
    const data = await response.json().catch(() => null);
    setIsSubmitting(false);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось создать заказ");
      return;
    }

    setOrderNumber(data.orderNumber || "");

    if (data.redirectUrl) {
      window.localStorage.setItem("kimramen_pending_order", data.orderNumber || "");
      window.location.href = data.redirectUrl;
      return;
    }

    setItems([]);
    writeCart([]);
    setMessage("Заказ создан. Мы свяжемся с вами для подтверждения.");
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">Корзина</h1>
        <p className="mt-1 text-sm text-gray-500">Проверьте товары и оформите заказ.</p>
      </div>

      {orderNumber ? (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          <p className="font-semibold">Номер заказа: {orderNumber}</p>
          <p className="mt-1 text-sm">Заказ сохранён в системе. Если вы вошли в аккаунт, он появится в истории заказов.</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[96px_minmax(0,1fr)_150px] sm:items-center">
                  <Link href={`/product/${item.id}`} className="relative h-24 w-24 overflow-hidden rounded-2xl bg-gray-50">
                    <Image src={item.image || "/images/products/example1.png"} alt={item.name} fill className="object-contain p-2" />
                  </Link>
                  <div>
                    <Link href={`/product/${item.id}`} className="font-semibold text-gray-950 hover:text-[#0067B9]">{item.name}</Link>
                    <p className="mt-1 text-sm text-gray-500">{money(item.price, item.currency)} за шт.</p>
                    <button type="button" onClick={() => removeItem(item.id)} className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700">Удалить</button>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="flex h-10 items-center rounded-2xl border border-gray-200 bg-white">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-10 w-10 rounded-l-2xl text-lg transition hover:bg-gray-100">−</button>
                      <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-10 w-10 rounded-r-2xl text-lg transition hover:bg-gray-100">+</button>
                    </div>
                    <p className="font-bold text-gray-950">{money(item.price * item.quantity, item.currency)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-950">Корзина пуста</p>
              <p className="mt-1 text-sm text-gray-500">Добавьте товары из каталога, чтобы оформить заказ.</p>
              <Link href="/catalog" className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border-2 border-gray-950 bg-white px-5 text-sm font-semibold text-gray-950 transition hover:bg-gray-950 hover:text-white">Перейти в каталог</Link>
            </div>
          )}
        </section>

        <form onSubmit={submitOrder} className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">Оформление заказа</h2>
          <div className="mt-5 space-y-3">
            <input required className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Имя" value={checkout.customerName} onChange={(event) => setCheckout({ ...checkout, customerName: event.target.value })} />
            <input required className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Телефон" value={checkout.customerPhone} onChange={(event) => setCheckout({ ...checkout, customerPhone: event.target.value })} />
            <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Email" value={checkout.customerEmail} onChange={(event) => setCheckout({ ...checkout, customerEmail: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Город" value={checkout.deliveryCity} onChange={(event) => setCheckout({ ...checkout, deliveryCity: event.target.value })} />
              <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Дом" value={checkout.deliveryHouse} onChange={(event) => setCheckout({ ...checkout, deliveryHouse: event.target.value })} />
            </div>
            <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Улица" value={checkout.deliveryStreet} onChange={(event) => setCheckout({ ...checkout, deliveryStreet: event.target.value })} />
            <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Квартира" value={checkout.deliveryApartment} onChange={(event) => setCheckout({ ...checkout, deliveryApartment: event.target.value })} />
            <textarea className="min-h-[88px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-950" placeholder="Комментарий к заказу" value={checkout.customerComment} onChange={(event) => setCheckout({ ...checkout, customerComment: event.target.value })} />
          </div>


          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-950">Способ оплаты</p>
            <div className="mt-3 grid gap-3">
              <label className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${paymentMethod === "maib" ? "border-gray-950 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400"}`}>
                <span>Банковская оплата maib</span>
                <input type="radio" name="paymentMethod" value="maib" checked={paymentMethod === "maib"} onChange={() => setPaymentMethod("maib")} />
              </label>
              <label className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${paymentMethod === "paynet" ? "border-gray-950 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400"}`}>
                <span>Paynet</span>
                <input type="radio" name="paymentMethod" value="paynet" checked={paymentMethod === "paynet"} onChange={() => setPaymentMethod("paynet")} />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-500">После нажатия кнопки мы создадим заказ и перенаправим вас на защищённую страницу оплаты.</p>
          </div>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-600"><span>Товары</span><span>{money(subtotal, currency)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-gray-600"><span>Доставка</span><span>Уточняется</span></div>
            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-950"><span>Итого</span><span>{money(subtotal, currency)}</span></div>
          </div>

          {message ? <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${orderNumber ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</div> : null}

          <button type="submit" disabled={isSubmitting || !items.length} className="mt-5 h-12 w-full rounded-2xl border-2 border-gray-950 bg-white px-5 text-sm font-semibold text-gray-950 transition hover:bg-gray-950 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400">
            {isSubmitting ? "Переходим к оплате..." : "Оформить и оплатить"}
          </button>
        </form>
      </div>
    </main>
  );
}
