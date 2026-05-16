import { NextResponse } from "next/server";
import { getAdminDashboardData } from "@/src/lib/admin/dashboard";
import { requireAdmin } from "@/src/lib/admin/guard";

export async function GET() {
  try {
    const guard = await requireAdmin("dashboard.view");
    if (!guard.ok) return guard.response;
    const currentAdmin = guard.admin;

    const dashboard = await getAdminDashboardData();
    return NextResponse.json({ success: true, dashboard, currentAdmin });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить dashboard" },
      { status: 500 }
    );
  }
}
