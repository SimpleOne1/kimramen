import pool from "@/src/lib/db";

export type AdminPromotionProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  mainImage: string | null;
  sku: string | null;
};

export type AdminPromotion = {
  id: number;
  title: string;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  productsCount: number;
  products: AdminPromotionProduct[];
  createdAt: string | null;
  updatedAt: string | null;
};

type PromotionRow = {
  id: number;
  title: string;
  discount_percent: number | string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: number | boolean;
  products_count: number | string;
  created_at: string | null;
  updated_at: string | null;
};

type PromotionProductRow = {
  promotion_id: number;
  id: number;
  name: string | null;
  slug: string;
  price: number | string;
  currency: string | null;
  main_image: string | null;
  sku: string | null;
};

let promotionsSchemaReadyPromise: Promise<void> | null = null;

export async function ensurePromotionsSchema() {
  if (!promotionsSchemaReadyPromise) {
    promotionsSchemaReadyPromise = createPromotionsTables();
  }

  return promotionsSchemaReadyPromise;
}

async function columnExists(conn: any, tableName: string, columnName: string) {
  const rows = await conn.query(
    `
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

async function indexExists(conn: any, tableName: string, indexName: string) {
  const rows = await conn.query(
    `
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    `,
    [tableName, indexName],
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

async function tableExists(conn: any, tableName: string) {
  const rows = await conn.query(
    `
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [tableName],
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

async function addColumnIfMissing(conn: any, tableName: string, columnName: string, definition: string) {
  const exists = await columnExists(conn, tableName, columnName);
  if (!exists) {
    await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

async function createPromotionsTables() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        title VARCHAR(190) NOT NULL,
        discount_percent DECIMAL(5,2) NOT NULL,
        starts_at DATETIME NULL,
        ends_at DATETIME NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_promotions_active_dates (is_active, starts_at, ends_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Важно: если таблица promotions уже была создана старым патчем/экспериментом,
    // CREATE TABLE IF NOT EXISTS не меняет её структуру. Поэтому добавляем недостающие
    // колонки безопасно, без удаления существующих данных.
    await addColumnIfMissing(conn, "promotions", "title", "title VARCHAR(190) NOT NULL DEFAULT 'Акция' AFTER id");
    await addColumnIfMissing(conn, "promotions", "discount_percent", "discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER title");
    await addColumnIfMissing(conn, "promotions", "starts_at", "starts_at DATETIME NULL AFTER discount_percent");
    await addColumnIfMissing(conn, "promotions", "ends_at", "ends_at DATETIME NULL AFTER starts_at");
    await addColumnIfMissing(conn, "promotions", "is_active", "is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER ends_at");
    await addColumnIfMissing(conn, "promotions", "created_at", "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active");
    await addColumnIfMissing(conn, "promotions", "updated_at", "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

    const hasActiveDatesIndex = await indexExists(conn, "promotions", "idx_promotions_active_dates");
    if (!hasActiveDatesIndex) {
      await conn.query(`CREATE INDEX idx_promotions_active_dates ON promotions (is_active, starts_at, ends_at)`);
    }

    const hasPromotionProducts = await tableExists(conn, "promotion_products");
    if (!hasPromotionProducts) {
      await conn.query(`
        CREATE TABLE promotion_products (
          promotion_id INT UNSIGNED NOT NULL,
          product_id INT UNSIGNED NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (promotion_id, product_id),
          KEY idx_promotion_products_product_id (product_id),
          CONSTRAINT fk_promotion_products_promotion_id
            FOREIGN KEY (promotion_id) REFERENCES promotions(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_promotion_products_product_id
            FOREIGN KEY (product_id) REFERENCES products(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      await addColumnIfMissing(conn, "promotion_products", "promotion_id", "promotion_id INT UNSIGNED NOT NULL");
      await addColumnIfMissing(conn, "promotion_products", "product_id", "product_id INT UNSIGNED NOT NULL");
      await addColumnIfMissing(conn, "promotion_products", "created_at", "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

      const hasProductIndex = await indexExists(conn, "promotion_products", "idx_promotion_products_product_id");
      if (!hasProductIndex) {
        await conn.query(`CREATE INDEX idx_promotion_products_product_id ON promotion_products (product_id)`);
      }
    }
  } finally {
    conn.release();
  }
}

function normalizeDateTime(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // datetime-local приходит как YYYY-MM-DDTHH:mm. MariaDB DATETIME ждёт пробел.
  return trimmed.replace("T", " ").slice(0, 19);
}

function normalizeProductIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

export function parsePromotionPayload(body: unknown) {
  const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const title = String(source.title || "").trim();
  const discountPercent = Number(source.discountPercent);
  const startsAt = normalizeDateTime(source.startsAt);
  const endsAt = normalizeDateTime(source.endsAt);
  const isActive = source.isActive === false ? 0 : 1;
  const productIds = normalizeProductIds(source.productIds);

  if (!title) {
    throw new Error("Укажи название акции");
  }

  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 95) {
    throw new Error("Процент скидки должен быть от 1 до 95");
  }

  if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
    throw new Error("Дата начала не может быть позже даты окончания");
  }

  return { title, discountPercent, startsAt, endsAt, isActive, productIds };
}

export async function getAdminPromotions(): Promise<AdminPromotion[]> {
  await ensurePromotionsSchema();
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<PromotionRow[]>(`
      SELECT
        pr.id,
        pr.title,
        pr.discount_percent,
        pr.starts_at,
        pr.ends_at,
        pr.is_active,
        pr.created_at,
        pr.updated_at,
        COUNT(pp.product_id) AS products_count
      FROM promotions pr
      LEFT JOIN promotion_products pp ON pp.promotion_id = pr.id
      GROUP BY pr.id
      ORDER BY pr.id DESC
    `);

    const ids = rows.map((row) => Number(row.id)).filter(Boolean);
    const productsByPromotion = new Map<number, AdminPromotionProduct[]>();

    if (ids.length > 0) {
      const productRows = await conn.query<PromotionProductRow[]>(
        `
        SELECT
          pp.promotion_id,
          p.id,
          p.slug,
          p.price,
          p.currency,
          p.main_image,
          p.sku,
          pt.name
        FROM promotion_products pp
        INNER JOIN products p ON p.id = pp.product_id
        LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ru'
        WHERE pp.promotion_id IN (${ids.map(() => "?").join(",")})
        ORDER BY pp.promotion_id DESC, pt.name ASC, p.id DESC
        `,
        ids,
      );

      for (const row of productRows) {
        const promotionId = Number(row.promotion_id);
        const list = productsByPromotion.get(promotionId) || [];
        list.push({
          id: Number(row.id),
          name: row.name || "Без названия",
          slug: row.slug,
          price: Number(row.price || 0),
          currency: row.currency || "MDL",
          mainImage: row.main_image,
          sku: row.sku,
        });
        productsByPromotion.set(promotionId, list);
      }
    }

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      discountPercent: Number(row.discount_percent || 0),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: Boolean(row.is_active),
      productsCount: Number(row.products_count || 0),
      products: productsByPromotion.get(Number(row.id)) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } finally {
    conn.release();
  }
}

export async function createAdminPromotion(payload: ReturnType<typeof parsePromotionPayload>) {
  await ensurePromotionsSchema();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const result = await conn.query(
      `
      INSERT INTO promotions (title, discount_percent, starts_at, ends_at, is_active)
      VALUES (?, ?, ?, ?, ?)
      `,
      [payload.title, payload.discountPercent, payload.startsAt, payload.endsAt, payload.isActive],
    );

    const promotionId = Number(result.insertId);

    for (const productId of payload.productIds) {
      await conn.query(
        `INSERT IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)`,
        [promotionId, productId],
      );
    }

    await conn.commit();
    return promotionId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateAdminPromotion(id: number, payload: ReturnType<typeof parsePromotionPayload>) {
  await ensurePromotionsSchema();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE promotions
      SET title = ?, discount_percent = ?, starts_at = ?, ends_at = ?, is_active = ?
      WHERE id = ?
      `,
      [payload.title, payload.discountPercent, payload.startsAt, payload.endsAt, payload.isActive, id],
    );

    await conn.query(`DELETE FROM promotion_products WHERE promotion_id = ?`, [id]);

    for (const productId of payload.productIds) {
      await conn.query(
        `INSERT IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)`,
        [id, productId],
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function deleteAdminPromotion(id: number) {
  await ensurePromotionsSchema();
  const conn = await pool.getConnection();

  try {
    await conn.query(`DELETE FROM promotions WHERE id = ?`, [id]);
  } finally {
    conn.release();
  }
}
