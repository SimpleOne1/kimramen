import { NextResponse } from "next/server";
import { fetchSyrveNomenclature } from "@/src/services/syrve/syrve.client";
import { mapSyrveGroupsToCategories } from "@/src/services/syrve/syrve.category-mapper";
import { syncSyrveCategories } from "@/src/services/syrve/syrve.category-sync";
import { mapSyrveProductsToProducts } from "@/src/services/syrve/syrve.product-mapper";
import { syncSyrveProducts } from "@/src/services/syrve/syrve.product-sync";
import { getKimRamenBranchGroups } from "@/src/services/syrve/syrve.tree";

export async function POST() {
  try {
    const nomenclature = await fetchSyrveNomenclature();
    const { branchGroupIds, branchGroups } = getKimRamenBranchGroups(nomenclature.groups);
    const categories = mapSyrveGroupsToCategories(branchGroups);
    const categoryResult = await syncSyrveCategories(categories);
    const products = mapSyrveProductsToProducts(nomenclature.products, branchGroupIds);
    const productResult = await syncSyrveProducts(products);

    return NextResponse.json({
      success: true,
      message: "Синхронизация завершена. Ручные правки сохранены.",
      categories: categoryResult.syncedCount,
      products: productResult,
    });
  } catch (error) {
    console.error("POST /api/admin/products/sync error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Ошибка синхронизации" }, { status: 500 });
  }
}
