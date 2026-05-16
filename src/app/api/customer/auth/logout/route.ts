import { NextResponse } from "next/server";
import { logoutCustomer } from "@/src/lib/auth/customer";

export async function POST() {
  await logoutCustomer();
  return NextResponse.json({ success: true });
}
