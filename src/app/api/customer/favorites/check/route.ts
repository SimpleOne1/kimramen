import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer } from "@/src/lib/auth/customer";
import { isProductFavorite } from "@/src/lib/customer/favorites";

export async function GET(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: true, isFavorite: false, authenticated: false });
    }

    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get("productId"));

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ success: false, message: "Некорректный товар" }, { status: 400 });
    }

    const favorite = await isProductFavorite(customer.id, productId);
    return NextResponse.json({ success: true, isFavorite: favorite, authenticated: true });
  } catch (error) {
    console.error("GET /api/customer/favorites/check error:", error);
    return NextResponse.json({ success: false, message: "Не удалось проверить избранное" }, { status: 500 });
  }
}
