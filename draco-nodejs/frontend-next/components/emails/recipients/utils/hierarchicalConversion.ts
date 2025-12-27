import {
  GroupType,
  ContactGroup,
  HierarchicalSelectionItem,
  HierarchicalSelectionState,
  HierarchicalSeason,
  convertHierarchicalToContactGroups,
} from '../../../../types/emails/recipients';

export interface HierarchyMaps {
  itemTypeMap: Map<string, 'season' | 'league' | 'division' | 'team'>;
  parentMap: Map<string, string>;
}

export function convertHierarchicalSelectionsToContactGroups(
  hierarchicalData: HierarchicalSeason | null,
  hierarchicalSelectedIds: Map<string, HierarchicalSelectionItem>,
  hierarchicalManagersOnly: boolean,
  hierarchyMaps: HierarchyMaps,
): Map<GroupType, ContactGroup[]> {
  if (!hierarchicalData || hierarchicalSelectedIds.size === 0) {
    return new Map();
  }

  const hierarchicalState: HierarchicalSelectionState = {
    selectedSeasonIds: new Set<string>(),
    selectedLeagueIds: new Set<string>(),
    selectedDivisionIds: new Set<string>(),
    selectedTeamIds: new Set<string>(),
    managersOnly: hierarchicalManagersOnly,
  };

  hierarchicalSelectedIds.forEach((selectionItem, itemId) => {
    if (selectionItem.state === 'selected') {
      const itemType = hierarchyMaps.itemTypeMap.get(itemId);

      switch (itemType) {
        case 'season':
          hierarchicalState.selectedSeasonIds.add(itemId);
          break;
        case 'league':
          hierarchicalState.selectedLeagueIds.add(itemId);
          break;
        case 'division':
          hierarchicalState.selectedDivisionIds.add(itemId);
          break;
        case 'team':
          hierarchicalState.selectedTeamIds.add(itemId);
          break;
      }
    }
  });

  const filteredState: HierarchicalSelectionState = {
    selectedSeasonIds: hierarchicalState.selectedSeasonIds,
    selectedLeagueIds: new Set<string>(),
    selectedDivisionIds: new Set<string>(),
    selectedTeamIds: new Set<string>(),
    managersOnly: hierarchicalState.managersOnly,
  };

  if (hierarchicalState.selectedSeasonIds.size > 0) {
    // Season takes precedence - don't include any child selections
  } else {
    filteredState.selectedLeagueIds = hierarchicalState.selectedLeagueIds;

    hierarchicalState.selectedDivisionIds.forEach((divisionId) => {
      const parentLeagueId = hierarchyMaps.parentMap.get(divisionId);
      if (!parentLeagueId || !filteredState.selectedLeagueIds.has(parentLeagueId)) {
        filteredState.selectedDivisionIds.add(divisionId);
      }
    });

    hierarchicalState.selectedTeamIds.forEach((teamId) => {
      const parentDivisionId = hierarchyMaps.parentMap.get(teamId);
      const parentLeagueId = parentDivisionId
        ? hierarchyMaps.parentMap.get(parentDivisionId)
        : hierarchyMaps.parentMap.get(teamId);

      const isInSelectedLeague =
        parentLeagueId && filteredState.selectedLeagueIds.has(parentLeagueId);
      const isInSelectedDivision =
        parentDivisionId && filteredState.selectedDivisionIds.has(parentDivisionId);

      if (!isInSelectedLeague && !isInSelectedDivision) {
        filteredState.selectedTeamIds.add(teamId);
      }
    });
  }

  return convertHierarchicalToContactGroups(filteredState, hierarchicalData);
}

export function mergeContactGroups(
  selectedGroups: Map<GroupType, ContactGroup[]>,
  hierarchicalContactGroups: Map<GroupType, ContactGroup[]>,
): Map<GroupType, ContactGroup[]> {
  const manualGroupTypes: Set<GroupType> = new Set(['individuals']);
  const hierarchicalGroupTypes: Set<GroupType> = new Set(['season', 'league', 'division', 'teams']);

  const mergedContactGroups = new Map<GroupType, ContactGroup[]>();

  selectedGroups.forEach((contactGroups, groupType) => {
    if (manualGroupTypes.has(groupType)) {
      mergedContactGroups.set(groupType, contactGroups);
    }
  });

  hierarchicalContactGroups.forEach((contactGroups, groupType) => {
    if (contactGroups.length > 0 && hierarchicalGroupTypes.has(groupType)) {
      mergedContactGroups.set(groupType, contactGroups);
    }
  });

  return mergedContactGroups;
}
