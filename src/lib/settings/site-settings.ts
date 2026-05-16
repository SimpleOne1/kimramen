import pool from "@/src/lib/db";
import { CACHE_TAGS, cached, invalidateCacheTag } from "@/src/lib/cache/cache";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

export type SiteSettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export type SiteSetting = {
  key: string;
  value: SiteSettingValue;
  group: string;
  description: string | null;
};

function parseValue(value: string | null) {
  if (value === null) return null;
  try {
    return JSON.parse(value) as SiteSettingValue;
  } catch {
    return value;
  }
}

function serializeValue(value: SiteSettingValue) {
  return JSON.stringify(value ?? null);
}

async function getSettingsRaw(group?: string) {
  await ensureAuthSchema();
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<Array<{ setting_key: string; setting_value: string | null; setting_group: string; description: string | null }>>(
      `
      SELECT setting_key, setting_value, setting_group, description
      FROM site_settings
      ${group ? "WHERE setting_group = ?" : ""}
      ORDER BY setting_group ASC, setting_key ASC
      `,
      group ? [group] : []
    );

    return rows.map((row) => ({
      key: row.setting_key,
      value: parseValue(row.setting_value),
      group: row.setting_group,
      description: row.description,
    }));
  } finally {
    conn.release();
  }
}

export const getSiteSettings = cached(
  ["site-settings"],
  async () => getSettingsRaw(),
  { tags: [CACHE_TAGS.settings], revalidate: 300 }
);

export async function setSiteSetting(key: string, value: SiteSettingValue, group = "general", description?: string | null) {
  await ensureAuthSchema();
  const normalizedKey = key.trim();
  if (!normalizedKey) throw new Error("Setting key is required");

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `
      INSERT INTO site_settings (setting_key, setting_value, setting_group, description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        setting_group = VALUES(setting_group),
        description = COALESCE(VALUES(description), description),
        updated_at = NOW()
      `,
      [normalizedKey, serializeValue(value), group, description ?? null]
    );
  } finally {
    conn.release();
  }

  invalidateCacheTag(CACHE_TAGS.settings);
}
