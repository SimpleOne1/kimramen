import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { getSiteSettings, updateSiteSettings } from "@/src/lib/settings";
import { writeErrorLog } from "@/src/lib/server/error-log";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function GET() {
  try {
    const guard = await requireAdmin("settings:view");
    if (!guard.ok) return guard.response;


    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    await writeErrorLog("GET /api/admin/settings", error);
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить настройки" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin("settings:update");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;



    const body = await request.json().catch(() => ({}));
    const settings = await updateSiteSettings(body?.settings || body || {});

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    await writeErrorLog("PUT /api/admin/settings", error);
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json({ success: false, message: "Не удалось сохранить настройки" }, { status: 500 });
  }
}
