export type AdminRole = "master_admin" | "admin" | "manager" | "content_manager" | "moderator";

export type AdminPermission =
  | "dashboard.view"
  | "orders.view"
  | "orders.manage"
  | "customers.view"
  | "products.view"
  | "products.manage"
  | "categories.manage"
  | "brands.manage"
  | "settings.view"
  | "settings.manage"
  | "admins.manage"
  | "syrve.sync";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  master_admin: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "products.view",
    "products.manage",
    "categories.manage",
    "brands.manage",
    "settings.view",
    "settings.manage",
    "admins.manage",
    "syrve.sync",
  ],
  admin: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "products.view",
    "products.manage",
    "categories.manage",
    "brands.manage",
    "settings.view",
    "settings.manage",
    "syrve.sync",
  ],
  manager: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "products.view",
    "settings.view",
  ],
  content_manager: [
    "dashboard.view",
    "products.view",
    "products.manage",
    "categories.manage",
    "brands.manage",
    "settings.view",
  ],
  // Backward compatibility for old accounts created as "moderator".
  moderator: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "products.view",
    "settings.view",
  ],
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole {
  if (role === "master_admin" || role === "admin" || role === "manager" || role === "content_manager" || role === "moderator") {
    return role;
  }

  return "manager";
}

export function hasAdminPermission(role: string | null | undefined, permission: AdminPermission) {
  return ROLE_PERMISSIONS[normalizeAdminRole(role)].includes(permission);
}

export function listAdminPermissions(role: string | null | undefined) {
  return ROLE_PERMISSIONS[normalizeAdminRole(role)];
}
