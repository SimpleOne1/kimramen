import { NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";

export async function POST() {
  try {
    const nomenclature = await fetchSyrveNomenclature();

    const { rootGroup, branchGroups } = getKimRamenBranchGroups(nomenclature.groups);
    const mappedCategories = mapSyrveGroupsToCategories(branchGroups);

    const result = await syncSyrveCategories(mappedCategories);

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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown category sync error",
      },
      { status: 500 }
    );
  }
}