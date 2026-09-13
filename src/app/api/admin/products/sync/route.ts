import { NextRequest, NextResponse } from "next/server";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { withRetry } from "@/src/lib/retry";
import { fetchPosfixCatalog, PosfixApiError } from "@/src/services/posfix/posfix.client";
import { mapPosfixCategoriesToCategories, mapPosfixProductsToProducts } from "@/src/services/posfix/posfix.mapper";
import { syncPosfixCategories } from "@/src/services/posfix/posfix.category-sync";
import { syncPosfixProducts } from "@/src/services/posfix/posfix.product-sync";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("posfix.sync");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const catalog = await withRetry(() => fetchPosfixCatalog(), {
      retries: 2,
      baseDelayMs: 300,
      shouldRetry: (error) => error instanceof PosfixApiError && (error.status === 429 || error.status >= 500),
    });
    const categories = mapPosfixCategoriesToCategories(catalog.categories, catalog.products);
    const categoryResult = await syncPosfixCategories(categories);
    const products = mapPosfixProductsToProducts(catalog.products);
    const productResult = await syncPosfixProducts(products);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({
      success: true,
      message: "Синхронизация POSfix завершена. Ручные правки сохранены.",
      categories: categoryResult.syncedCount,
      products: productResult,
    });
  } catch (error) {
    await logAppError("POST /api/admin/products/sync", error);
    console.error("POST /api/admin/products/sync error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Ошибка синхронизации" }, { status: 500 });
  }
}
