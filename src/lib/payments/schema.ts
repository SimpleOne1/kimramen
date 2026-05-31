import pool from "@/src/lib/db";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

let paymentSchemaPromise: Promise<void> | null = null;

type ColumnRow = { COLUMN_NAME: string };

async function hasColumn(conn: any, tableName: string, columnName: string) {
  const rows = await conn.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(conn: any, tableName: string, columnName: string, definition: string) {
  if (!(await hasColumn(conn, tableName, columnName))) {
    await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensurePaymentSchemaInternal() {
  await ensureAuthSchema();
  const conn = await pool.getConnection();

  try {
    await addColumnIfMissing(conn, "orders", "payment_method", "VARCHAR(40) NULL AFTER source");
    await addColumnIfMissing(conn, "orders", "payment_status", "VARCHAR(40) NOT NULL DEFAULT 'unpaid' AFTER payment_method");
    await addColumnIfMissing(conn, "orders", "paid_at", "DATETIME NULL AFTER payment_status");
    await addColumnIfMissing(conn, "orders", "payment_reference", "VARCHAR(190) NULL AFTER paid_at");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        order_number VARCHAR(40) NOT NULL,
        provider ENUM('maib','paynet') NOT NULL,
        status ENUM('created','pending','redirected','paid','failed','cancelled','refunded','unknown') NOT NULL DEFAULT 'created',
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(12) NOT NULL DEFAULT 'MDL',
        provider_payment_id VARCHAR(190) NULL,
        provider_checkout_id VARCHAR(190) NULL,
        provider_order_id VARCHAR(190) NULL,
        redirect_url TEXT NULL,
        idempotency_key VARCHAR(190) NULL,
        request_payload JSON NULL,
        response_payload JSON NULL,
        callback_payload JSON NULL,
        failure_reason TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        paid_at DATETIME NULL,
        PRIMARY KEY (id),
        KEY idx_payment_transactions_order_id (order_id),
        KEY idx_payment_transactions_provider_checkout_id (provider, provider_checkout_id),
        KEY idx_payment_transactions_provider_order_id (provider, provider_order_id),
        UNIQUE KEY uq_payment_transactions_idempotency (provider, idempotency_key),
        CONSTRAINT fk_payment_transactions_order_id
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
}

export function ensurePaymentSchema() {
  if (!paymentSchemaPromise) paymentSchemaPromise = ensurePaymentSchemaInternal();
  return paymentSchemaPromise;
}
