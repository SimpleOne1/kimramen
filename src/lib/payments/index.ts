import { createMaibPayment } from "@/src/lib/payments/maib";
import { createPaynetPayment } from "@/src/lib/payments/paynet";
import type { PaymentCreateInput, PaymentCreateResult } from "@/src/lib/payments/types";

export async function createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
  if (input.provider === "maib") return createMaibPayment(input);
  if (input.provider === "paynet") return createPaynetPayment(input);
  return { success: false, message: "Неизвестный способ оплаты" };
}
