'use client';

import { HierarchicalSeason } from '../types/emails/recipients';

export interface HierarchyMaps {
  parentMap: Map<string, string>;
  childrenMap: Map<string, Set<string>>;
  itemTypeMap: Map<string, 'season' | 'league' | 'division' | 'team'>;
  siblingsMap: Map<string, Set<string>>;
  playerCountMap: Map<string, number>;
  managerCountMap: Map<string, number>;
}

const emptyMaps: HierarchyMaps = {
  parentMap: new Map<string, string>(),
  childrenMap: new Map<string, Set<string>>(),
  itemTypeMap: new Map<string, 'season' | 'league' | 'division' | 'team'>(),
  siblingsMap: new Map<string, Set<string>>(),
  playerCountMap: new Map<string, number>(),
  managerCountMap: new Map<string, number>(),
};

function buildHierarchyMaps(hierarchicalData: HierarchicalSeason, seasonId: string): HierarchyMaps {
  const parentMap = new Map<string, string>();
  const childrenMap = new Map<string, Set<string>>();
  const itemTypeMap = new Map<string, 'season' | 'league' | 'division' | 'team'>();
  const siblingsMap = new Map<string, Set<string>>();
  const playerCountMap = new Map<string, number>();
  const managerCountMap = new Map<string, number>();

  itemTypeMap.set(seasonId, 'season');
  childrenMap.set(seasonId, new Set());
  playerCountMap.set(seasonId, hierarchicalData.totalPlayers || 0);
  managerCountMap.set(seasonId, hierarchicalData.totalManagers || 0);

  const leagueIds = new Set<string>();
  hierarchicalData.leagues.forEach((league) => {
    itemTypeMap.set(league.id, 'league');
    parentMap.set(league.id, seasonId);
    childrenMap.get(seasonId)!.add(league.id);
    childrenMap.set(league.id, new Set());
    leagueIds.add(league.id);
    playerCountMap.set(league.id, league.totalPlayers || 0);
    managerCountMap.set(league.id, league.totalManagers || 0);

    const divisionIds = new Set<string>();
    league.divisions?.forEach((division) => {
      itemTypeMap.set(division.id, 'division');
      parentMap.set(division.id, league.id);
      childrenMap.get(league.id)!.add(division.id);
      childrenMap.set(division.id, new Set());
      divisionIds.add(division.id);
      playerCountMap.set(division.id, division.totalPlayers || 0);
      managerCountMap.set(division.id, division.totalManagers || 0);

      const teamIds = new Set<string>();
      division.teams.forEach((team) => {
        itemTypeMap.set(team.id, 'team');
        parentMap.set(team.id, division.id);
        childrenMap.get(division.id)!.add(team.id);
        teamIds.add(team.id);
        playerCountMap.set(team.id, team.playerCount || 0);
        managerCountMap.set(team.id, team.managerCount || 0);
      });
      siblingsMap.set(division.id, new Set(teamIds));
      teamIds.forEach((teamId) => siblingsMap.set(teamId, new Set(teamIds)));
    });

    siblingsMap.set(league.id, new Set(divisionIds));
    divisionIds.forEach((divisionId) => siblingsMap.set(divisionId, new Set(divisionIds)));

    (league.unassignedTeams || []).forEach((team) => {
      itemTypeMap.set(team.id, 'team');
      parentMap.set(team.id, league.id);
      childrenMap.get(league.id)!.add(team.id);
      playerCountMap.set(team.id, team.playerCount || 0);
      managerCountMap.set(team.id, team.managerCount || 0);
    });
  });

  siblingsMap.set(seasonId, new Set(leagueIds));
  leagueIds.forEach((leagueId) => siblingsMap.set(leagueId, new Set(leagueIds)));

  return { parentMap, childrenMap, itemTypeMap, siblingsMap, playerCountMap, managerCountMap };
}

export function useHierarchicalMaps(
  hierarchicalData: HierarchicalSeason | null,
  seasonId: string,
): HierarchyMaps {
  if (!hierarchicalData) {
    return emptyMaps;
  }

  return buildHierarchyMaps(hierarchicalData, seasonId);
}
