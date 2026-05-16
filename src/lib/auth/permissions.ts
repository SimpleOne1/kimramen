export type AdminRole = "master_admin" | "admin" | "manager" | "content_manager";

export type AdminPermission =
  | "admin:access"
  | "dashboard:read"
  | "orders:read"
  | "orders:update"
  | "products:read"
  | "products:create"
  | "products:update"
  | "products:delete"
  | "categories:read"
  | "categories:create"
  | "categories:update"
  | "categories:delete"
  | "settings:read"
  | "settings:update"
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "admins:read"
  | "admins:create"
  | "admins:update"
  | "admins:delete";

export const ADMIN_ROLES: AdminRole[] = [
  "master_admin",
  "admin",
  "manager",
  "content_manager",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  master_admin: "Master admin",
  admin: "Admin",
  manager: "Manager",
  content_manager: "Content manager",
};

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  master_admin: [
    "admin:access",
    "dashboard:read",
    "orders:read",
    "orders:update",
    "products:read",
    "products:create",
    "products:update",
    "products:delete",
    "categories:read",
    "categories:create",
    "categories:update",
    "categories:delete",
    "settings:read",
    "settings:update",
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "admins:read",
    "admins:create",
    "admins:update",
    "admins:delete",
  ],
  admin: [
    "admin:access",
    "dashboard:read",
    "orders:read",
    "orders:update",
    "products:read",
    "products:create",
    "products:update",
    "categories:read",
    "categories:create",
    "categories:update",
    "settings:read",
    "settings:update",
    "users:read",
  ],
  manager: [
    "admin:access",
    "dashboard:read",
    "orders:read",
    "orders:update",
    "products:read",
    "categories:read",
    "users:read",
  ],
  content_manager: [
    "admin:access",
    "dashboard:read",
    "products:read",
    "products:create",
    "products:update",
    "categories:read",
    "categories:create",
    "categories:update",
    "settings:read",
  ],
};

export function normalizeAdminRole(role: unknown): AdminRole {
  if (typeof role !== "string") {
    return "manager";
  }

  if ((ADMIN_ROLES as string[]).includes(role)) {
    return role as AdminRole;
  }

  // Backward compatibility for older DB/session values.
  if (role === "super_admin" || role === "owner") {
    return "master_admin";
  }

  if (role === "moderator") {
    return "manager";
  }

  return "manager";
}

export function hasAdminPermission(
  role: AdminRole | string | null | undefined,
  permission: AdminPermission,
): boolean {
  const normalizedRole = normalizeAdminRole(role);
  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function requireAdminPermission(
  role: AdminRole | string | null | undefined,
  permission: AdminPermission,
): void {
  if (!hasAdminPermission(role, permission)) {
    throw new Error(`Admin permission denied: ${permission}`);
  }
}
