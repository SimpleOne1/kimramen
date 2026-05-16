"use client";

import UserDropdown from "@/src/components/admin/ui/header/UserDropdown";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white">
      <div className="flex w-full items-center justify-end px-4 py-3 lg:px-5">
        <UserDropdown />
      </div>
    </header>
  );
}
