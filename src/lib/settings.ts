import pool from "@/src/lib/db";
import { writeErrorLog } from "@/src/lib/server/error-log";

type SettingRow = {
  setting_key: string;
  setting_value: string | null;
  setting_group: string;
  description: string | null;
  is_public?: number;
};

export type SiteSettings = {
  site: {
    phone: string;
    email: string;
    workHours: string;
  };
  delivery: {
    city: string;
    priceText: string;
    freeFrom: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  banners: {
    homepageNotice: string;
  };
};

type SettingDefinition = {
  key: string;
  group: string;
  description: string;
  defaultValue: string;
  isPublic?: boolean;
};

const SETTING_DEFINITIONS: SettingDefinition[] = [
  { key: "site.phone", group: "contacts", description: "Основной телефон сайта", defaultValue: "" },
  { key: "site.email", group: "contacts", description: "Основной email сайта и получатель уведомлений", defaultValue: "" },
  { key: "site.workHours", group: "contacts", description: "Часы работы", defaultValue: "" },
  { key: "delivery.city", group: "delivery", description: "Основной город доставки", defaultValue: "Chișinău" },
  { key: "delivery.priceText", group: "delivery", description: "Текст условий доставки", defaultValue: "" },
  { key: "delivery.freeFrom", group: "delivery", description: "Порог бесплатной доставки текстом", defaultValue: "" },
  { key: "seo.defaultTitle", group: "seo", description: "SEO title по умолчанию", defaultValue: "Kimramen" },
  { key: "seo.defaultDescription", group: "seo", description: "SEO description по умолчанию", defaultValue: "Онлайн-магазин азиатских продуктов Kimramen" },
  { key: "social.instagram", group: "social", description: "Instagram URL", defaultValue: "" },
  { key: "social.facebook", group: "social", description: "Facebook URL", defaultValue: "" },
  { key: "social.tiktok", group: "social", description: "TikTok URL", defaultValue: "" },
  { key: "banners.homepageNotice", group: "banners", description: "Короткое сообщение/баннер на главной", defaultValue: "" },
];

let settingsSchemaReadyPromise: Promise<void> | null = null;

function safeJsonParse(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : fallback;
  } catch {
    return value;
  }
}

function cleanString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function columnExists(conn: Awaited<ReturnType<typeof pool.getConnection>>, tableName: string, columnName: string) {
  const rows = await conn.query<{ count: number | string }[]>(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

function mapToSettings(rows: SettingRow[]): SiteSettings {
  const values = new Map<string, string>();

  for (const definition of SETTING_DEFINITIONS) {
    values.set(definition.key, definition.defaultValue);
  }

  for (const row of rows) {
    const definition = SETTING_DEFINITIONS.find((item) => item.key === row.setting_key);
    values.set(row.setting_key, safeJsonParse(row.setting_value, definition?.defaultValue || ""));
  }

  return {
    site: {
      phone: values.get("site.phone") || "",
      email: values.get("site.email") || "",
      workHours: values.get("site.workHours") || "",
    },
    delivery: {
      city: values.get("delivery.city") || "",
      priceText: values.get("delivery.priceText") || "",
      freeFrom: values.get("delivery.freeFrom") || "",
    },
    seo: {
      defaultTitle: values.get("seo.defaultTitle") || "Kimramen",
      defaultDescription: values.get("seo.defaultDescription") || "",
    },
    social: {
      instagram: values.get("social.instagram") || "",
      facebook: values.get("social.facebook") || "",
      tiktok: values.get("social.tiktok") || "",
    },
    banners: {
      homepageNotice: values.get("banners.homepageNotice") || "",
    },
  };
}

function flattenSettings(input: Partial<SiteSettings>) {
  return new Map<string, string>([
    ["site.phone", cleanString(input.site?.phone, 80)],
    ["site.email", cleanString(input.site?.email, 190)],
    ["site.workHours", cleanString(input.site?.workHours, 255)],
    ["delivery.city", cleanString(input.delivery?.city, 120)],
    ["delivery.priceText", cleanString(input.delivery?.priceText, 500)],
    ["delivery.freeFrom", cleanString(input.delivery?.freeFrom, 120)],
    ["seo.defaultTitle", cleanString(input.seo?.defaultTitle, 190)],
    ["seo.defaultDescription", cleanString(input.seo?.defaultDescription, 300)],
    ["social.instagram", cleanString(input.social?.instagram, 255)],
    ["social.facebook", cleanString(input.social?.facebook, 255)],
    ["social.tiktok", cleanString(input.social?.tiktok, 255)],
    ["banners.homepageNotice", cleanString(input.banners?.homepageNotice, 500)],
  ]);
}

async function createSettingsSchema() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        setting_key VARCHAR(120) NOT NULL,
        setting_value LONGTEXT NULL,
        setting_group VARCHAR(80) NOT NULL DEFAULT 'general',
        description VARCHAR(255) NULL,
        is_public TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_site_settings_key (setting_key),
        KEY idx_site_settings_group (setting_group)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    if (!(await columnExists(conn, "site_settings", "is_public"))) {
      await conn.query(`
        ALTER TABLE site_settings
        ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 1 AFTER description
      `);
    }

    for (const definition of SETTING_DEFINITIONS) {
      await conn.query(
        `
        INSERT INTO site_settings (setting_key, setting_value, setting_group, description, is_public)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_group = VALUES(setting_group), description = VALUES(description)
        `,
        [
          definition.key,
          JSON.stringify(definition.defaultValue),
          definition.group,
          definition.description,
          definition.isPublic === false ? 0 : 1,
        ]
      );
    }
  } catch (error) {
    await writeErrorLog("settings.createSettingsSchema", error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function ensureSettingsSchema() {
  if (!settingsSchemaReadyPromise) {
    settingsSchemaReadyPromise = createSettingsSchema();
  }

  return settingsSchemaReadyPromise;
}

export async function getSiteSettings() {
  await ensureSettingsSchema();
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<SettingRow[]>(`
      SELECT setting_key, setting_value, setting_group, description, is_public
      FROM site_settings
      ORDER BY setting_group ASC, setting_key ASC
    `);

    return mapToSettings(rows);
  } catch (error) {
    await writeErrorLog("settings.getSiteSettings", error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  await ensureSettingsSchema();
  const values = flattenSettings(input);
  const conn = await pool.getConnection();

  try {
    for (const definition of SETTING_DEFINITIONS) {
      const value = values.get(definition.key) ?? definition.defaultValue;
      await conn.query(
        `
        UPDATE site_settings
        SET setting_value = ?, setting_group = ?, description = ?
        WHERE setting_key = ?
        LIMIT 1
        `,
        [JSON.stringify(value), definition.group, definition.description, definition.key]
      );
    }

    return getSiteSettings();
  } catch (error) {
    await writeErrorLog("settings.updateSiteSettings", error);
    throw error;
  } finally {
    conn.release();
  }
}
