import pool from "@/src/lib/db";
import { hashPassword } from "@/src/lib/auth/password";

const MASTER_ADMIN_LOGIN = "admin";
const MASTER_ADMIN_PASSWORD = "adminkimramen";

let schemaReadyPromise: Promise<void> | null = null;

type CountRow = { count: number | string };

type AdminRow = { id: number; role: string };

async function createAuthTables() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NULL,
        phone VARCHAR(64) NULL,
        password_hash VARCHAR(255) NULL,
        first_name VARCHAR(120) NULL,
        last_name VARCHAR(120) NULL,
        default_delivery_name VARCHAR(160) NULL,
        default_delivery_phone VARCHAR(64) NULL,
        default_delivery_city VARCHAR(120) NULL,
        default_delivery_street VARCHAR(255) NULL,
        default_delivery_house VARCHAR(64) NULL,
        default_delivery_apartment VARCHAR(64) NULL,
        default_delivery_comment TEXT NULL,
        auth_provider ENUM('email','google') NOT NULL DEFAULT 'email',
        google_sub VARCHAR(190) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_customers_email (email),
        UNIQUE KEY uq_customers_google_sub (google_sub),
        KEY idx_customers_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_id INT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL,
        user_agent VARCHAR(255) NULL,
        ip_address VARCHAR(64) NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at DATETIME NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_customer_sessions_token_hash (token_hash),
        KEY idx_customer_sessions_customer_id (customer_id),
        CONSTRAINT fk_customer_sessions_customer_id
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_id INT UNSIGNED NOT NULL,
        label VARCHAR(120) NULL,
        recipient_name VARCHAR(160) NULL,
        phone VARCHAR(64) NULL,
        city VARCHAR(120) NULL,
        street VARCHAR(255) NULL,
        house VARCHAR(64) NULL,
        apartment VARCHAR(64) NULL,
        entrance VARCHAR(64) NULL,
        floor VARCHAR(64) NULL,
        comment TEXT NULL,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_customer_addresses_customer_id (customer_id),
        CONSTRAINT fk_customer_addresses_customer_id
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);



    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_number VARCHAR(40) NOT NULL,
        customer_id INT UNSIGNED NULL,
        status ENUM('new','processing','completed','cancelled') NOT NULL DEFAULT 'new',
        customer_name VARCHAR(160) NOT NULL,
        customer_email VARCHAR(190) NULL,
        customer_phone VARCHAR(64) NOT NULL,
        delivery_city VARCHAR(120) NULL,
        delivery_street VARCHAR(255) NULL,
        delivery_house VARCHAR(64) NULL,
        delivery_apartment VARCHAR(64) NULL,
        delivery_comment TEXT NULL,
        customer_comment TEXT NULL,
        subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        delivery_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(12) NOT NULL DEFAULT 'MDL',
        source ENUM('site','admin') NOT NULL DEFAULT 'site',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_orders_order_number (order_number),
        KEY idx_orders_customer_id (customer_id),
        KEY idx_orders_status_created_at (status, created_at),
        CONSTRAINT fk_orders_customer_id
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NULL,
        product_slug VARCHAR(255) NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT NULL,
        sku VARCHAR(120) NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(12) NOT NULL DEFAULT 'MDL',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_order_items_order_id (order_id),
        KEY idx_order_items_product_id (product_id),
        CONSTRAINT fk_order_items_order_id
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product_id
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_favorites (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_customer_favorites_customer_product (customer_id, product_id),
        KEY idx_customer_favorites_customer_id (customer_id),
        KEY idx_customer_favorites_product_id (product_id),
        CONSTRAINT fk_customer_favorites_customer_id
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_customer_favorites_product_id
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);


    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        login VARCHAR(80) NOT NULL,
        email VARCHAR(190) NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(160) NOT NULL,
        role ENUM('master_admin','admin','manager','content_manager','moderator') NOT NULL DEFAULT 'manager',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at DATETIME NULL,
        created_by INT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_users_login (login),
        UNIQUE KEY uq_admin_users_email (email),
        KEY idx_admin_users_role (role),
        KEY idx_admin_users_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      ALTER TABLE admin_users
      MODIFY role ENUM('master_admin','admin','manager','content_manager','moderator') NOT NULL DEFAULT 'manager'
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        admin_user_id INT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL,
        user_agent VARCHAR(255) NULL,
        ip_address VARCHAR(64) NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at DATETIME NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_sessions_token_hash (token_hash),
        KEY idx_admin_sessions_admin_user_id (admin_user_id),
        CONSTRAINT fk_admin_sessions_admin_user_id
          FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
}

async function ensureMasterAdmin() {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<CountRow[]>(
      `SELECT COUNT(*) AS count FROM admin_users WHERE login = ? LIMIT 1`,
      [MASTER_ADMIN_LOGIN]
    );

    if (Number(rows[0]?.count || 0) > 0) {
      const admins = await conn.query<AdminRow[]>(
        `SELECT id, role FROM admin_users WHERE login = ? LIMIT 1`,
        [MASTER_ADMIN_LOGIN]
      );

      if (admins[0]?.role !== "master_admin") {
        await conn.query(
          `UPDATE admin_users SET role = 'master_admin', is_active = 1 WHERE id = ?`,
          [admins[0].id]
        );
      }

      return;
    }

    await conn.query(
      `
      INSERT INTO admin_users (login, email, password_hash, display_name, role, is_active)
      VALUES (?, NULL, ?, ?, 'master_admin', 1)
      `,
      [MASTER_ADMIN_LOGIN, hashPassword(MASTER_ADMIN_PASSWORD), "Master Admin"]
    );
  } finally {
    conn.release();
  }
}

export async function ensureAuthSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createAuthTables().then(ensureMasterAdmin);
  }

  return schemaReadyPromise;
}
