import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  getAdminPromotions,
  parsePromotionPayload,
  updateAdminPromotion,
} from "@/src/lib/admin/promotions";
import { logAppError } from "@/src/lib/logger";

function parseId(request: NextRequest, body?: unknown) {
  const fromQuery = Number(request.nextUrl.searchParams.get("id") || 0);
  if (Number.isInteger(fromQuery) && fromQuery > 0) return fromQuery;

  if (body && typeof body === "object") {
    const fromBody = Number((body as Record<string, unknown>).id || 0);
    if (Number.isInteger(fromBody) && fromBody > 0) return fromBody;
  }

  return 0;
}

export async function GET() {
  try {
    const guard = await requireAdmin("products:view");
    if (!guard.ok) return guard.response;

    const promotions = await getAdminPromotions();
    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    await logAppError("GET /api/admin/promotions", error);
    console.error("GET /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить акции" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("products:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const payload = parsePromotionPayload(await request.json());
    const id = await createAdminPromotion(payload);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    await logAppError("POST /api/admin/promotions", error);
    console.error("POST /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Не удалось создать акцию" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin("products:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const body = await request.json();
    const id = parseId(request, body);
    if (!id) {
      return NextResponse.json({ success: false, message: "Не найден ID акции" }, { status: 400 });
    }

    const payload = parsePromotionPayload(body);
    await updateAdminPromotion(id, payload);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    await logAppError("PATCH /api/admin/promotions", error);
    console.error("PATCH /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Не удалось сохранить акцию" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin("products:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const id = parseId(request);
    if (!id) {
      return NextResponse.json({ success: false, message: "Не найден ID акции" }, { status: 400 });
    }

    await deleteAdminPromotion(id);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    await logAppError("DELETE /api/admin/promotions", error);
    console.error("DELETE /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось удалить акцию" },
      { status: 500 },
    );
  }
}
