import { NextResponse } from "next/server";
import { getCurrentAdmin, type CurrentAdmin } from "@/src/lib/auth/admin";
import { hasAdminPermission, type AdminPermission } from "@/src/lib/auth/permissions";

type AdminGuardResult =
  | { ok: true; admin: CurrentAdmin; response?: undefined }
  | { ok: false; response: NextResponse; admin?: undefined };

const PERMISSION_ALIASES: Record<string, AdminPermission> = {
  "dashboard.view": "dashboard:read",
  "orders.view": "orders:read",
  "orders.manage": "orders:update",
  "customers.view": "users:read",
  "products.view": "products:read",
  "products.manage": "products:update",
  "products:view": "products:read",
  "products:update": "products:update",
  "products:create": "products:create",
  "products:delete": "products:delete",
  "categories.view": "categories:read",
  "categories.manage": "categories:update",
  "categories:view": "categories:read",
  "categories:update": "categories:update",
  "categories:create": "categories:create",
  "categories:delete": "categories:delete",
  "brands.view": "products:read",
  "brands.manage": "products:update",
  "brands:view": "products:read",
  "brands:update": "products:update",
  "settings.view": "settings:read",
  "settings.manage": "settings:update",
  "settings:view": "settings:read",
  "settings:update": "settings:update",
  "admins.view": "admins:read",
  "admins.manage": "admins:update",
  "syrve.sync": "products:update",
  "sync:run": "products:update",
};

function normalizePermission(permission?: string): AdminPermission | null {
  if (!permission) return null;

  if (permission in PERMISSION_ALIASES) {
    return PERMISSION_ALIASES[permission];
  }

  // If a route already passes the new permission format, keep it.
  return permission as AdminPermission;
}

export async function requireAdmin(permission?: string): Promise<AdminGuardResult> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Требуется вход в админ-панель" },
        { status: 401 },
      ),
    };
  }

  const normalizedPermission = normalizePermission(permission);

  if (normalizedPermission && !hasAdminPermission(admin.role, normalizedPermission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Недостаточно прав для этого действия" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, admin };
}
