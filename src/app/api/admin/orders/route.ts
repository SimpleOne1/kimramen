import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/lib/auth/admin";
import { getAdminOrders, updateAdminOrder, getAdminOrderDashboardStats } from "@/src/lib/admin/orders";
import { adminOrderPatchSchema, zodMessage } from "@/src/lib/validation/orders";
import { logAppError } from "@/src/lib/logger";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) return NextResponse.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orders = await getAdminOrders({
      status: searchParams.get("status"),
      search: searchParams.get("search"),
      limit: Number(searchParams.get("limit") || 80),
    });
    const stats = await getAdminOrderDashboardStats();

    return NextResponse.json({ success: true, orders, stats });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    await logAppError("GET /api/admin/orders", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить заказы" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = adminOrderPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: zodMessage(parsed.error) }, { status: 400 });
    }

    const result = await updateAdminOrder(
      parsed.data.id,
      {
        status: parsed.data.status,
        managerNote: parsed.data.managerNote,
      },
      currentAdmin.id
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);
    await logAppError("PATCH /api/admin/orders", error);
    return NextResponse.json(
      { success: false, message: "Не удалось изменить заказ" },
      { status: 500 }
    );
  }
}
