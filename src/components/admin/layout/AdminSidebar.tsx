"use client";

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
  { label: "Заказы", href: "/admin/orders" },
  { label: "Клиенты", href: "/admin/customers" },
  { label: "Формы", href: "/admin/forms" },
  { label: "Настройки", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-gray-200 bg-white lg:block">
      
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/admin" className="block">
          <div className="text-xl font-semibold text-gray-900">
            Kimramen Admin
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Панель управления
          </div>
        </Link>
      </div>

      {/* Navigation */}
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
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-600"
                      : "text-gray-700 hover:bg-gray-100"
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