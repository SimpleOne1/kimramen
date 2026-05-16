import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/lib/auth/admin";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, admin: null }, { status: 401 });
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("GET /api/admin/auth/me error:", error);
    return NextResponse.json(
      { success: false, message: "Не удалось проверить администратора" },
      { status: 500 }
    );
  }
}
