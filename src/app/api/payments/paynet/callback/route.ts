import { NextRequest, NextResponse } from "next/server";
import { handlePaynetCallback } from "@/src/lib/payments/paynet";
import { writeErrorLog } from "@/src/lib/server/error-log";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: any = {};

    if (contentType.includes("application/json")) {
      payload = await request.json().catch(() => ({}));
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    }

    const result = await handlePaynetCallback(payload);
    return NextResponse.json({ success: result.success, message: result.message || null }, { status: result.status });
  } catch (error) {
    await writeErrorLog("POST /api/payments/paynet/callback", error);
    console.error("POST /api/payments/paynet/callback error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
