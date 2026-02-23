import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { HierarchicalSeason } from '../../types/emails/recipients';
import type {
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  DivisionSeasonWithTeamsType,
  TeamSeasonWithPlayerCountType,
} from '@draco/shared-schemas';

const makeTeam = (
  id: string,
  overrides: Partial<TeamSeasonWithPlayerCountType> = {},
): TeamSeasonWithPlayerCountType => ({
  id,
  name: `Team ${id}`,
  team: { id: `team-def-${id}` },
  playerCount: 5,
  managerCount: 1,
  ...overrides,
});

const makeDivision = (
  id: string,
  overrides: Partial<DivisionSeasonWithTeamsType> = {},
): DivisionSeasonWithTeamsType => ({
  id,
  division: { id: `div-def-${id}`, name: `Division ${id}` },
  priority: 1,
  teams: [],
  totalPlayers: 0,
  totalManagers: 0,
  ...overrides,
});

const makeLeague = (
  id: string,
  overrides: Partial<LeagueSeasonWithDivisionTeamsAndUnassignedType> = {},
): LeagueSeasonWithDivisionTeamsAndUnassignedType => ({
  id,
  league: { id: `league-def-${id}`, name: `League ${id}` },
  divisions: [],
  unassignedTeams: [],
  totalPlayers: 0,
  totalManagers: 0,
  ...overrides,
});

const makeHierarchicalSeason = (
  overrides: Partial<HierarchicalSeason> = {},
): HierarchicalSeason => ({
  id: 'season-1',
  name: 'Test Season',
  leagues: [],
  totalPlayers: 100,
  totalManagers: 20,
  ...overrides,
});

describe('useHierarchicalMaps', () => {
  it('returns empty maps when hierarchicalData is null', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const { result } = renderHook(() => useHierarchicalMaps(null, 'season-1'));

    expect(result.current.parentMap.size).toBe(0);
    expect(result.current.childrenMap.size).toBe(0);
    expect(result.current.itemTypeMap.size).toBe(0);
    expect(result.current.siblingsMap.size).toBe(0);
    expect(result.current.playerCountMap.size).toBe(0);
    expect(result.current.managerCountMap.size).toBe(0);
  });

  it('maps the season node with correct type and counts', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const seasonData = makeHierarchicalSeason({ totalPlayers: 50, totalManagers: 10 });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    expect(result.current.itemTypeMap.get('season-1')).toBe('season');
    expect(result.current.playerCountMap.get('season-1')).toBe(50);
    expect(result.current.managerCountMap.get('season-1')).toBe(10);
  });

  it('maps leagues as children of the season', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const league = makeLeague('lg-1', { totalPlayers: 30, totalManagers: 6 });
    const seasonData = makeHierarchicalSeason({ leagues: [league] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    expect(result.current.itemTypeMap.get('lg-1')).toBe('league');
    expect(result.current.parentMap.get('lg-1')).toBe('season-1');
    expect(result.current.childrenMap.get('season-1')?.has('lg-1')).toBe(true);
    expect(result.current.playerCountMap.get('lg-1')).toBe(30);
    expect(result.current.managerCountMap.get('lg-1')).toBe(6);
  });

  it('maps divisions as children of their league', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const division = makeDivision('div-1', { totalPlayers: 15, totalManagers: 3 });
    const league = makeLeague('lg-1', { divisions: [division] });
    const seasonData = makeHierarchicalSeason({ leagues: [league] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    expect(result.current.itemTypeMap.get('div-1')).toBe('division');
    expect(result.current.parentMap.get('div-1')).toBe('lg-1');
    expect(result.current.childrenMap.get('lg-1')?.has('div-1')).toBe(true);
    expect(result.current.playerCountMap.get('div-1')).toBe(15);
    expect(result.current.managerCountMap.get('div-1')).toBe(3);
  });

  it('maps teams as children of their division', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const team = makeTeam('team-1', { playerCount: 8, managerCount: 2 });
    const division = makeDivision('div-1', { teams: [team] });
    const league = makeLeague('lg-1', { divisions: [division] });
    const seasonData = makeHierarchicalSeason({ leagues: [league] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    expect(result.current.itemTypeMap.get('team-1')).toBe('team');
    expect(result.current.parentMap.get('team-1')).toBe('div-1');
    expect(result.current.childrenMap.get('div-1')?.has('team-1')).toBe(true);
    expect(result.current.playerCountMap.get('team-1')).toBe(8);
    expect(result.current.managerCountMap.get('team-1')).toBe(2);
  });

  it('sets sibling sets for leagues under the same season', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const league1 = makeLeague('lg-1');
    const league2 = makeLeague('lg-2');
    const seasonData = makeHierarchicalSeason({ leagues: [league1, league2] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    const lg1Siblings = result.current.siblingsMap.get('lg-1');
    const lg2Siblings = result.current.siblingsMap.get('lg-2');
    expect(lg1Siblings?.has('lg-1')).toBe(true);
    expect(lg1Siblings?.has('lg-2')).toBe(true);
    expect(lg2Siblings?.has('lg-1')).toBe(true);
    expect(lg2Siblings?.has('lg-2')).toBe(true);
  });

  it('sets sibling sets for teams within the same division', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const team1 = makeTeam('team-1');
    const team2 = makeTeam('team-2');
    const division = makeDivision('div-1', { teams: [team1, team2] });
    const league = makeLeague('lg-1', { divisions: [division] });
    const seasonData = makeHierarchicalSeason({ leagues: [league] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    const team1Siblings = result.current.siblingsMap.get('team-1');
    expect(team1Siblings?.has('team-1')).toBe(true);
    expect(team1Siblings?.has('team-2')).toBe(true);
  });

  it('maps unassigned teams as direct children of their league', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const unassignedTeam = makeTeam('team-u1', { playerCount: 4, managerCount: 1 });
    const league = makeLeague('lg-1', { unassignedTeams: [unassignedTeam] });
    const seasonData = makeHierarchicalSeason({ leagues: [league] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    expect(result.current.itemTypeMap.get('team-u1')).toBe('team');
    expect(result.current.parentMap.get('team-u1')).toBe('lg-1');
    expect(result.current.childrenMap.get('lg-1')?.has('team-u1')).toBe(true);
    expect(result.current.playerCountMap.get('team-u1')).toBe(4);
  });

  it('sets the season siblings map to all league ids', async () => {
    const { useHierarchicalMaps } = await import('../useHierarchicalMaps');
    const league1 = makeLeague('lg-1');
    const league2 = makeLeague('lg-2');
    const seasonData = makeHierarchicalSeason({ leagues: [league1, league2] });

    const { result } = renderHook(() => useHierarchicalMaps(seasonData, 'season-1'));

    const seasonSiblings = result.current.siblingsMap.get('season-1');
    expect(seasonSiblings?.has('lg-1')).toBe(true);
    expect(seasonSiblings?.has('lg-2')).toBe(true);
    expect(seasonSiblings?.size).toBe(2);
  });
});
