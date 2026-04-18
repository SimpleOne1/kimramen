export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"`]+/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}