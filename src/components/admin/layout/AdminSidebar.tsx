"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  label: string;
  href: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Категории", href: "/admin/categories" },
  { label: "Товары", href: "/admin/products" },
  { label: "Бренды", href: "/admin/brands" },
  { label: "Заказы", href: "/admin/orders" },
  { label: "Клиенты", href: "/admin/customers" },
  { label: "Админы", href: "/admin/admins" },
  { label: "Настройки", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-white/10 bg-[#08090b] text-white lg:block">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/admin" className="block">
          <Image
            src="/images/logo-white.png"
            alt="Kimramen"
            width={170}
            height={54}
            priority
            className="h-auto w-[170px] object-contain"
          />
          <div className="mt-3 text-sm text-gray-400">Панель управления</div>
        </Link>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              currentPath.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border border-white/70 bg-white/[0.03] text-white shadow-[0_0_18px_rgba(255,255,255,0.45),inset_0_0_18px_rgba(255,255,255,0.08)]"
                      : "border border-transparent text-gray-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
