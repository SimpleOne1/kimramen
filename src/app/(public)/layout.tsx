import React from "react";
import { cookies } from "next/headers";

import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import MobileHeader from "@/src/components/layout/MobileHeader";
import MobileFooter from "@/src/components/layout/MobileFooter";
import MobileBottomNav from "@/src/components/layout/MobileBottomNav";
import SupportWidget from "@/src/components/support/SupportWidget";
import DevelopmentModePage from "@/src/components/development/DevelopmentModePage";
import { ADMIN_SESSION_COOKIE } from "@/src/lib/auth/admin";
import { getSiteSettings } from "@/src/lib/settings";
import { writeErrorLog } from "@/src/lib/server/error-log";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  let developmentMode = { enabled: false, title: "", message: "" };

  try {
    const settings = await getSiteSettings();
    developmentMode = settings.development;
  } catch (error) {
    await writeErrorLog("PublicLayout.getSiteSettings", error);
  }

  const cookieStore = await cookies();
  const hasAdminSession = Boolean(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (developmentMode.enabled && !hasAdminSession) {
    return <DevelopmentModePage title={developmentMode.title} message={developmentMode.message} />;
  }

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