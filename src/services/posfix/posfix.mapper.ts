import { parseProductName } from "@/src/lib/admin/product-normalizer";
import { slugify } from "@/src/lib/slug";
import {
  POSFIX_BRAND_ATTRIBUTE_CODE,
  POSFIX_CATEGORY_ATTRIBUTE_CODE,
  POSFIX_COUNTRY_ATTRIBUTE_CODE,
  POSFIX_SOURCE_IMAGE_FIELD,
  POSFIX_SYNC_SOURCE,
} from "./posfix.constants";
import { buildPosfixProductImageUrl } from "./posfix.client";
import { PosfixCategory, PosfixProduct } from "./posfix.types";

export interface MappedPosfixCategory {
  externalId: string;
  externalParentId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  syncSource: string;
}

export interface MappedPosfixProduct {
  externalId: string;
  externalCategoryId: string | null;
  categoryName: string | null;
  sku: string | null;
  barcode: string | null;
  rawName: string;
  name: string;
  brand: string | null;
  countryOfOrigin: string | null;
  countryOfOriginEn: string | null;
  countryOfOriginRo: string | null;
  weightValue: number | null;
  weightUnit: string | null;
  weightLabel: string | null;
  netWeightGrams: number | null;
  measureUnit: string | null;
  price: number;
  currency: string;
  vatRate: number | null;
  stockQuantity: number;
  shelfLifeDays: number | null;
  description: string | null;
  shortDescription: string | null;
  seoDescription: string | null;
  seoTitle: string | null;
  fatAmount: number | null;
  proteinsAmount: number | null;
  carbohydratesAmount: number | null;
  energyAmount: number | null;
  fatFullAmount: number | null;
  proteinsFullAmount: number | null;
  carbohydratesFullAmount: number | null;
  energyFullAmount: number | null;
  imageUrl: string | null;
  sourceData: string;
  isActive: boolean;
  syncSource: string;
}

const COUNTRY_ALIASES: Record<string, { ru: string; en: string; ro: string }> = {
  china: { ru: "Китай", en: "China", ro: "China" },
  китай: { ru: "Китай", en: "China", ro: "China" },
  "coreea de sud": { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  "южная корея": { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  "south korea": { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  "federația rusă": { ru: "Россия", en: "Russian Federation", ro: "Federația Rusă" },
  россия: { ru: "Россия", en: "Russia", ro: "Federația Rusă" },
  japonia: { ru: "Япония", en: "Japan", ro: "Japonia" },
  япония: { ru: "Япония", en: "Japan", ro: "Japonia" },
  japan: { ru: "Япония", en: "Japan", ro: "Japonia" },
  malaezia: { ru: "Малайзия", en: "Malaysia", ro: "Malaezia" },
  малайзия: { ru: "Малайзия", en: "Malaysia", ro: "Malaezia" },
  "republica moldova": { ru: "Молдова", en: "Moldova", ro: "Republica Moldova" },
  молдова: { ru: "Молдова", en: "Moldova", ro: "Republica Moldova" },
  tailanda: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  таиланд: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  thailand: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  taiwan: { ru: "Тайвань", en: "Taiwan", ro: "Taiwan" },
  тайвань: { ru: "Тайвань", en: "Taiwan", ro: "Taiwan" },
  vietnam: { ru: "Вьетнам", en: "Vietnam", ro: "Vietnam" },
  вьетнам: { ru: "Вьетнам", en: "Vietnam", ro: "Vietnam" },
};

const CATEGORY_EN: Record<string, string> = {
  "Замороженные продукты": "Frozen products",
  "Кимбап": "Kimbap",
  "Косметика": "Cosmetics",
  "Лапша": "Noodles",
  "Мерч": "Merchandise",
  "Напитки": "Drinks",
  "Онигири": "Onigiri",
  "Паста": "Pasta",
  "Приправы / Специи": "Seasonings / Spices",
  "Рамен в пачке": "Packaged ramen",
  "Рамен в стаканчике": "Cup ramen",
  "Рис": "Rice",
  "Сладости": "Sweets",
  "Снеки": "Snacks",
  "Соусы": "Sauces",
  "Суши имбирь": "Sushi ginger",
  "Суши нори": "Sushi nori",
  "Токпокки": "Tteokbokki",
  "Топпинги": "Toppings",
  "Чай": "Tea",
  "Чили масло": "Chili oil",
};

const CATEGORY_RO: Record<string, string> = {
  "Замороженные продукты": "Produse congelate",
  "Кимбап": "Kimbap",
  "Косметика": "Cosmetice",
  "Лапша": "Tăiței",
  "Мерч": "Merch",
  "Напитки": "Băuturi",
  "Онигири": "Onigiri",
  "Паста": "Paste",
  "Приправы / Специи": "Condimente / mirodenii",
  "Рамен в пачке": "Ramen la pachet",
  "Рамен в стаканчике": "Ramen la pahar",
  "Рис": "Orez",
  "Сладости": "Dulciuri",
  "Снеки": "Gustări",
  "Соусы": "Sosuri",
  "Суши имбирь": "Ghimbir pentru sushi",
  "Суши нори": "Nori pentru sushi",
  "Токпокки": "Tteokbokki",
  "Топпинги": "Toppinguri",
  "Чай": "Ceai",
  "Чили масло": "Ulei de chili",
};

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).replace(/\s+/g, " ").trim();
  return result || null;
}

function attributeValue(product: PosfixProduct, code: string): string | null {
  const value = product.attributes?.find((attribute) => attribute.code === code)?.value;
  return cleanString(value);
}

function productCategoryName(product: PosfixProduct): string | null {
  if (typeof product.category === "string") return cleanString(product.category);
  return cleanString(product.category?.name) || attributeValue(product, POSFIX_CATEGORY_ATTRIBUTE_CODE);
}

export function posfixCategoryExternalId(name: string): string {
  return `posfix:category:${slugify(name)}`;
}

export function normalizePosfixCountry(value: string | null) {
  const country = cleanString(value);
  if (!country) return { ru: null, en: null, ro: null };
  return COUNTRY_ALIASES[country.toLowerCase()] || { ru: country, en: country, ro: country };
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePrice(value: unknown): number | null {
  const parsed = normalizeNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function normalizeStock(product: PosfixProduct): number {
  const total = (product.onHand || []).reduce((sum, item) => sum + (normalizeNumber(item.quantity) || 0), 0);
  return Math.max(0, Math.round(total));
}

function extractNutrition(description: string | null) {
  const read = (pattern: RegExp) => {
    const match = description?.match(pattern);
    return normalizeNumber(match?.[1]);
  };

  return {
    fatAmount: read(/Grăsimi\s*:\s*([\d.,]+)/iu),
    proteinsAmount: read(/Proteine\s*:\s*([\d.,]+)/iu),
    carbohydratesAmount: read(/Carbohidrați\s*:\s*([\d.,]+)/iu),
    energyAmount: read(/Valoare energetică\s*:\s*([\d.,]+)/iu),
    fatFullAmount: null,
    proteinsFullAmount: null,
    carbohydratesFullAmount: null,
    energyFullAmount: null,
  };
}

function sourceDescription(product: PosfixProduct): string | null {
  return cleanString(product.description) || cleanString(Object.values(product.descriptions || {})[0]);
}

function flattenCategories(categories: PosfixCategory[], parentId: string | null = null): MappedPosfixCategory[] {
  const result: MappedPosfixCategory[] = [];

  for (const category of categories || []) {
    const name = cleanString(category.name);
    if (name) {
      const externalId = posfixCategoryExternalId(name);
      result.push({
        externalId,
        externalParentId: parentId,
        name,
        description: cleanString(category.description),
        sortOrder: normalizeNumber(category.sortOrder) || 0,
        isActive: category.isActive !== false,
        syncSource: POSFIX_SYNC_SOURCE,
      });

      if (Array.isArray(category.children)) {
        result.push(...flattenCategories(category.children, externalId));
      }
    }
  }

  return result;
}

export function mapPosfixCategoriesToCategories(
  categories: PosfixCategory[],
  products: PosfixProduct[],
): MappedPosfixCategory[] {
  const mapped = flattenCategories(categories);
  const byName = new Map(mapped.map((category) => [category.name.toLowerCase(), category]));

  for (const product of products) {
    const name = productCategoryName(product);
    if (!name || byName.has(name.toLowerCase())) continue;

    byName.set(name.toLowerCase(), {
      externalId: posfixCategoryExternalId(name),
      externalParentId: null,
      name,
      description: null,
      sortOrder: 0,
      isActive: true,
      syncSource: POSFIX_SYNC_SOURCE,
    });
  }

  return Array.from(byName.values())
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((category, index) => ({ ...category, sortOrder: category.sortOrder || (index + 1) * 10 }));
}

export function getPosfixCategoryEnglishName(name: string): string {
  return CATEGORY_EN[name] || name;
}

export function getPosfixCategoryRomanianName(name: string): string {
  return CATEGORY_RO[name] || name;
}

export function mapPosfixProductsToProducts(products: PosfixProduct[]): MappedPosfixProduct[] {
  return products.flatMap((product) => {
    const externalId = cleanString(product.posfixId);
    const rawName = cleanString(product.name);
    const price = normalizePrice(product.price);
    if (!externalId || !rawName || price === null) return [];

    const parsed = parseProductName(rawName);
    const description = sourceDescription(product);
    const nutrition = extractNutrition(description);
    const country = normalizePosfixCountry(attributeValue(product, POSFIX_COUNTRY_ATTRIBUTE_CODE));
    const categoryName = productCategoryName(product);
    const sku = cleanString(product.sku) || cleanString(product.code);
    const weightValue = parsed.weightValue;
    const netWeightGrams = weightValue !== null && parsed.weightUnit === "g"
      ? Math.round(weightValue)
      : weightValue !== null && parsed.weightUnit === "kg"
        ? Math.round(weightValue * 1000)
        : null;
    const imageUrl = product.imageUrl ? buildPosfixProductImageUrl(cleanString(product.code) || externalId) : null;

    return [{
      externalId,
      externalCategoryId: categoryName ? posfixCategoryExternalId(categoryName) : null,
      categoryName,
      sku,
      barcode: cleanString(product.barcode),
      rawName,
      name: parsed.cleanName,
      brand: attributeValue(product, POSFIX_BRAND_ATTRIBUTE_CODE),
      countryOfOrigin: country.ru,
      countryOfOriginEn: country.en,
      countryOfOriginRo: country.ro,
      weightValue,
      weightUnit: parsed.weightUnit,
      weightLabel: parsed.weightLabel,
      netWeightGrams,
      measureUnit: cleanString(product.unit),
      price,
      currency: cleanString(product.currency) || "MDL",
      vatRate: normalizeNumber(product.vatRate),
      stockQuantity: normalizeStock(product),
      shelfLifeDays: normalizeNumber(product.shelfLifeDays),
      description,
      shortDescription: null,
      seoDescription: description ? description.slice(0, 255) : null,
      seoTitle: rawName.slice(0, 255),
      ...nutrition,
      imageUrl,
      sourceData: JSON.stringify({
        ...product,
        sourceImageField: POSFIX_SOURCE_IMAGE_FIELD,
      }),
      isActive: product.isActive !== false,
      syncSource: POSFIX_SYNC_SOURCE,
    }];
  });
}
