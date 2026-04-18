import {
  SYRVE_ALLOWED_PRODUCT_TYPE,
  SYRVE_DEFAULT_PRICE,
  SYRVE_INVALID_PRICE_VALUES,
  SYRVE_SYNC_SOURCE,
} from "./syrve.constants";
import { fixMojibakeString, fixRequiredMojibakeString } from "./syrve.encoding";
import { SyrveProduct } from "./syrve.types";

export interface MappedProduct {
  externalId: string;
  externalCategoryId: string | null;
  sku: string | null;
  name: string;
  measureUnit: string | null;
  weight: number | null;
  price: number;
  isActive: boolean;
  syncSource: string;
}

function normalizePrice(rawPrice: unknown): number {
  if (rawPrice === null || rawPrice === undefined) {
    return SYRVE_DEFAULT_PRICE;
  }

  const rawString = String(rawPrice).trim();

  if (!rawString || SYRVE_INVALID_PRICE_VALUES.has(rawString)) {
    return SYRVE_DEFAULT_PRICE;
  }

  const parsed = Number(rawString);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return SYRVE_DEFAULT_PRICE;
  }

  return parsed;
}

export function mapSyrveProductsToProducts(
  products: SyrveProduct[],
  allowedGroupIds: Set<string>
): MappedProduct[] {
  return products
    .filter((product) => product.type === SYRVE_ALLOWED_PRODUCT_TYPE)
    .filter((product) => product.isDeleted !== true)
    .filter(
      (product) => !!product.parentGroup && allowedGroupIds.has(product.parentGroup)
    )
    .map((product) => ({
      externalId: product.id,
      externalCategoryId: product.parentGroup,
      sku: product.code?.trim() || null,
      name: fixRequiredMojibakeString(product.name),
      measureUnit: fixMojibakeString(product.measureUnit),
      weight:
        typeof product.weight === "number" && Number.isFinite(product.weight)
          ? product.weight
          : null,
      price: normalizePrice(product.sizePrices?.[0]?.price?.currentPrice),
      isActive: true,
      syncSource: SYRVE_SYNC_SOURCE,
    }));
}