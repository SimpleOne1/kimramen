import { unstable_cache, revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  settings: "settings",
  orders: "orders",
  home: "home",
} as const;

type AsyncFn<T> = (...args: unknown[]) => Promise<T>;

export function cached<T>(
  keyParts: string[],
  fn: AsyncFn<T>,
  options: { tags?: string[]; revalidate?: number } = {}
) {
  return unstable_cache(fn, keyParts, {
    tags: options.tags,
    revalidate: options.revalidate ?? 60,
  });
}

export function invalidateCacheTag(tag: string) {
  revalidateTag(tag, "max");
}
