import { slugify } from "@/src/lib/slug";

export type LocaleCode = "ru" | "en" | "ro";

export const PRODUCT_LOCALES: LocaleCode[] = ["ru", "en", "ro"];

const COUNTRY_ALIASES: Record<string, { ru: string; en: string; ro: string }> = {
  тайланд: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  таиланд: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  thailand: { ru: "Таиланд", en: "Thailand", ro: "Thailanda" },
  корея: { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  "южная корея": { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  "south korea": { ru: "Южная Корея", en: "South Korea", ro: "Coreea de Sud" },
  япония: { ru: "Япония", en: "Japan", ro: "Japonia" },
  japan: { ru: "Япония", en: "Japan", ro: "Japonia" },
  китай: { ru: "Китай", en: "China", ro: "China" },
  china: { ru: "Китай", en: "China", ro: "China" },
};

const BRAND_ALIASES = [
  "Bioasia",
  "King Soba",
  "myeongga",
  "Myeongga",
  "Samyang",
  "Nongshim",
  "Sempio",
  "Ottogi",
  "CJ",
  "Bibigo",
];

const WORD_WEIGHT_RE = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(кг|kg|г|гр|g|ml|мл|л|l|шт|pcs)(?:\s|$)/iu;

export type ParsedProductName = {
  cleanName: string;
  brand: string | null;
  countryRu: string | null;
  countryEn: string | null;
  countryRo: string | null;
  weightValue: number | null;
  weightUnit: string | null;
  weightLabel: string | null;
  slugBase: string;
};

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function detectBrand(value: string): { brand: string | null; rest: string } {
  const lower = value.toLowerCase();
  for (const brand of BRAND_ALIASES) {
    const brandLower = brand.toLowerCase();
    if (lower.startsWith(`${brandLower} `)) {
      return { brand, rest: normalizeSpaces(value.slice(brand.length)) };
    }
  }
  return { brand: null, rest: value };
}

function detectCountry(value: string): {
  countryRu: string | null;
  countryEn: string | null;
  countryRo: string | null;
  rest: string;
} {
  let rest = value;
  let found: { ru: string; en: string; ro: string } | null = null;

  const entries = Object.entries(COUNTRY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, country] of entries) {
    const re = new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=\\s|$)`, "iu");
    if (re.test(rest)) {
      found = country;
      rest = normalizeSpaces(rest.replace(re, " "));
      break;
    }
  }

  return {
    countryRu: found?.ru ?? null,
    countryEn: found?.en ?? null,
    countryRo: found?.ro ?? null,
    rest,
  };
}

function detectWeight(value: string): {
  weightValue: number | null;
  weightUnit: string | null;
  weightLabel: string | null;
  rest: string;
} {
  const match = value.match(WORD_WEIGHT_RE);
  if (!match) {
    return { weightValue: null, weightUnit: null, weightLabel: null, rest: value };
  }

  const rawValue = match[1].replace(",", ".");
  const rawUnit = match[2].toLowerCase();
  const weightValue = Number(rawValue);
  const unitMap: Record<string, string> = {
    г: "g",
    гр: "g",
    g: "g",
    кг: "kg",
    kg: "kg",
    ml: "ml",
    мл: "ml",
    л: "l",
    l: "l",
    шт: "pcs",
    pcs: "pcs",
  };
  const weightUnit = unitMap[rawUnit] ?? rawUnit;
  const weightLabel = Number.isFinite(weightValue) ? `${weightValue}${weightUnit}` : null;

  return {
    weightValue: Number.isFinite(weightValue) ? weightValue : null,
    weightUnit,
    weightLabel,
    rest: normalizeSpaces(value.replace(match[0], " ")),
  };
}

export function parseProductName(rawName: string): ParsedProductName {
  let rest = normalizeSpaces(rawName);
  const brandResult = detectBrand(rest);
  rest = brandResult.rest;

  const countryResult = detectCountry(rest);
  rest = countryResult.rest;

  const weightResult = detectWeight(rest);
  rest = weightResult.rest;

  const cleanName = normalizeSpaces(rest) || normalizeSpaces(rawName);

  return {
    cleanName,
    brand: brandResult.brand,
    countryRu: countryResult.countryRu,
    countryEn: countryResult.countryEn,
    countryRo: countryResult.countryRo,
    weightValue: weightResult.weightValue,
    weightUnit: weightResult.weightUnit,
    weightLabel: weightResult.weightLabel,
    slugBase: slugify([cleanName, weightResult.weightLabel].filter(Boolean).join(" ")),
  };
}

export function buildProductDisplayName(name: string, weightLabel?: string | null) {
  return normalizeSpaces(`${name}${weightLabel ? ` ${weightLabel}` : ""}`);
}
