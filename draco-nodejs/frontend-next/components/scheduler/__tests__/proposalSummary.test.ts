import { describe, expect, it } from 'vitest';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import { GameStatus } from '@/types/schedule';
import { buildScheduleSummary } from '../../schedule/utils/buildScheduleSummary';
import {
  buildMatchupLabel,
  buildProposalScheduleGames,
  buildProposalSummaryGames,
  collectProposalLeagueOptions,
  collectProposalTeamOptions,
} from '../proposalSummary';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];

const matchup = (
  id: string,
  leagueSeasonId: string,
  home: string,
  visitor: string,
): GameRequest => ({ id, leagueSeasonId, homeTeamSeasonId: home, visitorTeamSeasonId: visitor });

const assignment = (gameId: string, fieldId: string, startTime: string): Assignment => ({
  gameId,
  fieldId,
  startTime,
  endTime: startTime,
  umpireIds: [],
});

const gameRequestById = new Map<string, GameRequest>([
  ['g1', matchup('g1', 'L1', 't1', 't2')],
  ['g2', matchup('g2', 'L1', 't1', 't3')],
  ['g3', matchup('g3', 'L2', 't4', 't5')],
]);

const assignments: Assignment[] = [
  assignment('g1', 'f1', '2026-05-03T13:00:00.000Z'),
  assignment('g2', 'f1', '2026-05-04T13:00:00.000Z'),
  assignment('g3', 'f2', '2026-05-05T13:00:00.000Z'),
];

const leagueNameById = new Map([
  ['L1', 'Adult'],
  ['L2', 'Senior'],
]);
const teamNameById = new Map([
  ['t1', 'Aces'],
  ['t2', 'Bats'],
  ['t3', 'Cats'],
  ['t4', 'Dawgs'],
  ['t5', 'Elks'],
]);
const fieldNameById = new Map([
  ['f1', 'Allen Park'],
  ['f2', 'Berkley'],
]);
const fieldShortNameById = new Map([
  ['f1', 'AP'],
  ['f2', 'BK'],
]);

describe('proposalSummary', () => {
  it('collects league options present in the proposal, sorted by name', () => {
    expect(collectProposalLeagueOptions(assignments, gameRequestById, leagueNameById)).toEqual([
      { id: 'L1', name: 'Adult' },
      { id: 'L2', name: 'Senior' },
    ]);
  });

  it('scopes team options to the selected league', () => {
    const all = collectProposalTeamOptions(assignments, gameRequestById, teamNameById, '');
    expect(all.map((o) => o.id).sort()).toEqual(['t1', 't2', 't3', 't4', 't5']);

    const l1 = collectProposalTeamOptions(assignments, gameRequestById, teamNameById, 'L1');
    expect(l1.map((o) => o.id).sort()).toEqual(['t1', 't2', 't3']);
  });

  it('attaches division names to team options when provided', () => {
    const teamDivisionNameById = new Map([
      ['t1', 'East'],
      ['t2', 'West'],
    ]);
    const options = collectProposalTeamOptions(
      assignments,
      gameRequestById,
      teamNameById,
      'L1',
      teamDivisionNameById,
    );
    const byId = new Map(options.map((o) => [o.id, o.divisionName]));
    expect(byId.get('t1')).toBe('East');
    expect(byId.get('t2')).toBe('West');
    expect(byId.get('t3')).toBeUndefined();
  });

  it('builds summary games (all scheduled) with no filter', () => {
    const games = buildProposalSummaryGames(assignments, gameRequestById, fieldNameById, {
      leagueFilter: '',
      teamFilter: '',
    });
    expect(games).toHaveLength(3);
    expect(games.every((g) => g.gameStatus === GameStatus.Scheduled)).toBe(true);
    expect(games[0].field?.name).toBe('Allen Park');

    const summary = buildScheduleSummary(games, { timeZone: 'America/New_York' });
    expect(summary.totalGames).toBe(3);
    expect(summary.totalScheduled).toBe(3);
    expect(summary.totalPlayed).toBe(0);
  });

  it('filters by league', () => {
    const games = buildProposalSummaryGames(assignments, gameRequestById, fieldNameById, {
      leagueFilter: 'L2',
      teamFilter: '',
    });
    expect(games).toHaveLength(1);
    const summary = buildScheduleSummary(games, { timeZone: 'America/New_York' });
    expect(summary.byField.map((f) => f.fieldName)).toEqual(['Berkley']);
  });

  it('labels a present-but-unnamed field as "Field {id}" rather than no-field', () => {
    const games = buildProposalSummaryGames(
      [assignment('g1', 'f9', '2026-05-03T13:00:00.000Z')],
      gameRequestById,
      fieldNameById,
      { leagueFilter: '', teamFilter: '' },
    );
    expect(games[0].field?.name).toBe('Field f9');

    const summary = buildScheduleSummary(games, { timeZone: 'America/New_York' });
    expect(summary.byField.map((f) => f.fieldName)).toEqual(['Field f9']);
  });

  it('filters by team and exposes home/away when a team is selected', () => {
    const games = buildProposalSummaryGames(assignments, gameRequestById, fieldNameById, {
      leagueFilter: 'L1',
      teamFilter: 't1',
    });
    expect(games).toHaveLength(2);
    const summary = buildScheduleSummary(games, {
      timeZone: 'America/New_York',
      teamSeasonId: 't1',
    });
    expect(summary.homeAway).toEqual({ home: 2, away: 0, played: { home: 0, away: 0 } });
  });

  describe('buildMatchupLabel', () => {
    it('formats a known matchup as "[League] Home vs Visitor"', () => {
      expect(buildMatchupLabel('g1', gameRequestById, teamNameById, leagueNameById)).toBe(
        '[Adult] Aces vs Bats',
      );
    });

    it('falls back to "Game {id}" when the matchup is unknown', () => {
      expect(buildMatchupLabel('missing', gameRequestById, teamNameById, leagueNameById)).toBe(
        'Game missing',
      );
    });

    it('omits the league prefix when the league name is unknown', () => {
      const noLeagueName = new Map<string, string>();
      expect(buildMatchupLabel('g1', gameRequestById, teamNameById, noLeagueName)).toBe(
        'Aces vs Bats',
      );
    });
  });

  describe('buildProposalScheduleGames', () => {
    it('maps each assignment to a scheduled ScheduleGame with resolved names', () => {
      const games = buildProposalScheduleGames(
        assignments,
        gameRequestById,
        fieldNameById,
        fieldShortNameById,
        teamNameById,
        leagueNameById,
        'season-1',
        '2026 Season',
      );
      expect(games).toHaveLength(3);

      const first = games[0];
      expect(first.id).toBe('g1');
      expect(first.gameDate).toBe('2026-05-03T13:00:00.000Z');
      expect(first.homeTeamId).toBe('t1');
      expect(first.visitorTeamId).toBe('t2');
      expect(first.homeTeamName).toBe('Aces');
      expect(first.visitorTeamName).toBe('Bats');
      expect(first.gameStatus).toBe(GameStatus.Scheduled);
      expect(first.fieldId).toBe('f1');
      expect(first.field?.name).toBe('Allen Park');
      expect(first.field?.shortName).toBe('AP');
      expect(first.league).toEqual({ id: 'L1', name: 'Adult' });
      expect(first.season).toEqual({ id: 'season-1', name: '2026 Season' });
    });

    it('skips assignments whose matchup is missing', () => {
      const games = buildProposalScheduleGames(
        [assignment('unknown', 'f1', '2026-05-03T13:00:00.000Z'), ...assignments],
        gameRequestById,
        fieldNameById,
        fieldShortNameById,
        teamNameById,
        leagueNameById,
        'season-1',
        '2026 Season',
      );
      expect(games.map((g) => g.id)).toEqual(['g1', 'g2', 'g3']);
    });

    it('labels a present-but-unnamed field as "Field {id}"', () => {
      const games = buildProposalScheduleGames(
        [assignment('g1', 'f9', '2026-05-03T13:00:00.000Z')],
        gameRequestById,
        fieldNameById,
        fieldShortNameById,
        teamNameById,
        leagueNameById,
        'season-1',
        '2026 Season',
      );
      expect(games[0].field?.name).toBe('Field f9');
    });
  });
});
