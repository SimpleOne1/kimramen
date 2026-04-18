import { NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { syncSyrveProducts } from "@/src/services/syrve/syrve.product-sync";

export async function POST() {
  try {
    const nomenclature = await fetchSyrveNomenclature();

    const { rootGroup, branchGroupIds } = getKimRamenBranchGroups(nomenclature.groups);
    const mappedProducts = mapSyrveProductsToProducts(
      nomenclature.products,
      branchGroupIds
    );

    const result = await syncSyrveProducts(mappedProducts);

    return NextResponse.json({
      success: true,
      rootGroup: {
        id: rootGroup.id,
        name: rootGroup.name,
      },
      stats: {
        productsFound: mappedProducts.length,
        productsSynced: result.syncedCount,
        productsLinked: result.linkedCount,
        skippedWithoutCategory: result.skippedWithoutCategory,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown product sync error",
      },
      { status: 500 }
    );
  }
}