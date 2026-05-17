import { ensurePromotionsSchema } from "@/src/lib/admin/promotions";

export const ACTIVE_PROMOTION_SQL = `
  SELECT
    MAX(pr.discount_percent)
  FROM promotion_products pp
  INNER JOIN promotions pr ON pr.id = pp.promotion_id
  WHERE pp.product_id = p.id
    AND pr.is_active = 1
    AND (pr.starts_at IS NULL OR pr.starts_at <= NOW())
    AND (pr.ends_at IS NULL OR pr.ends_at >= NOW())
`;

export function calculateDiscountedPrice(price: number, discountPercent: number | null | undefined) {
  const safePrice = Number(price || 0);
  const safeDiscount = Number(discountPercent || 0);

  if (!Number.isFinite(safePrice) || safePrice <= 0) return safePrice;
  if (!Number.isFinite(safeDiscount) || safeDiscount <= 0) return safePrice;

  return Math.max(0, Math.round(safePrice * (100 - safeDiscount)) / 100);
}

export async function ensurePromotionsReadyForPublicCatalog() {
  await ensurePromotionsSchema();
}
