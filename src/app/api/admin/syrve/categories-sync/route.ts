import { NextRequest, NextResponse } from "next/server";
import { invalidateAdminDashboardCache, invalidateCatalogCache } from "@/src/lib/cache-invalidation";
import { logAppError } from "@/src/lib/logger";
import { withRetry } from "@/src/lib/retry";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";
import { requireAdmin } from "@/src/lib/auth/admin-guard";
import { verifyAdminCsrf } from "@/src/lib/auth/csrf-server";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("sync:run");
    if (!guard.ok) return guard.response;

    const csrfResponse = await verifyAdminCsrf(request);
    if (csrfResponse) return csrfResponse;


    const nomenclature = await withRetry(() => fetchSyrveNomenclature(), { retries: 2, baseDelayMs: 300 });

    const { rootGroup, branchGroups } = getKimRamenBranchGroups(nomenclature.groups);
    const mappedCategories = mapSyrveGroupsToCategories(branchGroups);

    const result = await syncSyrveCategories(mappedCategories);

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
        categoriesSynced: result.syncedCount,
      },
    });
  } catch (error) {
    await logAppError("POST /api/admin/syrve/categories-sync/route.ts", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown category sync error",
      },
      { status: 500 }
    );
  }
}
