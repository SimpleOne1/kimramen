import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { getCurrentAdmin } from "@/src/lib/auth/admin";
import { ensureAuthSchema } from "@/src/lib/auth/schema";
import { hashPassword } from "@/src/lib/auth/password";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

type AdminRow = {
  id: number;
  login: string;
  email: string | null;
  display_name: string;
  role: "master_admin" | "moderator";
  is_active: number | boolean;
  last_login_at: string | null;
  created_at: string;
};

function mapAdmin(row: AdminRow) {
  return {
    id: Number(row.id),
    login: row.login,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) return NextResponse.json({ success: false }, { status: 401 });

    await ensureAuthSchema();
    const conn = await pool.getConnection();

    try {
      const rows = await conn.query<AdminRow[]>(
        `
        SELECT id, login, email, display_name, role, is_active, last_login_at, created_at
        FROM admin_users
        ORDER BY role = 'master_admin' DESC, created_at DESC, id DESC
        `
      );

      return NextResponse.json({ success: true, admins: rows.map(mapAdmin), currentAdmin });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("GET /api/admin/admins error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось загрузить администраторов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;

    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) return NextResponse.json({ success: false }, { status: 401 });
    if (currentAdmin.role !== "master_admin") {
      return NextResponse.json(
        { success: false, message: "Создавать модераторов может только master admin" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const login = String(body?.login || "").trim();
    const password = String(body?.password || "");
    const displayName = String(body?.displayName || login).trim();
    const email = String(body?.email || "").trim() || null;

    if (login.length < 3 || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Логин минимум 3 символа, пароль минимум 8 символов" },
        { status: 400 }
      );
    }

    await ensureAuthSchema();
    const conn = await pool.getConnection();

    try {
      const result = await conn.query(
        `
        INSERT INTO admin_users (login, email, password_hash, display_name, role, is_active, created_by)
        VALUES (?, ?, ?, ?, 'moderator', 1, ?)
        `,
        [login, email, hashPassword(password), displayName || login, currentAdmin.id]
      );

      return NextResponse.json({ success: true, id: Number(result.insertId) });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("POST /api/admin/admins error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось создать модератора" },
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
    if (currentAdmin.role !== "master_admin") {
      return NextResponse.json({ success: false, message: "Недостаточно прав" }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body?.id || 0);
    const isActive = body?.isActive === true;

    if (!id || id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, message: "Нельзя изменить эту запись" },
        { status: 400 }
      );
    }

    await ensureAuthSchema();
    const conn = await pool.getConnection();

    try {
      await conn.query(`UPDATE admin_users SET is_active = ? WHERE id = ? AND role <> 'master_admin'`, [isActive ? 1 : 0, id]);
      if (!isActive) {
        await conn.query(`UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_user_id = ? AND revoked_at IS NULL`, [id]);
      }
      return NextResponse.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("PATCH /api/admin/admins error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось изменить администратора" },
      { status: 500 }
    );
  }
}
