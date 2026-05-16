import { SYRVE_SYNC_SOURCE } from "./syrve.constants";
import { fixMojibakeString } from "./syrve.encoding";
import { SyrveGroup } from "./syrve.types";
import {
  classifySyrveGroups,
  findNearestCategoryParentId,
  normalizeCategoryName,
} from "./syrve.group-classifier";

export interface MappedCategory {
  externalId: string;
  externalParentId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  syncSource: string;
}

export function mapSyrveGroupsToCategories(groups: SyrveGroup[]): MappedCategory[] {
  const classification = classifySyrveGroups(groups);

  return groups
    .filter((group) => classification.categoryGroupIds.has(group.id))
    .map((group) => ({
      externalId: group.id,
      externalParentId: findNearestCategoryParentId(group, classification),
      name: normalizeCategoryName(group.name),
      description: fixMojibakeString(group.description),
      sortOrder: Number.isFinite(group.order) ? group.order : 0,
      isActive: !group.isDeleted,
      syncSource: SYRVE_SYNC_SOURCE,
    }));
}
