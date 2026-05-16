import { NextResponse } from "next/server";
import { registerCustomer } from "@/src/lib/auth/customer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await registerCustomer({
      email: String(body.email || ""),
      password: String(body.password || ""),
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/customer/auth/register error:", error);
    return NextResponse.json({ success: false, message: "Ошибка регистрации" }, { status: 500 });
  }
}
