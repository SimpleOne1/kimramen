import { NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { requireAdmin } from "@/src/lib/admin/guard";

export async function GET() {
  try {
    const guard = await requireAdmin("syrve.sync");
    if (!guard.ok) return guard.response;
    const nomenclature = await fetchSyrveNomenclature();

    const { rootGroup, branchGroupIds, branchGroups } = getKimRamenBranchGroups(
      nomenclature.groups
    );

    const mappedCategories = mapSyrveGroupsToCategories(branchGroups);
    const mappedProducts = mapSyrveProductsToProducts(
      nomenclature.products,
      branchGroupIds
    );

    return NextResponse.json({
      success: true,
      rootGroup: {
        id: rootGroup.id,
        name: rootGroup.name,
      },
      stats: {
        totalGroupsFromSyrve: nomenclature.groups.length,
        totalProductsFromSyrve: nomenclature.products.length,
        kimRamenGroups: branchGroups.length,
        kimRamenProducts: mappedProducts.length,
      },
      preview: {
        categories: mappedCategories.slice(0, 20),
        products: mappedProducts.slice(0, 20),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Syrve preview error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
