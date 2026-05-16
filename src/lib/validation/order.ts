import { z } from "zod";
import { emailSchema, optionalText, phoneSchema, quantitySchema, requiredText } from "@/src/lib/validation/common";

export const orderStatusSchema = z.enum([
  "draft",
  "new",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
  "partially_refunded",
]);

export const paymentStateSchema = z.enum(["unpaid", "pending", "paid", "failed", "refunded", "partially_refunded"]);
export const deliveryStateSchema = z.enum(["not_required", "pending", "preparing", "ready", "in_delivery", "delivered", "failed", "cancelled"]);

export const checkoutItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  quantity: quantitySchema,
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(100),
  customerName: requiredText(160),
  customerPhone: phoneSchema,
  customerEmail: emailSchema,
  deliveryCity: optionalText(120),
  deliveryStreet: optionalText(255),
  deliveryHouse: optionalText(64),
  deliveryApartment: optionalText(64),
  deliveryComment: optionalText(1000),
  customerComment: optionalText(1000),
});

export const updateOrderStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: orderStatusSchema,
});

export type CheckoutValidatedInput = z.infer<typeof checkoutSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentState = z.infer<typeof paymentStateSchema>;
export type DeliveryState = z.infer<typeof deliveryStateSchema>;
