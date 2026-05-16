import { NextRequest, NextResponse } from "next/server";
import { getAdminCustomers } from "@/src/lib/admin/customers";
import { requireAdmin } from "@/src/lib/admin/guard";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin("customers.view");
    if (!guard.ok) return guard.response;
    const currentAdmin = guard.admin;

    const { searchParams } = new URL(request.url);
    const customers = await getAdminCustomers({
      search: searchParams.get("search"),
      limit: Number(searchParams.get("limit") || 80),
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить клиентов" },
      { status: 500 }
    );
  }
}
