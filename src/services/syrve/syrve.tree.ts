import { SYRVE_TARGET_ROOT_GROUP_NAME } from "./syrve.constants";
import { SyrveGroup } from "./syrve.types";

export function findKimRamenRootGroup(groups: SyrveGroup[]): SyrveGroup {
  const rootGroup = groups.find((group) => group.name === SYRVE_TARGET_ROOT_GROUP_NAME);

  if (!rootGroup) {
    throw new Error(`Root group "${SYRVE_TARGET_ROOT_GROUP_NAME}" not found in Syrve groups`);
  }

  return rootGroup;
}

export function collectDescendantGroupIds(
  groups: SyrveGroup[],
  rootGroupId: string
): Set<string> {
  const allowedIds = new Set<string>([rootGroupId]);

  let changed = true;

  while (changed) {
    changed = false;

    for (const group of groups) {
      if (group.parentGroup && allowedIds.has(group.parentGroup) && !allowedIds.has(group.id)) {
        allowedIds.add(group.id);
        changed = true;
      }
    }
  }

  return allowedIds;
}

export function getKimRamenBranchGroups(groups: SyrveGroup[]): {
  rootGroup: SyrveGroup;
  branchGroupIds: Set<string>;
  branchGroups: SyrveGroup[];
} {
  const rootGroup = findKimRamenRootGroup(groups);
  const branchGroupIds = collectDescendantGroupIds(groups, rootGroup.id);

  const branchGroups = groups.filter((group) => branchGroupIds.has(group.id));

  return {
    rootGroup,
    branchGroupIds,
    branchGroups,
  };
}