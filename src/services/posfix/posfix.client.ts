import {
  POSFIX_API_PREFIX,
  POSFIX_BASE_URL,
  POSFIX_PRODUCTS_PAGE_SIZE,
  getPosfixApiKey,
} from "./posfix.constants";
import {
  PosfixAttributesResponse,
  PosfixCatalog,
  PosfixCategoriesResponse,
  PosfixProductsResponse,
} from "./posfix.types";

export class PosfixApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PosfixApiError";
    this.status = status;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(pathname: string, searchParams?: Record<string, string | number | boolean | null | undefined>) {
  const url = new URL(`${POSFIX_API_PREFIX}${pathname}`, `${POSFIX_BASE_URL}/`);

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function requestJson<T>(
  pathname: string,
  searchParams?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
  const url = buildUrl(pathname, searchParams);
  const apiKey = getPosfixApiKey();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Posfix-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    const responseText = await response.text();

    if (response.ok) {
      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw new PosfixApiError(response.status, `POSfix returned invalid JSON for ${pathname}`);
      }
    }

    const message = responseText.slice(0, 500) || response.statusText;
    const transient = response.status === 429 || response.status >= 500;
    if (!transient || attempt === 2) {
      throw new PosfixApiError(response.status, `POSfix API ${response.status}: ${message}`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
  }

  throw new PosfixApiError(500, "POSfix API request failed after retries");
}

export function buildPosfixProductImageUrl(code: string): string {
  return `/api/catalog/products/${encodeURIComponent(code)}/image`;
}

export async function fetchPosfixProducts(): Promise<PosfixProductsResponse> {
  const products: PosfixProductsResponse["items"] = [];
  let cursor: string | undefined;
  let page = 0;

  while (true) {
    page += 1;
    if (page > 100) {
      throw new Error("POSfix product pagination exceeded the safety limit");
    }

    const response = await requestJson<PosfixProductsResponse>("/products", {
      cursor,
      limit: POSFIX_PRODUCTS_PAGE_SIZE,
      includeInactive: true,
      includeUnlisted: true,
    });

    if (!Array.isArray(response.items)) {
      throw new Error("Invalid POSfix products response: items is missing");
    }

    products.push(...response.items);

    if (!response.nextCursor || response.nextCursor === cursor) {
      return { items: products, nextCursor: null };
    }

    cursor = response.nextCursor;
  }
}

export async function fetchPosfixCategories(): Promise<PosfixCategoriesResponse> {
  const response = await requestJson<PosfixCategoriesResponse>("/categories");
  return { items: Array.isArray(response.items) ? response.items : [] };
}

export async function fetchPosfixAttributes(): Promise<PosfixAttributesResponse> {
  const response = await requestJson<PosfixAttributesResponse>("/attributes");
  return { items: Array.isArray(response.items) ? response.items : [] };
}

export async function fetchPosfixCatalog(): Promise<PosfixCatalog> {
  const [products, categories, attributes] = await Promise.all([
    fetchPosfixProducts(),
    fetchPosfixCategories(),
    fetchPosfixAttributes(),
  ]);

  if (!products.items.length) {
    throw new Error("POSfix returned an empty product catalog; synchronization was stopped");
  }

  return {
    products: products.items,
    categories: categories.items,
    attributes: attributes.items,
  };
}
