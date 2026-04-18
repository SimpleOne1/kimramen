import pool from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { MappedCategory } from "./syrve.category-mapper";

interface CategoryRow {
  id: number;
  external_id: string;
}

function uniqueSlug(base: string, externalId: string): string {
  const safeBase = base || "category";
  return `${safeBase}-${externalId.slice(0, 8)}`;
}

export async function syncSyrveCategories(categories: MappedCategory[]) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const externalIdToLocalId = new Map<string, number>();

    const sortedCategories = [...categories].sort((a, b) => {
      if (a.externalParentId === null && b.externalParentId !== null) return -1;
      if (a.externalParentId !== null && b.externalParentId === null) return 1;
      return 0;
    });

    let remaining = [...sortedCategories];
    let guard = 0;

    while (remaining.length > 0 && guard < 20) {
      guard += 1;
      const nextRound: MappedCategory[] = [];
      let progressed = false;

      for (const category of remaining) {
        const canInsert =
          category.externalParentId === null ||
          externalIdToLocalId.has(category.externalParentId);

        if (!canInsert) {
          nextRound.push(category);
          continue;
        }

        const parentId = category.externalParentId
          ? externalIdToLocalId.get(category.externalParentId) ?? null
          : null;

        const slug = uniqueSlug(slugify(category.name), category.externalId);

        await connection.query(
          `
          INSERT INTO categories (
            external_id,
            parent_id,
            slug,
            sort_order,
            is_active,
            sync_source,
            last_synced_at
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
            slug,
            category.sortOrder,
            category.isActive ? 1 : 0,
            category.syncSource,
          ]
        );

        const rows = await connection.query<CategoryRow[]>(
          `SELECT id, external_id FROM categories WHERE external_id = ? LIMIT 1`,
          [category.externalId]
        );

        if (!rows.length) {
          throw new Error(`Failed to load category after upsert: ${category.externalId}`);
        }

        const localCategoryId = rows[0].id;
        externalIdToLocalId.set(category.externalId, localCategoryId);

        await connection.query(
          `
          INSERT INTO category_translations (
            category_id,
            locale,
            name,
            description
          )
          VALUES (?, 'ru', ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
          `,
          [localCategoryId, category.name, category.description]
        );

        progressed = true;
      }

      if (!progressed && nextRound.length > 0) {
        throw new Error(
          `Category sync got stuck. Unresolved parent references: ${nextRound
            .map((item) => item.externalId)
            .join(", ")}`
        );
      }

      remaining = nextRound;
    }

    await connection.commit();

    return {
      syncedCount: categories.length,
      externalIdToLocalId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}