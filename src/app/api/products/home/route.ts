// src/app/api/products/home/route.ts
import { NextResponse } from "next/server";
import { fetchAllProducts } from "../../../../controllers/productController";
import { CACHE_TAGS, getCached } from "@/src/lib/cache";
import { logAppError } from "@/src/lib/logger";

export async function GET() {
  try {
    const products = await getCached("products:home:ru", () => fetchAllProducts("ru"), {
      ttlMs: 2 * 60_000,
      tags: [CACHE_TAGS.catalog, CACHE_TAGS.products, CACHE_TAGS.homeProducts],
    });

    return NextResponse.json(products);
  } catch (error) {
    await logAppError("GET /api/products/home", error);
    console.error("GET /api/products/home error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
