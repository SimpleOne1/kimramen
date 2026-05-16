"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/src/components/admin/context/SidebarContext";
import AppHeader from "@/src/components/admin/layout/AppHeader";
import AdminSidebar from "@/src/components/admin/layout/AdminSidebar";
import AdminAuthGuard from "@/src/components/admin/auth/AdminAuthGuard";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin/login";

  if (isAuthPage) return <>{children}</>;

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar />

          <div className="lg:ml-[280px]">
            <AppHeader />

            <main className="p-4 md:p-5 xl:p-6">
              <div className="mx-auto w-full max-w-[1280px]">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
