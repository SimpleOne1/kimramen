import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer } from "@/src/lib/auth/customer";
import {
  addCustomerFavorite,
  getCustomerFavoriteProductIds,
  getCustomerFavorites,
  removeCustomerFavorite,
} from "@/src/lib/customer/favorites";

function parseProductId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: false, message: "Нужно войти в аккаунт" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "ids") {
      const ids = await getCustomerFavoriteProductIds(customer.id);
      return NextResponse.json({ success: true, ids, count: ids.length });
    }

    const favorites = await getCustomerFavorites(customer.id, "ru");
    return NextResponse.json({ success: true, favorites, count: favorites.length });
  } catch (error) {
    console.error("GET /api/customer/favorites error:", error);
    return NextResponse.json({ success: false, message: "Не удалось загрузить избранное" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: false, message: "Нужно войти в аккаунт" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const productId = parseProductId(body.productId);

    if (!productId) {
      return NextResponse.json({ success: false, message: "Некорректный товар" }, { status: 400 });
    }

    const result = await addCustomerFavorite(customer.id, productId);
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    const ids = await getCustomerFavoriteProductIds(customer.id);
    return NextResponse.json({ success: true, ids, count: ids.length });
  } catch (error) {
    console.error("POST /api/customer/favorites error:", error);
    return NextResponse.json({ success: false, message: "Не удалось добавить в избранное" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: false, message: "Нужно войти в аккаунт" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const productId = parseProductId(searchParams.get("productId") || body.productId);

    if (!productId) {
      return NextResponse.json({ success: false, message: "Некорректный товар" }, { status: 400 });
    }

    await removeCustomerFavorite(customer.id, productId);
    const ids = await getCustomerFavoriteProductIds(customer.id);
    return NextResponse.json({ success: true, ids, count: ids.length });
  } catch (error) {
    console.error("DELETE /api/customer/favorites error:", error);
    return NextResponse.json({ success: false, message: "Не удалось удалить из избранного" }, { status: 500 });
  }
}
