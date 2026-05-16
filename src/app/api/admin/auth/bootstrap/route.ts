import { NextResponse } from "next/server";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

export async function POST() {
  try {
    await ensureAuthSchema();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/auth/bootstrap error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось подготовить таблицы авторизации" },
      { status: 500 }
    );
  }
}
