import { NextRequest, NextResponse } from "next/server";
import { loginAdmin } from "@/src/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = await loginAdmin(String(body?.login || ""), String(body?.password || ""));

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("POST /api/admin/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось войти в админ-панель" },
      { status: 500 }
    );
  }
}
