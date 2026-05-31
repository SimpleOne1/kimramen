import { NextRequest, NextResponse } from "next/server";
import { handleMaibCallback } from "@/src/lib/payments/maib";
import { writeErrorLog } from "@/src/lib/server/error-log";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const result = await handleMaibCallback(rawBody, request.headers);
    return NextResponse.json({ success: result.success, message: result.message || null }, { status: result.status });
  } catch (error) {
    await writeErrorLog("POST /api/payments/maib/callback", error, { rawBody });
    console.error("POST /api/payments/maib/callback error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
