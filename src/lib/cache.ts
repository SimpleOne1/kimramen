type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  tags: string[];
};

type CacheOptions = {
  ttlMs?: number;
  tags?: string[];
};

const store = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60_000;

export const CACHE_TAGS = {
  catalog: "catalog",
  categories: "categories",
  products: "products",
  homeProducts: "home-products",
  adminDashboard: "admin-dashboard",
} as const;

function isFresh(entry: CacheEntry<unknown>) {
  return entry.expiresAt > Date.now();
}

export async function getCached<T>(key: string, loader: () => Promise<T>, options: CacheOptions = {}) {
  const current = store.get(key) as CacheEntry<T> | undefined;

  if (current && isFresh(current)) {
    return current.value;
  }

  const value = await loader();
  store.set(key, {
    value,
    expiresAt: Date.now() + (options.ttlMs ?? DEFAULT_TTL_MS),
    tags: options.tags ?? [],
  });

  return value;
}

export function invalidateCacheByTag(tag: string) {
  for (const [key, entry] of store.entries()) {
    if (entry.tags.includes(tag)) {
      store.delete(key);
    }
  }
}

export function invalidateCacheByTags(tags: string[]) {
  for (const tag of tags) {
    invalidateCacheByTag(tag);
  }
}

export function invalidateCacheKey(key: string) {
  store.delete(key);
}

export function clearRuntimeCache() {
  store.clear();
}
