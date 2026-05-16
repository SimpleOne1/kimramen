import { NextResponse } from "next/server";
import { logoutAdmin } from "@/src/lib/auth/admin";

export async function POST() {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/auth/logout error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось выйти из админ-панели" },
      { status: 500 }
    );
  }
}
