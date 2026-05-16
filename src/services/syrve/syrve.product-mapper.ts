import {
  SYRVE_ALLOWED_PRODUCT_TYPE,
  SYRVE_DEFAULT_PRICE,
  SYRVE_INVALID_PRICE_VALUES,
  SYRVE_SYNC_SOURCE,
} from "./syrve.constants";
import { parseProductName } from "@/src/lib/admin/product-normalizer";
import { fixMojibakeString, fixRequiredMojibakeString } from "./syrve.encoding";
import { SyrveProduct, SyrveGroup } from "./syrve.types";
import {
  classifySyrveGroups,
  findNearestBrandName,
  findNearestCategoryGroupId,
} from "./syrve.group-classifier";

export interface MappedProduct {
  externalId: string;
  externalCategoryId: string | null;
  sku: string | null;
  rawName: string;
  name: string;
  brand: string | null;
  countryOfOrigin: string | null;
  countryOfOriginEn: string | null;
  countryOfOriginRo: string | null;
  weightValue: number | null;
  weightUnit: string | null;
  weightLabel: string | null;
  measureUnit: string | null;
  weight: number | null;
  price: number;
  description: string | null;
  shortDescription: string | null;
  seoDescription: string | null;
  seoText: string | null;
  seoTitle: string | null;
  seoKeywords: string | null;
  fatAmount: number | null;
  proteinsAmount: number | null;
  carbohydratesAmount: number | null;
  energyAmount: number | null;
  fatFullAmount: number | null;
  proteinsFullAmount: number | null;
  carbohydratesFullAmount: number | null;
  energyFullAmount: number | null;
  imageLinks: string[];
  isActive: boolean;
  syncSource: string;
}

function normalizePrice(rawPrice: unknown): number {
  if (rawPrice === null || rawPrice === undefined) return SYRVE_DEFAULT_PRICE;
  const rawString = String(rawPrice).trim();
  if (!rawString || SYRVE_INVALID_PRICE_VALUES.has(rawString)) return SYRVE_DEFAULT_PRICE;
  const parsed = Number(rawString);
  if (!Number.isFinite(parsed) || parsed <= 0) return SYRVE_DEFAULT_PRICE;
  return parsed;
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeImageLinks(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function mapSyrveProductsToProducts(
  products: SyrveProduct[],
  allowedGroupIds: Set<string>,
  branchGroups: SyrveGroup[] = []
): MappedProduct[] {
  const classification = classifySyrveGroups(branchGroups);

  return products
    .filter((product) => product.type === SYRVE_ALLOWED_PRODUCT_TYPE)
    .filter((product) => product.isDeleted !== true)
    .filter((product) => !!product.parentGroup && allowedGroupIds.has(product.parentGroup))
    .map((product) => {
      const rawName = fixRequiredMojibakeString(product.name);
      const parsed = parseProductName(rawName);
      const categoryGroupId = branchGroups.length
        ? findNearestCategoryGroupId(product.parentGroup, classification)
        : product.parentGroup;
      const brandFromGroup = branchGroups.length
        ? findNearestBrandName(product.parentGroup, classification)
        : null;

      return {
        externalId: product.id,
        externalCategoryId: categoryGroupId,
        sku: product.code?.trim() || null,
        rawName,
        name: parsed.cleanName,
        brand: brandFromGroup || parsed.brand,
        countryOfOrigin: parsed.countryRu,
        countryOfOriginEn: parsed.countryEn,
        countryOfOriginRo: parsed.countryRo,
        weightValue: parsed.weightValue,
        weightUnit: parsed.weightUnit,
        weightLabel: parsed.weightLabel,
        measureUnit: fixMojibakeString(product.measureUnit),
        weight:
          typeof product.weight === "number" && Number.isFinite(product.weight)
            ? product.weight
            : null,
        price: normalizePrice(product.sizePrices?.[0]?.price?.currentPrice),
        description: fixMojibakeString(product.description),
        shortDescription: fixMojibakeString(product.additionalInfo) || fixMojibakeString(product.seoDescription),
        seoDescription: fixMojibakeString(product.seoDescription),
        seoText: fixMojibakeString(product.seoText),
        seoTitle: fixMojibakeString(product.seoTitle),
        seoKeywords: fixMojibakeString(product.seoKeywords),
        fatAmount: normalizeNumber(product.fatAmount),
        proteinsAmount: normalizeNumber(product.proteinsAmount),
        carbohydratesAmount: normalizeNumber(product.carbohydratesAmount),
        energyAmount: normalizeNumber(product.energyAmount),
        fatFullAmount: normalizeNumber(product.fatFullAmount),
        proteinsFullAmount: normalizeNumber(product.proteinsFullAmount),
        carbohydratesFullAmount: normalizeNumber(product.carbohydratesFullAmount),
        energyFullAmount: normalizeNumber(product.energyFullAmount),
        imageLinks: normalizeImageLinks(product.imageLinks),
        isActive: true,
        syncSource: SYRVE_SYNC_SOURCE,
      };
    });
}
