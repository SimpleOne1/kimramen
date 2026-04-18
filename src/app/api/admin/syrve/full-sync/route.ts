import { NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";
import { syncSyrveProducts } from "@/src/services/syrve/syrve.product-sync";

export async function POST() {
  try {
    const nomenclature = await fetchSyrveNomenclature();

    const { rootGroup, branchGroupIds, branchGroups } = getKimRamenBranchGroups(
      nomenclature.groups
    );

    const mappedCategories = mapSyrveGroupsToCategories(branchGroups);
    const mappedProducts = mapSyrveProductsToProducts(
      nomenclature.products,
      branchGroupIds
    );

    const categoryResult = await syncSyrveCategories(mappedCategories);
    const productResult = await syncSyrveProducts(mappedProducts);

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
        skippedWithoutCategory: productResult.skippedWithoutCategory,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown full sync error",
      },
      { status: 500 }
    );
  }
}