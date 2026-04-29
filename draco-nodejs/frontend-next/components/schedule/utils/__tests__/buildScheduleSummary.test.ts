import { describe, it, expect } from 'vitest';
import { buildScheduleSummary } from '../buildScheduleSummary';
import { GameStatus } from '@/types/schedule';
import type { Game } from '@/types/schedule';

const UTC = 'UTC';

const makeGame = (overrides: Partial<Game> & { gameDate: string }): Game => ({
  id: overrides.id ?? 'g1',
  gameDate: overrides.gameDate,
  homeTeamId: overrides.homeTeamId ?? 'home-team',
  visitorTeamId: overrides.visitorTeamId ?? 'away-team',
  homeScore: overrides.homeScore ?? 0,
  visitorScore: overrides.visitorScore ?? 0,
  comment: overrides.comment ?? '',
  gameStatus: overrides.gameStatus ?? GameStatus.Scheduled,
  gameStatusText: overrides.gameStatusText ?? '',
  gameStatusShortText: overrides.gameStatusShortText ?? '',
  gameType: overrides.gameType ?? 0,
  fieldId: overrides.fieldId,
  field: overrides.field,
  league: overrides.league ?? { id: 'l1', name: 'League' },
  season: overrides.season ?? { id: 's1', name: 'Season' },
});

describe('buildScheduleSummary', () => {
  describe('empty input', () => {
    it('returns zeroed summary for empty game list', () => {
      const result = buildScheduleSummary([], { timeZone: UTC });
      expect(result.totalGames).toBe(0);
      expect(result.totalPlayed).toBe(0);
      expect(result.totalScheduled).toBe(0);
      expect(result.byField).toHaveLength(0);
      expect(result.byStartTime).toHaveLength(0);
      expect(result.byDayType.weekday.played).toBe(0);
      expect(result.byDayType.weekday.scheduled).toBe(0);
      expect(result.byDayType.weekend.played).toBe(0);
      expect(result.byDayType.weekend.scheduled).toBe(0);
    });

    it('does not populate homeAway when teamSeasonId is not set', () => {
      const result = buildScheduleSummary([], { timeZone: UTC });
      expect(result.homeAway).toBeUndefined();
    });
  });

  describe('status classification', () => {
    it('counts Completed, Forfeit, and DidNotReport as played', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T19:00:00Z', gameStatus: GameStatus.Completed }),
        makeGame({ id: 'g2', gameDate: '2024-06-11T19:00:00Z', gameStatus: GameStatus.Forfeit }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.DidNotReport,
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.totalPlayed).toBe(3);
      expect(result.totalScheduled).toBe(0);
      expect(result.totalGames).toBe(3);
    });

    it('counts Scheduled as upcoming (not played)', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T19:00:00Z', gameStatus: GameStatus.Scheduled }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.totalPlayed).toBe(0);
      expect(result.totalScheduled).toBe(1);
      expect(result.totalGames).toBe(1);
    });

    it('excludes Rainout and Postponed from totalGames/played/scheduled but not byField', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T19:00:00Z', gameStatus: GameStatus.Rainout }),
        makeGame({ id: 'g2', gameDate: '2024-06-11T19:00:00Z', gameStatus: GameStatus.Postponed }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.totalGames).toBe(0);
      expect(result.totalPlayed).toBe(0);
      expect(result.totalScheduled).toBe(0);
      expect(result.byStartTime).toHaveLength(0);
      expect(result.byField).toHaveLength(1);
      const field = result.byField[0];
      expect(field.notPlayed).toBe(2);
      expect(field.played).toBe(0);
      expect(field.upcoming).toBe(0);
    });

    it('handles a mix of all statuses correctly', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T19:00:00Z', gameStatus: GameStatus.Completed }),
        makeGame({ id: 'g2', gameDate: '2024-06-11T19:00:00Z', gameStatus: GameStatus.Rainout }),
        makeGame({ id: 'g3', gameDate: '2024-06-12T19:00:00Z', gameStatus: GameStatus.Postponed }),
        makeGame({ id: 'g4', gameDate: '2024-06-13T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g5', gameDate: '2024-06-14T19:00:00Z', gameStatus: GameStatus.Forfeit }),
        makeGame({
          id: 'g6',
          gameDate: '2024-06-15T19:00:00Z',
          gameStatus: GameStatus.DidNotReport,
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.totalPlayed).toBe(3);
      expect(result.totalScheduled).toBe(1);
      expect(result.totalGames).toBe(4);
    });
  });

  describe('field grouping', () => {
    it('Scheduled contributes to the upcoming bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.upcoming).toBe(1);
      expect(field!.played).toBe(0);
      expect(field!.notPlayed).toBe(0);
    });

    it('Completed contributes to the played bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Completed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.played).toBe(1);
      expect(field!.upcoming).toBe(0);
      expect(field!.notPlayed).toBe(0);
    });

    it('DidNotReport contributes to the played bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.DidNotReport,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.played).toBe(1);
      expect(field!.upcoming).toBe(0);
      expect(field!.notPlayed).toBe(0);
    });

    it('Forfeit contributes to the played bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Forfeit,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.played).toBe(1);
      expect(field!.upcoming).toBe(0);
      expect(field!.notPlayed).toBe(0);
    });

    it('Postponed contributes to the notPlayed bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Postponed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.notPlayed).toBe(1);
      expect(field!.upcoming).toBe(0);
      expect(field!.played).toBe(0);
    });

    it('Rainout contributes to the notPlayed bucket', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Rainout,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field!.notPlayed).toBe(1);
      expect(field!.upcoming).toBe(0);
      expect(field!.played).toBe(0);
    });

    it('groups games by field id and uses three-bucket counts', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Completed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f2', name: 'Field B', shortName: 'B', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byField).toHaveLength(2);
      const fieldA = result.byField.find((f) => f.fieldId === 'f1');
      expect(fieldA).toBeDefined();
      expect(fieldA!.upcoming).toBe(1);
      expect(fieldA!.played).toBe(1);
      expect(fieldA!.notPlayed).toBe(0);
    });

    it('uses NO_FIELD key when field is missing', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byField).toHaveLength(1);
      expect(result.byField[0].fieldId).toBeNull();
      expect(result.byField[0].fieldName).toBe('No Field / TBD');
    });

    it('uses fieldId fallback when field object is absent but fieldId is present', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          fieldId: 'f-direct',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byField[0].fieldId).toBe('f-direct');
    });

    it('sorts fields by total games descending (upcoming + played + notPlayed)', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f2', name: 'Field B', shortName: 'B', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Rainout,
          field: { id: 'f2', name: 'Field B', shortName: 'B', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byField[0].fieldId).toBe('f2');
      expect(result.byField[1].fieldId).toBe('f1');
    });

    it('field with more total ranks higher when bucket sums differ', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Completed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Forfeit,
          field: { id: 'f2', name: 'Field B', shortName: 'B', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f2', name: 'Field B', shortName: 'B', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byField[0].fieldId).toBe('f2');
      expect(result.byField[1].fieldId).toBe('f1');
    });

    it('reconciliation: upcoming + played + notPlayed equals total game count for that field', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Completed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Rainout,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g4',
          gameDate: '2024-06-13T19:00:00Z',
          gameStatus: GameStatus.Postponed,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g5',
          gameDate: '2024-06-14T19:00:00Z',
          gameStatus: GameStatus.Forfeit,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
        makeGame({
          id: 'g6',
          gameDate: '2024-06-15T19:00:00Z',
          gameStatus: GameStatus.DidNotReport,
          field: { id: 'f1', name: 'Field A', shortName: 'A', address: '', city: '', state: '' },
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const field = result.byField.find((f) => f.fieldId === 'f1');
      expect(field).toBeDefined();
      expect(field!.upcoming + field!.played + field!.notPlayed).toBe(6);
      const headlineStatuses = new Set([
        GameStatus.Scheduled,
        GameStatus.Completed,
        GameStatus.Forfeit,
        GameStatus.DidNotReport,
      ]);
      const headlineCount = games.filter((g) => headlineStatuses.has(g.gameStatus)).length;
      expect(field!.upcoming + field!.played).toBe(headlineCount);
    });
  });

  describe('weekend vs weekday classification', () => {
    it('classifies Monday–Friday as weekday', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g2', gameDate: '2024-06-11T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g3', gameDate: '2024-06-12T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g4', gameDate: '2024-06-13T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g5', gameDate: '2024-06-14T19:00:00Z', gameStatus: GameStatus.Scheduled }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byDayType.weekday.scheduled).toBe(5);
      expect(result.byDayType.weekend.scheduled).toBe(0);
    });

    it('classifies Saturday and Sunday as weekend', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-15T19:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g2', gameDate: '2024-06-16T19:00:00Z', gameStatus: GameStatus.Scheduled }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.byDayType.weekend.scheduled).toBe(2);
      expect(result.byDayType.weekday.scheduled).toBe(0);
    });
  });

  describe('time bucket classification', () => {
    it('classifies hour < 12 as morning', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T10:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      const morning = result.byStartTime.find((b) => b.bucket === 'morning');
      expect(morning).toBeDefined();
      expect(morning!.scheduled).toBe(1);
    });

    it('classifies hour 12–15 as afternoon', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T14:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      const afternoon = result.byStartTime.find((b) => b.bucket === 'afternoon');
      expect(afternoon).toBeDefined();
      expect(afternoon!.scheduled).toBe(1);
    });

    it('classifies hour 16–18 as earlyEvening', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T17:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      const early = result.byStartTime.find((b) => b.bucket === 'earlyEvening');
      expect(early).toBeDefined();
      expect(early!.scheduled).toBe(1);
    });

    it('classifies hour 19–21 as lateEvening', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T20:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      const late = result.byStartTime.find((b) => b.bucket === 'lateEvening');
      expect(late).toBeDefined();
      expect(late!.scheduled).toBe(1);
    });

    it('classifies hour >= 22 as night', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T22:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      const night = result.byStartTime.find((b) => b.bucket === 'night');
      expect(night).toBeDefined();
      expect(night!.scheduled).toBe(1);
    });

    it('boundary: hour exactly 12 is afternoon not morning', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T12:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      expect(result.byStartTime.find((b) => b.bucket === 'morning')).toBeUndefined();
      const afternoon = result.byStartTime.find((b) => b.bucket === 'afternoon');
      expect(afternoon).toBeDefined();
    });

    it('boundary: hour exactly 16 is earlyEvening not afternoon', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T16:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      expect(result.byStartTime.find((b) => b.bucket === 'afternoon')).toBeUndefined();
      const early = result.byStartTime.find((b) => b.bucket === 'earlyEvening');
      expect(early).toBeDefined();
    });

    it('boundary: hour exactly 19 is lateEvening not earlyEvening', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T19:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      expect(result.byStartTime.find((b) => b.bucket === 'earlyEvening')).toBeUndefined();
      const late = result.byStartTime.find((b) => b.bucket === 'lateEvening');
      expect(late).toBeDefined();
    });

    it('boundary: hour exactly 22 is night not lateEvening', () => {
      const game = makeGame({
        id: 'g1',
        gameDate: '2024-06-10T22:00:00Z',
        gameStatus: GameStatus.Scheduled,
      });
      const result = buildScheduleSummary([game], { timeZone: UTC });
      expect(result.byStartTime.find((b) => b.bucket === 'lateEvening')).toBeUndefined();
      const night = result.byStartTime.find((b) => b.bucket === 'night');
      expect(night).toBeDefined();
    });

    it('returns buckets in canonical order', () => {
      const games = [
        makeGame({ id: 'g1', gameDate: '2024-06-10T22:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g2', gameDate: '2024-06-11T10:00:00Z', gameStatus: GameStatus.Scheduled }),
        makeGame({ id: 'g3', gameDate: '2024-06-12T17:00:00Z', gameStatus: GameStatus.Scheduled }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      const buckets = result.byStartTime.map((b) => b.bucket);
      expect(buckets).toEqual(['morning', 'earlyEvening', 'night']);
    });
  });

  describe('homeAway — Item 2', () => {
    it('is undefined when teamSeasonId is not provided', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Completed,
          homeTeamId: 'team-a',
          visitorTeamId: 'team-b',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC });
      expect(result.homeAway).toBeUndefined();
    });

    it('counts home and away totals when teamSeasonId is provided', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'other',
          visitorTeamId: 'my-team',
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC, teamSeasonId: 'my-team' });
      expect(result.homeAway).toBeDefined();
      expect(result.homeAway!.home).toBe(2);
      expect(result.homeAway!.away).toBe(1);
    });

    it('counts played home and away correctly', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Completed,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Completed,
          homeTeamId: 'other',
          visitorTeamId: 'my-team',
        }),
        makeGame({
          id: 'g4',
          gameDate: '2024-06-13T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'other',
          visitorTeamId: 'my-team',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC, teamSeasonId: 'my-team' });
      expect(result.homeAway!.home).toBe(2);
      expect(result.homeAway!.away).toBe(2);
      expect(result.homeAway!.played.home).toBe(1);
      expect(result.homeAway!.played.away).toBe(1);
    });

    it('excludes Rainout and Postponed from home/away counts', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Rainout,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.Postponed,
          homeTeamId: 'other',
          visitorTeamId: 'my-team',
        }),
        makeGame({
          id: 'g3',
          gameDate: '2024-06-12T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC, teamSeasonId: 'my-team' });
      expect(result.homeAway!.home).toBe(1);
      expect(result.homeAway!.away).toBe(0);
    });

    it('handles team that plays neither side (zeros)', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Scheduled,
          homeTeamId: 'team-x',
          visitorTeamId: 'team-y',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC, teamSeasonId: 'my-team' });
      expect(result.homeAway!.home).toBe(0);
      expect(result.homeAway!.away).toBe(0);
      expect(result.homeAway!.played.home).toBe(0);
      expect(result.homeAway!.played.away).toBe(0);
    });

    it('handles all played statuses for home/away', () => {
      const games = [
        makeGame({
          id: 'g1',
          gameDate: '2024-06-10T19:00:00Z',
          gameStatus: GameStatus.Forfeit,
          homeTeamId: 'my-team',
          visitorTeamId: 'other',
        }),
        makeGame({
          id: 'g2',
          gameDate: '2024-06-11T19:00:00Z',
          gameStatus: GameStatus.DidNotReport,
          homeTeamId: 'other',
          visitorTeamId: 'my-team',
        }),
      ];
      const result = buildScheduleSummary(games, { timeZone: UTC, teamSeasonId: 'my-team' });
      expect(result.homeAway!.played.home).toBe(1);
      expect(result.homeAway!.played.away).toBe(1);
    });
  });
});
