import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

export type EmailTemplate =
  | "order_confirmation"
  | "password_reset"
  | "admin_notification"
  | "failed_payment"
  | "delivery_update";

export type QueueEmailInput = {
  template: EmailTemplate;
  to: string;
  subject: string;
  payload?: Record<string, unknown>;
  sendAfter?: Date | null;
};

export async function queueEmail(input: QueueEmailInput) {
  await ensureAuthSchema();
  const conn = await pool.getConnection();

  try {
    const result = await conn.query(
      `
      INSERT INTO email_outbox (template, recipient, subject, payload_json, status, send_after)
      VALUES (?, ?, ?, ?, 'pending', ?)
      `,
      [
        input.template,
        input.to.trim(),
        input.subject.trim(),
        JSON.stringify(input.payload || {}),
        input.sendAfter || null,
      ]
    );

    return Number(result.insertId);
  } finally {
    conn.release();
  }
}

export async function queueOrderConfirmationEmail(order: { orderNumber: string; customerEmail?: string | null; customerName: string; totalAmount: number; currency: string }) {
  if (!order.customerEmail) return null;

  return queueEmail({
    template: "order_confirmation",
    to: order.customerEmail,
    subject: `Kimramen: заказ ${order.orderNumber} принят`,
    payload: order,
  });
}
