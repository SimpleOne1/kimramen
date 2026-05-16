import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/src/lib/auth/customer";

export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json({ success: true, customer });
}
