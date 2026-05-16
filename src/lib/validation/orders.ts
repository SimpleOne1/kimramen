import { z } from "zod";

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancelled_by_manager",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const nullableTrimmedString = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    },
    z.string().max(max).optional()
  );

export const checkoutItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const checkoutSchema = z.object({
  customerName: nullableTrimmedString(160),
  customerEmail: nullableTrimmedString(190).refine((value) => !value || z.string().email().safeParse(value).success, "Некорректный email"),
  customerPhone: nullableTrimmedString(64),
  deliveryCity: nullableTrimmedString(120),
  deliveryStreet: nullableTrimmedString(255),
  deliveryHouse: nullableTrimmedString(64),
  deliveryApartment: nullableTrimmedString(64),
  deliveryComment: nullableTrimmedString(1000),
  customerComment: nullableTrimmedString(1000),
  idempotencyKey: nullableTrimmedString(120),
  items: z.array(checkoutItemSchema).min(1, "Корзина пуста").max(120),
});

export const adminOrderPatchSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES).optional(),
  managerNote: nullableTrimmedString(2000),
}).refine((value) => value.status || value.managerNote !== undefined, {
  message: "Нет данных для обновления заказа",
});

export function zodMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Некорректные данные";
}
