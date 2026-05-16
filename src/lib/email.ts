import pool from "@/src/lib/db";
import { getSiteSettings } from "@/src/lib/settings";
import { writeErrorLog } from "@/src/lib/server/error-log";

type EmailStatus = "queued" | "sent" | "failed" | "skipped";
type EmailType = "order_confirmation" | "admin_new_order" | "password_reset" | "delivery_update" | "generic";

type EmailPayload = {
  type: EmailType;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  relatedOrderId?: number | null;
  relatedOrderNumber?: string | null;
};

type OrderEmailItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type OrderEmailData = {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  items: OrderEmailItem[];
};

let emailSchemaReadyPromise: Promise<void> | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function ensureEmailSchemaInner() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email_type VARCHAR(80) NOT NULL,
        recipient VARCHAR(190) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
        provider VARCHAR(80) NULL,
        related_order_id BIGINT UNSIGNED NULL,
        related_order_number VARCHAR(40) NULL,
        error_message TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME NULL,
        PRIMARY KEY (id),
        KEY idx_email_logs_type_created (email_type, created_at),
        KEY idx_email_logs_order_id (related_order_id),
        KEY idx_email_logs_recipient (recipient)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
}

export async function ensureEmailSchema() {
  if (!emailSchemaReadyPromise) {
    emailSchemaReadyPromise = ensureEmailSchemaInner();
  }

  return emailSchemaReadyPromise;
}

async function logEmail(payload: EmailPayload, status: EmailStatus, errorMessage: string | null = null) {
  await ensureEmailSchema();
  const conn = await pool.getConnection();

  try {
    await conn.query(
      `
      INSERT INTO email_logs (
        email_type, recipient, subject, status, provider,
        related_order_id, related_order_number, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.type,
        payload.to,
        payload.subject,
        status,
        process.env.EMAIL_PROVIDER || "local-log",
        payload.relatedOrderId || null,
        payload.relatedOrderNumber || null,
        errorMessage,
        status === "sent" ? new Date() : null,
      ]
    );
  } catch (error) {
    await writeErrorLog("email.logEmail", error, { to: payload.to, type: payload.type });
  } finally {
    conn.release();
  }
}

export async function sendEmail(payload: EmailPayload) {
  if (!payload.to || !payload.to.includes("@")) {
    await logEmail(payload, "skipped", "Recipient is empty or invalid");
    return { success: false as const, skipped: true as const };
  }

  try {
    // Foundation mode: no external SMTP provider is wired yet.
    // When SMTP/Mailgun/SendGrid is added, this is the single integration point.
    console.info("[Kimramen EmailService]", {
      to: payload.to,
      subject: payload.subject,
      type: payload.type,
      relatedOrderNumber: payload.relatedOrderNumber,
    });

    await logEmail(payload, "sent");
    return { success: true as const };
  } catch (error) {
    await writeErrorLog("email.sendEmail", error, { to: payload.to, type: payload.type });
    await logEmail(payload, "failed", error instanceof Error ? error.message : String(error));
    return { success: false as const };
  }
}

function buildOrderItemsHtml(items: OrderEmailItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.productName)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.totalPrice.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");
}

export async function sendOrderEmails(order: OrderEmailData) {
  const settings = await getSiteSettings();
  const adminEmail = settings.site.email;
  const itemsHtml = buildOrderItemsHtml(order.items);
  const total = `${order.totalAmount.toFixed(2)} ${order.currency}`;

  const tasks: Promise<unknown>[] = [];

  if (order.customerEmail) {
    tasks.push(
      sendEmail({
        type: "order_confirmation",
        to: order.customerEmail,
        subject: `Kimramen: заказ ${order.orderNumber} принят`,
        relatedOrderId: order.orderId,
        relatedOrderNumber: order.orderNumber,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
            <h2>Спасибо за заказ, ${escapeHtml(order.customerName)}!</h2>
            <p>Мы получили заказ <strong>${escapeHtml(order.orderNumber)}</strong>. Менеджер свяжется с вами для подтверждения.</p>
            <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
            <p style="font-size:18px;"><strong>Итого: ${escapeHtml(total)}</strong></p>
          </div>
        `,
        text: `Спасибо за заказ ${order.orderNumber}. Итого: ${total}`,
      })
    );
  }

  if (adminEmail) {
    tasks.push(
      sendEmail({
        type: "admin_new_order",
        to: adminEmail,
        subject: `Новый заказ Kimramen ${order.orderNumber}`,
        relatedOrderId: order.orderId,
        relatedOrderNumber: order.orderNumber,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
            <h2>Новый заказ ${escapeHtml(order.orderNumber)}</h2>
            <p><strong>Клиент:</strong> ${escapeHtml(order.customerName)}</p>
            <p><strong>Телефон:</strong> ${escapeHtml(order.customerPhone)}</p>
            <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
            <p style="font-size:18px;"><strong>Итого: ${escapeHtml(total)}</strong></p>
          </div>
        `,
        text: `Новый заказ ${order.orderNumber}. Клиент: ${order.customerName}, телефон: ${order.customerPhone}, итого: ${total}`,
      })
    );
  }

  await Promise.allSettled(tasks);
}
