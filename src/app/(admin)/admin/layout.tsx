"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/src/components/admin/context/SidebarContext";
import AppHeader from "@/src/components/admin/layout/AppHeader";
import AdminSidebar from "@/src/components/admin/layout/AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />

        <div className="lg:ml-[280px]">
          <AppHeader />

          <main className="p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}