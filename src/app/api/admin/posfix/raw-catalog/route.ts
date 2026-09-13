import { NextRequest, NextResponse } from "next/server";
import { logAppError } from "@/src/lib/logger";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { fetchPosfixCatalog } from "@/src/services/posfix/posfix.client";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin("products:view");
    if (!guard.ok) return guard.response;

    const catalog = await fetchPosfixCatalog();
    const json = JSON.stringify(catalog, null, 2);

    if (request.nextUrl.searchParams.get("download") === "1") {
      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="posfix-catalog-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    return new NextResponse(json, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    await logAppError("GET /api/admin/posfix/raw-catalog", error);
    console.error("GET /api/admin/posfix/raw-catalog error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Не удалось получить каталог POSfix" },
      { status: 500 },
    );
  }
}
