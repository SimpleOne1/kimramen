import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/src/lib/auth/customer";
import { createOrder, getCustomerOrders } from "@/src/lib/orders";
import { writeErrorLog } from "@/src/lib/server/error-log";

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: false, message: "Нужно войти в аккаунт" }, { status: 401 });
    }

    const orders = await getCustomerOrders(customer.id);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    await writeErrorLog("GET /api/customer/orders", error);
    console.error("GET /api/customer/orders error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить заказы" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getCurrentCustomer();
    const body = await request.json().catch(() => ({}));
    const result = await createOrder(body, customer);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    await writeErrorLog("POST /api/customer/orders", error);
    console.error("POST /api/customer/orders error:", error);
    return NextResponse.json({ success: false, message: "Не удалось создать заказ" }, { status: 500 });
  }
}
