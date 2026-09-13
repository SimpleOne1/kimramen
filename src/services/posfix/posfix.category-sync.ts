import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { getPosfixCategoryEnglishName, MappedPosfixCategory } from "./posfix.mapper";

interface CategoryRow {
  id: number;
}

function uniqueSlug(base: string, externalId: string): string {
  return `${slugify(base) || "category"}-${slugify(externalId).slice(-24)}`;
}

export async function syncPosfixCategories(categories: MappedPosfixCategory[]) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // The source switch is deliberate: old Syrve categories remain in the database
    // for referential history but are no longer visible in the catalog.
    const oldSourceResult = await connection.query(
      `UPDATE categories SET is_active = 0, updated_at = NOW() WHERE sync_source = 'syrve'`,
    );

    const externalIdToLocalId = new Map<string, number>();
    const sortedCategories = [...categories].sort((a, b) => {
      if (a.externalParentId === null && b.externalParentId !== null) return -1;
      if (a.externalParentId !== null && b.externalParentId === null) return 1;
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ru");
    });

    let remaining = sortedCategories;
    let rounds = 0;

    while (remaining.length > 0) {
      rounds += 1;
      if (rounds > categories.length + 1) {
        throw new Error("POSfix category tree contains unresolved parent references");
      }

      const nextRound: MappedPosfixCategory[] = [];
      let progressed = false;

      for (const category of remaining) {
        if (category.externalParentId && !externalIdToLocalId.has(category.externalParentId)) {
          nextRound.push(category);
          continue;
        }

        const parentId = category.externalParentId
          ? externalIdToLocalId.get(category.externalParentId) || null
          : null;

        await connection.query(
          `
          INSERT INTO categories (
            external_id, parent_id, slug, sort_order, is_active, sync_source, last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            parent_id = VALUES(parent_id),
            slug = VALUES(slug),
            sort_order = VALUES(sort_order),
            is_active = VALUES(is_active),
            sync_source = VALUES(sync_source),
            last_synced_at = NOW()
          `,
          [
            category.externalId,
            parentId,
            uniqueSlug(category.name, category.externalId),
            category.sortOrder,
            category.isActive ? 1 : 0,
            category.syncSource,
          ],
        );

        const rows = await connection.query<CategoryRow[]>(
          `SELECT id FROM categories WHERE external_id = ? LIMIT 1`,
          [category.externalId],
        );
        if (!rows.length) throw new Error(`Failed to load POSfix category: ${category.externalId}`);

        const localId = Number(rows[0].id);
        externalIdToLocalId.set(category.externalId, localId);

        await connection.query(
          `
          INSERT INTO category_translations (category_id, locale, name, description)
          VALUES (?, 'ru', ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
          `,
          [localId, category.name, category.description],
        );
        await connection.query(
          `
          INSERT INTO category_translations (category_id, locale, name, description)
          VALUES (?, 'en', ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
          `,
          [localId, getPosfixCategoryEnglishName(category.name), category.description],
        );

        progressed = true;
      }

      if (!progressed && nextRound.length) {
        throw new Error(
          `POSfix category sync got stuck: ${nextRound.map((category) => category.externalId).join(", ")}`,
        );
      }

      remaining = nextRound;
    }

    if (categories.length) {
      const placeholders = categories.map(() => "?").join(", ");
      await connection.query(
        `
        UPDATE categories
        SET is_active = 0, updated_at = NOW()
        WHERE sync_source = 'posfix' AND external_id NOT IN (${placeholders})
        `,
        categories.map((category) => category.externalId),
      );
    } else {
      await connection.query(
        `UPDATE categories SET is_active = 0, updated_at = NOW() WHERE sync_source = 'posfix'`,
      );
    }

    await connection.commit();

    return {
      syncedCount: categories.length,
      externalIdToLocalId,
      deactivatedOldSyrveCategories: Number(oldSourceResult.affectedRows || 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
