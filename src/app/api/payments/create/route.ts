import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer } from "@/src/lib/auth/customer";
import { createOrder } from "@/src/lib/orders";
import { createPayment } from "@/src/lib/payments";
import type { PaymentProvider } from "@/src/lib/payments/types";
import { writeErrorLog } from "@/src/lib/server/error-log";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

function getPublicBaseUrl(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https";

  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    const body = await request.json().catch(() => ({}));
    const provider = String(body?.paymentMethod || body?.provider || "") as PaymentProvider;

    if (provider !== "maib" && provider !== "paynet") {
      return NextResponse.json({ success: false, message: "Выберите способ оплаты" }, { status: 400 });
    }

    const orderResult = await createOrder(body, customer, { skipEmails: true, initialPaymentMethod: provider });
    if (!orderResult.success) {
      return NextResponse.json(orderResult, { status: 400 });
    }

    const paymentResult = await createPayment({
      orderId: orderResult.orderId,
      provider,
      language: body?.language === "ro" || body?.language === "en" ? body.language : "ru",
      customerIp: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      publicBaseUrl: getPublicBaseUrl(request),
    });

    if (!paymentResult.success) {
      return NextResponse.json({ ...paymentResult, orderNumber: orderResult.orderNumber }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
      provider,
      redirectUrl: paymentResult.redirectUrl,
      checkoutId: paymentResult.checkoutId,
    });
  } catch (error) {
    await writeErrorLog("POST /api/payments/create", error);
    console.error("POST /api/payments/create error:", error);
    return NextResponse.json({ success: false, message: "Не удалось начать оплату" }, { status: 500 });
  }
}
