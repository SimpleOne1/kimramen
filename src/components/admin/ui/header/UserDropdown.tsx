"use client";
import { adminFetch } from "@/src/lib/admin-fetch";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";

type CurrentAdmin = {
  login: string;
  email: string | null;
  displayName: string;
  role: "master_admin" | "moderator";
};

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  useEffect(() => {
    let isMounted = true;

    adminFetch("/api/admin/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (isMounted && data?.admin) setAdmin(data.admin);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await adminFetch("/api/admin/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  const initials = (admin?.displayName || admin?.login || "A").slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-gray-700 transition hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-gray-900">{admin?.displayName || "Admin"}</span>
          <span className="block text-xs text-gray-500">
            {admin?.role === "master_admin" ? "Master admin" : "Moderator"}
          </span>
        </span>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute right-0 mt-3 flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"
      >
        <div className="border-b border-gray-100 px-3 pb-3">
          <span className="block text-sm font-semibold text-gray-900">{admin?.displayName || "Admin"}</span>
          <span className="mt-0.5 block text-xs text-gray-500">{admin?.email || admin?.login || "admin"}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Выйти из админ-панели
        </button>
      </Dropdown>
    </div>
  );
}
