import React from "react";

import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import MobileHeader from "@/src/components/layout/MobileHeader";
import MobileFooter from "@/src/components/layout/MobileFooter";
import MobileBottomNav from "@/src/components/layout/MobileBottomNav";
import SupportWidget from "@/src/components/support/SupportWidget";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EEE9EA]">
      {/* Desktop */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>

      <main className="flex-1 pb-[76px] lg:pb-0">{children}</main>

      {/* Desktop footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile footer */}
      <div className="lg:hidden">
        <MobileFooter />
        <MobileBottomNav />
      </div>

      <SupportWidget />
    </div>
  );
}