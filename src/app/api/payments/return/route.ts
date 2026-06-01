import { NextRequest, NextResponse } from "next/server";
import { refreshMaibPaymentStatus } from "@/src/lib/payments/maib";
import { refreshPaynetPaymentStatus } from "@/src/lib/payments/paynet";
import { writeErrorLog } from "@/src/lib/server/error-log";

function getPublicBaseUrl(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https";

  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "payment";
  const order = searchParams.get("order") || searchParams.get("orderId") || searchParams.get("ExternalID") || searchParams.get("ExternalId") || "";
  const checkoutId = searchParams.get("checkoutId") || searchParams.get("checkout_id") || "";
  const checkoutStatus = searchParams.get("checkoutStatus") || searchParams.get("status") || searchParams.get("result") || "";
  let failed = searchParams.get("failed") === "1" || /failed|cancelled|canceled|error/i.test(checkoutStatus);

  if (provider === "maib" && checkoutId) {
    try {
      const status = await refreshMaibPaymentStatus(checkoutId, order);
      if (status.success && status.providerStatus && status.providerStatus !== "paid" && status.providerStatus !== "pending") failed = true;
    } catch (error) {
      await writeErrorLog("GET /api/payments/return maib refresh", error, { order, checkoutId });
    }
  }

  if (provider === "paynet" && order && !failed) {
    try {
      const status = await refreshPaynetPaymentStatus(order);
      if (status.success && status.providerStatus && status.providerStatus !== "paid" && status.providerStatus !== "pending") failed = true;
    } catch (error) {
      await writeErrorLog("GET /api/payments/return paynet refresh", error, { order });
    }
  }

  const url = new URL(`/orders?payment=${failed ? "failed" : "return"}&provider=${encodeURIComponent(provider)}${order ? `&order=${encodeURIComponent(order)}` : ""}`, getPublicBaseUrl(request));
  return NextResponse.redirect(url);
}
