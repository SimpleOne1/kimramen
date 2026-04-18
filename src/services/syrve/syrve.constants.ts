export const SYRVE_BASE_URL = "https://api-eu.syrve.live";
export const SYRVE_NOMENCLATURE_ENDPOINT = "/api/1/nomenclature";

export const SYRVE_TARGET_ORGANIZATION_ID =
  "65d544e4-d155-4d7a-bdeb-c66fecc5aae5";

export const SYRVE_TARGET_ROOT_GROUP_NAME = "KimRamen";

export const SYRVE_DEFAULT_PRICE = 9.99;

export const SYRVE_INVALID_PRICE_VALUES = new Set([
  "0",
  "0.0",
  "0.00",
  "0.000000000",
  "0E-9",
  "0.010000000",
  "0.01",
]);

export const SYRVE_ALLOWED_PRODUCT_TYPE = "Good";
export const SYRVE_SYNC_SOURCE = "syrve";