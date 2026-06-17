import { describe, it, expect } from 'vitest';
import type { RosterSeasonMembershipListType, TeamSeasonType } from '@draco/shared-schemas';
import type { Team } from '@/types/schedule';
import {
  buildOverallTeamIdSet,
  buildSeasonMembershipIdSet,
  isMyTeam,
  partitionMyTeams,
  pickDefaultTeam,
  type MyTeamMatch,
} from '../teamSelection';

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'ts-1',
  teamId: 'ts-1',
  overallTeamId: 'team-1',
  name: 'Tigers',
  teamName: 'Tigers',
  leagueName: 'MSBL',
  divisionName: 'A',
  ...overrides,
});

const makeUserTeam = (teamSeasonId: string, overallId: string): TeamSeasonType => ({
  id: teamSeasonId,
  team: { id: overallId },
});

const makeMembership = (teamSeasonId: string): RosterSeasonMembershipListType[number] => ({
  teamSeasonId,
  teamName: 'Tigers',
  leagueSeasonId: 'ls-1',
  leagueName: 'MSBL',
  divisionSeasonId: null,
  divisionName: null,
  jerseyNumber: null,
});

const seasonMatch = (seasonTeamIds: string[]): MyTeamMatch => ({
  isAllTime: false,
  overallTeamIds: new Set<string>(),
  seasonTeamIds: new Set(seasonTeamIds),
});

const allTimeMatch = (overallTeamIds: string[]): MyTeamMatch => ({
  isAllTime: true,
  overallTeamIds: new Set(overallTeamIds),
  seasonTeamIds: new Set<string>(),
});

describe('buildOverallTeamIdSet', () => {
  it('extracts the season-agnostic team id from each membership', () => {
    const set = buildOverallTeamIdSet([
      makeUserTeam('ts-9', 'team-9'),
      makeUserTeam('ts-3', 'team-3'),
    ]);
    expect(set).toEqual(new Set(['team-9', 'team-3']));
  });

  it('skips entries missing a team id', () => {
    const set = buildOverallTeamIdSet([
      makeUserTeam('ts-1', 'team-1'),
      { id: 'ts-2', team: { id: '' } },
    ]);
    expect(set).toEqual(new Set(['team-1']));
  });
});

describe('buildSeasonMembershipIdSet', () => {
  it('keys on the season-bound teamSeasonId', () => {
    const set = buildSeasonMembershipIdSet([makeMembership('ts-7'), makeMembership('ts-8')]);
    expect(set).toEqual(new Set(['ts-7', 'ts-8']));
  });
});

describe('isMyTeam', () => {
  it('season mode matches on teamSeasonId, ignoring overallTeamId', () => {
    const team = makeTeam({ teamId: 'ts-5', overallTeamId: 'team-5' });
    expect(isMyTeam(team, seasonMatch(['ts-5']))).toBe(true);
    // overall id present in nothing — proves season mode does not consult overallTeamIds
    expect(isMyTeam(team, seasonMatch(['ts-other']))).toBe(false);
    expect(isMyTeam(team, allTimeMatch(['team-5']))).toBe(true);
  });

  it('all-time mode matches on overallTeamId, ignoring teamSeasonId', () => {
    const team = makeTeam({ teamId: 'ts-5', overallTeamId: 'team-5' });
    // teamSeasonId is in the season set, but all-time mode must ignore it
    expect(
      isMyTeam(team, {
        isAllTime: true,
        overallTeamIds: new Set<string>(),
        seasonTeamIds: new Set(['ts-5']),
      }),
    ).toBe(false);
    expect(isMyTeam(team, allTimeMatch(['team-5']))).toBe(true);
  });

  it('returns false when the team has no matchable id', () => {
    expect(isMyTeam(makeTeam({ teamId: undefined }), seasonMatch(['ts-1']))).toBe(false);
    expect(isMyTeam(makeTeam({ overallTeamId: undefined }), allTimeMatch(['team-1']))).toBe(false);
  });
});

describe('pickDefaultTeam', () => {
  const teams = [
    makeTeam({ teamId: 'ts-1', overallTeamId: 'team-1', teamName: 'Aces' }),
    makeTeam({ teamId: 'ts-2', overallTeamId: 'team-2', teamName: 'Bears' }),
    makeTeam({ teamId: 'ts-3', overallTeamId: 'team-3', teamName: 'Cubs' }),
  ];

  it('prefers the user team in the season over the first team', () => {
    const target = pickDefaultTeam(teams, seasonMatch(['ts-2']));
    expect(target?.teamId).toBe('ts-2');
  });

  it('falls back to the first team when the user has none that season', () => {
    const target = pickDefaultTeam(teams, seasonMatch(['ts-absent']));
    expect(target?.teamId).toBe('ts-1');
  });

  it('picks the first listed team when the user belongs to several', () => {
    const target = pickDefaultTeam(teams, seasonMatch(['ts-2', 'ts-3']));
    expect(target?.teamId).toBe('ts-2');
  });

  it('matches all-time teams by overall id', () => {
    const target = pickDefaultTeam(teams, allTimeMatch(['team-3']));
    expect(target?.teamId).toBe('ts-3');
  });

  it('returns undefined for an empty team list', () => {
    expect(pickDefaultTeam([], seasonMatch(['ts-1']))).toBeUndefined();
  });

  it('does not flag the fallback first team as the user team when none match', () => {
    // Regression guard: historical season where the user was on no team — the
    // first team must be selected but must NOT be treated as "mine".
    const match = seasonMatch(['ts-absent']);
    const target = pickDefaultTeam(teams, match);
    expect(target?.teamId).toBe('ts-1');
    expect(isMyTeam(target as Team, match)).toBe(false);
  });
});

describe('partitionMyTeams', () => {
  const teams = [
    makeTeam({ teamId: 'ts-1', overallTeamId: 'team-1', teamName: 'Aces' }),
    makeTeam({ teamId: 'ts-2', overallTeamId: 'team-2', teamName: 'Bears' }),
    makeTeam({ teamId: 'ts-3', overallTeamId: 'team-3', teamName: 'Cubs' }),
  ];

  it('splits user teams from the rest, preserving input order within each group', () => {
    const { myTeams, otherTeams } = partitionMyTeams(teams, seasonMatch(['ts-3', 'ts-1']));
    expect(myTeams.map((t) => t.teamId)).toEqual(['ts-1', 'ts-3']);
    expect(otherTeams.map((t) => t.teamId)).toEqual(['ts-2']);
  });

  it('returns all teams as others when the user has none', () => {
    const { myTeams, otherTeams } = partitionMyTeams(teams, seasonMatch([]));
    expect(myTeams).toEqual([]);
    expect(otherTeams).toHaveLength(3);
  });
});
