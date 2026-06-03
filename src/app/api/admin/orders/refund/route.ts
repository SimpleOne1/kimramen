import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { refundMaibPaymentForOrder } from "@/src/lib/payments/maib";
import { logAppError } from "@/src/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const guard = await requireAdmin("orders.manage");
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const orderId = Number(body?.orderId || body?.id || 0);
    const amount = body?.amount === undefined || body?.amount === null || body?.amount === "" ? undefined : Number(body.amount);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ success: false, message: "Некорректный ID заказа" }, { status: 400 });
    }

    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      return NextResponse.json({ success: false, message: "Некорректная сумма возврата" }, { status: 400 });
    }

    const result = await refundMaibPaymentForOrder({ orderId, amount, reason });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true, refund: result });
  } catch (error) {
    console.error("POST /api/admin/orders/refund error:", error);
    await logAppError("POST /api/admin/orders/refund", error);
    return NextResponse.json({ success: false, message: "Не удалось выполнить возврат" }, { status: 500 });
  }
}
