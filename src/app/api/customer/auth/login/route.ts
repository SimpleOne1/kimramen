import { NextResponse } from "next/server";
import { loginCustomer } from "@/src/lib/auth/customer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customerId = await loginCustomer(String(body.email || ""), String(body.password || ""));

    if (!customerId) {
      return NextResponse.json({ success: false, message: "Неверный email или пароль" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/customer/auth/login error:", error);
    return NextResponse.json({ success: false, message: "Ошибка входа" }, { status: 500 });
  }
}
