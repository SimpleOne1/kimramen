import { NextResponse } from "next/server";
import { getCurrentCustomer, updateCustomerProfile } from "@/src/lib/auth/customer";

export async function PATCH(request: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: false, message: "Нужно войти в аккаунт" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const updatedCustomer = await updateCustomerProfile(customer.id, body);

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error("PATCH /api/customer/profile error:", error);
    return NextResponse.json({ success: false, message: "Не удалось сохранить профиль" }, { status: 500 });
  }
}
