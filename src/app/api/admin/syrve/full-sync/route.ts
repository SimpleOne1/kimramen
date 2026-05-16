import { NextRequest, NextResponse } from "next/server";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { withRetry } from "@/src/lib/retry";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";
import { syncSyrveProducts } from "@/src/services/syrve/syrve.product-sync";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("sync:run");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const nomenclature = await withRetry(() => fetchSyrveNomenclature(), { retries: 2, baseDelayMs: 300 });

    const { rootGroup, branchGroupIds, branchGroups } = getKimRamenBranchGroups(
      nomenclature.groups
    );

    const mappedCategories = mapSyrveGroupsToCategories(branchGroups);
    const mappedProducts = mapSyrveProductsToProducts(
      nomenclature.products,
      branchGroupIds,
      branchGroups
    );

    const categoryResult = await syncSyrveCategories(mappedCategories);
    const productResult = await syncSyrveProducts(mappedProducts);

    invalidateCatalogCache();
    invalidateAdminDashboardCache();

    return NextResponse.json({
      success: true,
      rootGroup: {
        id: rootGroup.id,
        name: rootGroup.name,
      },
      stats: {
        categoriesFound: mappedCategories.length,
        categoriesSynced: categoryResult.syncedCount,
        productsFound: mappedProducts.length,
        productsSynced: productResult.syncedCount,
        productsLinked: productResult.linkedCount,
        descriptionsSynced: productResult.descriptionsSynced,
        nutritionSynced: productResult.nutritionSynced,
        skippedWithoutCategory: productResult.skippedWithoutCategory,
      },
    });
  } catch (error) {
    await logAppError("POST /api/admin/syrve/full-sync/route.ts", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown full sync error",
      },
      { status: 500 }
    );
  }
}
