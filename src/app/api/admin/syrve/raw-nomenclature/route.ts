import { NextRequest, NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBooleanParam(request: NextRequest, name: string): boolean {
  const value = request.nextUrl.searchParams.get(name);
  return value === "1" || value === "true" || value === "yes";
}

export async function GET(request: NextRequest) {
  try {
    const nomenclature = await fetchSyrveNomenclature();
    const asDownload = getBooleanParam(request, "download");

    const json = JSON.stringify(nomenclature, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(asDownload
          ? {
              "Content-Disposition": `attachment; filename="syrve-kimramen-nomenclature-${new Date()
                .toISOString()
                .slice(0, 10)}.json"`,
            }
          : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown Syrve raw nomenclature error",
      },
      { status: 500 }
    );
  }
}
