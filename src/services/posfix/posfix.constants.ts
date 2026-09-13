export const POSFIX_BASE_URL = (process.env.POSFIX_API_BASE_URL || "https://api.posfix.md").replace(/\/+$/, "");
export const POSFIX_API_PREFIX = "/api/public/v1";
export const POSFIX_SYNC_SOURCE = "posfix";
export const POSFIX_PRODUCTS_PAGE_SIZE = 100;
export const POSFIX_CATEGORY_ATTRIBUTE_CODE = "category";
export const POSFIX_BRAND_ATTRIBUTE_CODE = "brand";
export const POSFIX_COUNTRY_ATTRIBUTE_CODE = "attr";
export const POSFIX_SOURCE_IMAGE_FIELD = "main_image";

export function getPosfixApiKey(): string {
  const apiKey = process.env.POSFIX_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("POSFIX_API_KEY is not set in environment variables");
  }

  return apiKey;
}
