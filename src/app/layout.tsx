// src/app/layout.tsx
// Root layout: wraps all routes with I18nProvider

import type { Metadata } from "next";
import "@/globals.css";
import { I18nProvider } from "@/src/components/providers/I18nProvider";

export const metadata: Metadata = {
  title: "Kimramen",
  description: "Kimramen online asian food market",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white text-slate-900">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}