import { fixRequiredMojibakeString } from "./syrve.encoding";
import { SyrveGroup } from "./syrve.types";

const NUMBERED_CATEGORY_RE = /^\s*\d+[\s.)_\-–—]+/u;
const CYRILLIC_RE = /[А-Яа-яЁё]/u;
const LATIN_RE = /[A-Za-z]/u;
const TECHNICAL_GROUP_NAMES = new Set(["kim ramen", "kimramen"]);

function cleanGroupName(value: string) {
  return fixRequiredMojibakeString(value).replace(/\s+/g, " ").trim();
}

function stripLeadingNumber(value: string) {
  return value
    .replace(NUMBERED_CATEGORY_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCategoryName(value: string) {
  return stripLeadingNumber(cleanGroupName(value));
}

export function normalizeBrandName(value: string) {
  return cleanGroupName(value);
}

export function isSyrveBrandGroup(group: SyrveGroup) {
  const name = cleanGroupName(group.name);
  const lower = name.toLowerCase();

  if (!name || TECHNICAL_GROUP_NAMES.has(lower)) return false;
  if (NUMBERED_CATEGORY_RE.test(name)) return false;
  if (CYRILLIC_RE.test(name)) return false;

  // В текущей выгрузке бренды идут латиницей: Samyang, Bibigo, Nongshim и т.д.
  return LATIN_RE.test(name);
}

export function isSyrveCategoryGroup(group: SyrveGroup) {
  const name = cleanGroupName(group.name);
  const lower = name.toLowerCase();

  if (!name || TECHNICAL_GROUP_NAMES.has(lower)) return false;
  if (isSyrveBrandGroup(group)) return false;

  // Основной надежный признак категорий из текущего JSON: номер + русское название.
  // Оставляем Cyrillic fallback, чтобы не потерять русские категории без номера.
  return NUMBERED_CATEGORY_RE.test(name) || CYRILLIC_RE.test(name);
}

export interface SyrveGroupClassification {
  categoryGroupIds: Set<string>;
  brandGroupIds: Set<string>;
  groupById: Map<string, SyrveGroup>;
}

export function classifySyrveGroups(groups: SyrveGroup[]): SyrveGroupClassification {
  const categoryGroupIds = new Set<string>();
  const brandGroupIds = new Set<string>();
  const groupById = new Map<string, SyrveGroup>();

  for (const group of groups) {
    groupById.set(group.id, group);
    if (group.isDeleted) continue;

    if (isSyrveBrandGroup(group)) {
      brandGroupIds.add(group.id);
      continue;
    }

    if (isSyrveCategoryGroup(group)) {
      categoryGroupIds.add(group.id);
    }
  }

  return { categoryGroupIds, brandGroupIds, groupById };
}

export function findNearestCategoryGroupId(
  groupId: string | null,
  classification: SyrveGroupClassification
): string | null {
  let currentId = groupId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    if (classification.categoryGroupIds.has(currentId)) {
      return currentId;
    }

    currentId = classification.groupById.get(currentId)?.parentGroup ?? null;
  }

  return null;
}

export function findNearestBrandName(
  groupId: string | null,
  classification: SyrveGroupClassification
): string | null {
  let currentId = groupId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    const group = classification.groupById.get(currentId);
    if (!group) return null;

    if (classification.brandGroupIds.has(currentId)) {
      return normalizeBrandName(group.name);
    }

    currentId = group.parentGroup;
  }

  return null;
}

export function findNearestCategoryParentId(
  group: SyrveGroup,
  classification: SyrveGroupClassification
): string | null {
  return findNearestCategoryGroupId(group.parentGroup, classification);
}
