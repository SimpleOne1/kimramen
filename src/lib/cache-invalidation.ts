import { CACHE_TAGS, invalidateCacheByTags } from "@/src/lib/cache";

export function invalidateCatalogCache() {
  invalidateCacheByTags([CACHE_TAGS.catalog, CACHE_TAGS.categories, CACHE_TAGS.products, CACHE_TAGS.homeProducts]);
}

export function invalidateAdminDashboardCache() {
  invalidateCacheByTags([CACHE_TAGS.adminDashboard]);
}
