import { cookies, headers } from "next/headers";
import pool from "@/src/lib/db";
import { createSecureToken, sha256, verifyPassword } from "@/src/lib/auth/password";
import { ensureAuthSchema } from "@/src/lib/auth/schema";
import { normalizeAdminRole, type AdminRole } from "@/src/lib/auth/permissions";
import { clearAdminCsrfCookie, setAdminCsrfCookie } from "@/src/lib/auth/csrf-server";

export const ADMIN_SESSION_COOKIE = "kimramen_admin_session";
const ADMIN_SESSION_DAYS = 7;

type AdminLoginRow = {
  id: number;
  login: string;
  email: string | null;
  password_hash: string;
  display_name: string;
  role: AdminRole;
  is_active: number | boolean;
};

export type CurrentAdmin = {
  id: number;
  login: string;
  email: string | null;
  displayName: string;
  role: AdminRole;
};

type SessionRow = CurrentAdmin & {
  session_id: number;
  expires_at: Date | string;
};

function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ADMIN_SESSION_DAYS);
  return expiresAt;
}

async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent")?.slice(0, 255) || null,
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || null,
  };
}

export async function loginAdmin(login: string, password: string) {
  await ensureAuthSchema();

  const normalizedLogin = login.trim();
  if (!normalizedLogin || !password) return null;

  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<AdminLoginRow[]>(
      `
      SELECT id, login, email, password_hash, display_name, role, is_active
      FROM admin_users
      WHERE login = ? OR email = ?
      LIMIT 1
      `,
      [normalizedLogin, normalizedLogin]
    );

    const admin = rows[0];
    if (!admin || !Boolean(admin.is_active)) return null;
    if (!verifyPassword(password, admin.password_hash)) return null;

    const token = createSecureToken();
    const tokenHash = sha256(token);
    const expiresAt = sessionExpiresAt();
    const meta = await requestMeta();

    await conn.query(
      `
      INSERT INTO admin_sessions (admin_user_id, token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [admin.id, tokenHash, meta.userAgent, meta.ipAddress, expiresAt]
    );

    await conn.query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = ?`, [admin.id]);

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    await setAdminCsrfCookie();

    return {
      id: Number(admin.id),
      login: admin.login,
      email: admin.email,
      displayName: admin.display_name,
      role: normalizeAdminRole(admin.role),
    } satisfies CurrentAdmin;
  } finally {
    conn.release();
  }
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<SessionRow[]>(
      `
      SELECT
        s.id AS session_id,
        s.expires_at,
        u.id,
        u.login,
        u.email,
        u.display_name AS displayName,
        u.role
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.is_active = 1
      LIMIT 1
      `,
      [sha256(token)]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: Number(row.id),
      login: row.login,
      email: row.email,
      displayName: row.displayName,
      role: normalizeAdminRole(row.role),
    };
  } finally {
    conn.release();
  }
}

export async function logoutAdmin() {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `UPDATE admin_sessions SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL`,
        [sha256(token)]
      );
    } finally {
      conn.release();
    }
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
  await clearAdminCsrfCookie();
}
