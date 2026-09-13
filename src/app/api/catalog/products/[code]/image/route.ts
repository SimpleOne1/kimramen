import { NextResponse } from "next/server";
import { POSFIX_API_PREFIX, POSFIX_BASE_URL, getPosfixApiKey } from "@/src/services/posfix/posfix.constants";

type Params = { params: Promise<{ code: string }> };

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const productCode = decodeURIComponent(code).trim();

    if (!productCode || productCode.length > 100 || productCode.includes("/")) {
      return new NextResponse("Invalid product code", { status: 400 });
    }

    const response = await fetch(
      `${POSFIX_BASE_URL}${POSFIX_API_PREFIX}/products/${encodeURIComponent(productCode)}/image`,
      {
        headers: { "X-Posfix-Api-Key": getPosfixApiKey() },
        cache: "no-store",
      },
    );

    if (!response.ok || !response.body) {
      return new NextResponse("Image unavailable", { status: response.status || 404 });
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType?.startsWith("image/")) headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(response.body, { headers });
  } catch (error) {
    console.error("GET /api/catalog/products/[code]/image error:", error);
    return new NextResponse("Image unavailable", { status: 502 });
  }
}
