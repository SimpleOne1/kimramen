import { SYRVE_SYNC_SOURCE } from "./syrve.constants";
import { fixMojibakeString, fixRequiredMojibakeString } from "./syrve.encoding";
import { SyrveGroup } from "./syrve.types";

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
  return groups.map((group) => ({
    externalId: group.id,
    externalParentId: group.parentGroup,
    name: fixRequiredMojibakeString(group.name),
    description: fixMojibakeString(group.description),
    sortOrder: Number.isFinite(group.order) ? group.order : 0,
    isActive: !group.isDeleted,
    syncSource: SYRVE_SYNC_SOURCE,
  }));
}