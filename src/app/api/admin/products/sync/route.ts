import { NextRequest, NextResponse } from "next/server";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { withRetry } from "@/src/lib/retry";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { syncSyrveProducts } from "@/src/services/syrve/syrve.product-sync";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("sync:run");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const nomenclature = await withRetry(() => fetchSyrveNomenclature(), { retries: 2, baseDelayMs: 300 });
    const { branchGroupIds, branchGroups } = getKimRamenBranchGroups(nomenclature.groups);
    const categories = mapSyrveGroupsToCategories(branchGroups);
    const categoryResult = await syncSyrveCategories(categories);
    const products = mapSyrveProductsToProducts(nomenclature.products, branchGroupIds, branchGroups);
    const productResult = await syncSyrveProducts(products);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({
      success: true,
      message: "Синхронизация завершена. Ручные правки сохранены.",
      categories: categoryResult.syncedCount,
      products: productResult,
    });
  } catch (error) {
    await logAppError("POST /api/admin/products/sync", error);
    console.error("POST /api/admin/products/sync error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Ошибка синхронизации" }, { status: 500 });
  }
}
