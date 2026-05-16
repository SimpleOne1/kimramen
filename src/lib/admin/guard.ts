import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/lib/auth/admin";
import type { CurrentAdmin } from "@/src/lib/auth/admin";
import { hasAdminPermission, type AdminPermission } from "@/src/lib/admin/permissions";

export type AdminGuardResult =
  | { ok: true; admin: CurrentAdmin; response?: undefined }
  | { ok: false; response: NextResponse; admin?: undefined };

export async function requireAdmin(permission?: AdminPermission): Promise<AdminGuardResult> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Требуется вход в админ-панель" },
        { status: 401 }
      ),
    };
  }

  if (permission && !hasAdminPermission(admin.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Недостаточно прав для этого действия" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, admin };
}
