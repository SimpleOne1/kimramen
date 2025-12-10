import React from "react";

import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col ">
      <Header />
      <main className="flex-1 ">{children}</main>
      <Footer />
    </div>
  );
}