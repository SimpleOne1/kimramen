import { NextRequest, NextResponse } from "next/server";
import { refreshPaynetPaymentStatus } from "@/src/lib/payments/paynet";
import { writeErrorLog } from "@/src/lib/server/error-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "payment";
  const order = searchParams.get("order") || searchParams.get("orderId") || searchParams.get("ExternalID") || searchParams.get("ExternalId") || "";
  const checkoutStatus = searchParams.get("checkoutStatus") || searchParams.get("status") || searchParams.get("result") || "";
  let failed = searchParams.get("failed") === "1" || /failed|cancelled|canceled|error/i.test(checkoutStatus);

  if (provider === "paynet" && order && !failed) {
    try {
      const status = await refreshPaynetPaymentStatus(order);
      if (status.success && status.providerStatus && status.providerStatus !== "paid" && status.providerStatus !== "pending") failed = true;
    } catch (error) {
      await writeErrorLog("GET /api/payments/return paynet refresh", error, { order });
    }
  }

  const url = new URL(`/orders?payment=${failed ? "failed" : "return"}&provider=${encodeURIComponent(provider)}${order ? `&order=${encodeURIComponent(order)}` : ""}`, request.url);
  return NextResponse.redirect(url);
}
