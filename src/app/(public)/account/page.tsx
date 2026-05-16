"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
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
};

type AuthMode = "login" | "register";

const emptyProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  defaultDeliveryName: "",
  defaultDeliveryPhone: "",
  defaultDeliveryCity: "",
  defaultDeliveryStreet: "",
  defaultDeliveryHouse: "",
  defaultDeliveryApartment: "",
  defaultDeliveryComment: "",
};

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", phone: "" });
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function fillProfile(nextCustomer: Customer | null) {
    setProfileForm({
      firstName: nextCustomer?.firstName || "",
      lastName: nextCustomer?.lastName || "",
      phone: nextCustomer?.phone || "",
      defaultDeliveryName: nextCustomer?.defaultDeliveryName || "",
      defaultDeliveryPhone: nextCustomer?.defaultDeliveryPhone || "",
      defaultDeliveryCity: nextCustomer?.defaultDeliveryCity || "",
      defaultDeliveryStreet: nextCustomer?.defaultDeliveryStreet || "",
      defaultDeliveryHouse: nextCustomer?.defaultDeliveryHouse || "",
      defaultDeliveryApartment: nextCustomer?.defaultDeliveryApartment || "",
      defaultDeliveryComment: nextCustomer?.defaultDeliveryComment || "",
    });
  }

  async function loadCustomer() {
    const response = await fetch("/api/customer/auth/me", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    const nextCustomer = data?.customer || null;
    setCustomer(nextCustomer);
    fillProfile(nextCustomer);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCustomer().catch(() => setIsLoading(false));
  }, []);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const endpoint = mode === "login" ? "/api/customer/auth/login" : "/api/customer/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось выполнить действие");
      return;
    }

    await loadCustomer();
    router.refresh();
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    const response = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const data = await response.json().catch(() => null);

    setIsSaving(false);

    if (!response.ok || !data?.success) {
      setMessage(data?.message || "Не удалось сохранить данные");
      return;
    }

    setCustomer(data.customer || null);
    fillProfile(data.customer || null);
    setMessage("Данные сохранены");
  }

  async function handleLogout() {
    await fetch("/api/customer/auth/logout", { method: "POST" });
    setCustomer(null);
    fillProfile(null);
    router.refresh();
  }

  if (isLoading) {
    return <main className="mx-auto w-full max-w-[1120px] px-4 py-10 text-gray-600">Загрузка кабинета...</main>;
  }

  if (!customer) {
    return (
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        <div className="mx-auto max-w-[520px] rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h1 className="text-2xl font-semibold text-gray-950">Личный кабинет</h1>
          <p className="mt-2 text-sm text-gray-500">Войдите или зарегистрируйтесь, чтобы сохранять данные доставки и видеть свои заказы.</p>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-gray-100 p-1 text-sm font-semibold">
            <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`rounded-xl px-4 py-2 ${mode === "login" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"}`}>Вход</button>
            <button type="button" onClick={() => { setMode("register"); setMessage(""); }} className={`rounded-xl px-4 py-2 ${mode === "register" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"}`}>Регистрация</button>
          </div>

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {mode === "register" ? (
              <>
                <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Имя" value={authForm.firstName} onChange={(event) => setAuthForm({ ...authForm, firstName: event.target.value })} />
                <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Телефон" value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} />
              </>
            ) : null}
            <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Email" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
            <input className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Пароль" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />

            {message ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null}

            <button type="submit" className="h-12 w-full rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-black">
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Личный кабинет</h1>
          <p className="mt-1 text-sm text-gray-500">{customer.email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          Выйти
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleProfileSave} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-950">Сохранённые данные</h2>
          <p className="mt-1 text-sm text-gray-500">Эти данные позже будут автоматически подставляться при оформлении заказа.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Имя" value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Фамилия" value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Телефон аккаунта" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Имя получателя" value={profileForm.defaultDeliveryName} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryName: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Телефон для доставки" value={profileForm.defaultDeliveryPhone} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryPhone: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Город" value={profileForm.defaultDeliveryCity} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryCity: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950 sm:col-span-2" placeholder="Улица" value={profileForm.defaultDeliveryStreet} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryStreet: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Дом" value={profileForm.defaultDeliveryHouse} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryHouse: event.target.value })} />
            <input className="h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-950" placeholder="Квартира" value={profileForm.defaultDeliveryApartment} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryApartment: event.target.value })} />
            <textarea className="min-h-[110px] rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-950 sm:col-span-2" placeholder="Комментарий к доставке" value={profileForm.defaultDeliveryComment} onChange={(event) => setProfileForm({ ...profileForm, defaultDeliveryComment: event.target.value })} />
          </div>

          {message ? <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${message === "Данные сохранены" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</div> : null}

          <button type="submit" disabled={isSaving} className="mt-5 h-12 rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
            {isSaving ? "Сохраняем..." : "Сохранить данные"}
          </button>
        </form>

        <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-950">Заказы</h2>
          <p className="mt-2 text-sm text-gray-500">Здесь можно перейти к истории заказов, которые были оформлены после входа в аккаунт.</p>
          <a href="/orders" className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Перейти к заказам
          </a>
        </aside>
      </div>
    </main>
  );
}
