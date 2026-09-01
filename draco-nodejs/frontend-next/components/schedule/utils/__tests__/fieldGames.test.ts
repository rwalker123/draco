import { describe, expect, it } from 'vitest';
import { GameStatus } from '@/types/schedule';
import type { Game } from '@/types/schedule';
import type { FieldSummary } from '../../hooks/useTeamSeasonSummary';
import {
  buildFieldGameRows,
  buildFieldGamesCsv,
  countFieldGroupGames,
  formatFieldGameResult,
  groupGamesByField,
  selectFieldGames,
} from '../fieldGames';

const makeGame = (overrides: Partial<Game> & { id: string; gameDate: string }): Game => ({
  id: overrides.id,
  gameDate: overrides.gameDate,
  homeTeamId: overrides.homeTeamId ?? 'home-team',
  homeTeamName: overrides.homeTeamName ?? 'Home Team',
  visitorTeamId: overrides.visitorTeamId ?? 'visitor-team',
  visitorTeamName: overrides.visitorTeamName ?? 'Visitor Team',
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

const field = (id: string, name: string) => ({
  id,
  name,
  shortName: name,
  address: '',
  city: '',
  state: '',
});

const berkleyLate = makeGame({
  id: 'g1',
  gameDate: '2026-06-15T21:00:00Z',
  field: field('f1', 'Berkley'),
  homeTeamName: 'Marlins',
  visitorTeamName: 'Biscuits',
});

const berkleyEarly = makeGame({
  id: 'g2',
  gameDate: '2026-05-11T21:00:00Z',
  field: field('f1', 'Berkley'),
  homeTeamName: 'White Sox',
  visitorTeamName: 'Dodgers',
});

const hamtramck = makeGame({
  id: 'g3',
  gameDate: '2026-06-01T18:00:00Z',
  field: field('f2', 'Hamtramck'),
  homeTeamName: 'Tigers',
  visitorTeamName: 'Cubs',
  gameStatus: GameStatus.Completed,
  gameStatusText: 'Final',
});

const legacyFieldIdGame = makeGame({
  id: 'g4',
  gameDate: '2026-06-20T18:00:00Z',
  fieldId: 'f1',
  homeTeamName: 'Legacy Home',
  visitorTeamName: 'Legacy Away',
});

const unassigned = makeGame({
  id: 'g5',
  gameDate: '2026-04-01T18:00:00Z',
  homeTeamName: 'TBD Home',
  visitorTeamName: 'TBD Away',
});

const allGames = [berkleyLate, berkleyEarly, hamtramck, legacyFieldIdGame, unassigned];

const summaryFields: FieldSummary[] = [
  { fieldId: null, fieldName: 'No Field / TBD', upcoming: 1, played: 0, notPlayed: 0 },
  { fieldId: 'f1', fieldName: 'Berkley', upcoming: 3, played: 0, notPlayed: 0 },
  { fieldId: 'f2', fieldName: 'Hamtramck', upcoming: 0, played: 1, notPlayed: 0 },
  { fieldId: 'f3', fieldName: 'Flat Rock', upcoming: 0, played: 0, notPlayed: 0 },
];

describe('selectFieldGames', () => {
  it('returns only games at the requested field, sorted by date', () => {
    const games = selectFieldGames(allGames, 'f1');

    expect(games.map((game) => game.id)).toEqual(['g2', 'g1', 'g4']);
  });

  it('matches on the legacy fieldId when the field object is absent', () => {
    expect(selectFieldGames([legacyFieldIdGame], 'f1').map((game) => game.id)).toEqual(['g4']);
  });

  it('returns unassigned games for a null fieldId', () => {
    expect(selectFieldGames(allGames, null).map((game) => game.id)).toEqual(['g5']);
  });

  it('does not mutate the source array', () => {
    const source = [berkleyLate, berkleyEarly];
    selectFieldGames(source, 'f1');

    expect(source.map((game) => game.id)).toEqual(['g1', 'g2']);
  });
});

describe('groupGamesByField', () => {
  it('groups games in summary field order and drops fields with no games', () => {
    const groups = groupGamesByField(allGames, summaryFields);

    expect(groups.map((group) => group.fieldName)).toEqual([
      'No Field / TBD',
      'Berkley',
      'Hamtramck',
    ]);
    expect(groups[1].games.map((game) => game.id)).toEqual(['g2', 'g1', 'g4']);
  });

  it('counts every grouped game', () => {
    expect(countFieldGroupGames(groupGamesByField(allGames, summaryFields))).toBe(5);
  });
});

describe('formatFieldGameResult', () => {
  it('reports Upcoming for scheduled games', () => {
    expect(formatFieldGameResult(berkleyEarly)).toBe('Upcoming');
  });

  it('reports the status text for played games', () => {
    expect(formatFieldGameResult(hamtramck)).toBe('Final');
  });

  it('falls back to an em dash when a played game has no status text', () => {
    const noText = makeGame({
      id: 'g6',
      gameDate: '2026-06-02T18:00:00Z',
      gameStatus: GameStatus.Completed,
      gameStatusText: '',
    });

    expect(formatFieldGameResult(noText)).toBe('—');
  });
});

describe('buildFieldGameRows', () => {
  it('flattens groups into rows carrying the group field name', () => {
    const rows = buildFieldGameRows(groupGamesByField(allGames, summaryFields), 'UTC');

    expect(rows.map((row) => row.fieldName)).toEqual([
      'No Field / TBD',
      'Berkley',
      'Berkley',
      'Berkley',
      'Hamtramck',
    ]);
    expect(rows[1]).toMatchObject({
      gameId: 'g2',
      fieldName: 'Berkley',
      date: 'Mon, May 11, 2026',
      time: '9:00 PM',
      league: 'League',
      matchup: 'White Sox vs Dodgers',
      result: 'Upcoming',
    });
  });

  it('formats dates and times in the supplied time zone', () => {
    const rows = buildFieldGameRows(
      [{ fieldId: 'f1', fieldName: 'Berkley', games: [berkleyEarly] }],
      'America/New_York',
    );

    expect(rows[0]).toMatchObject({ date: 'Mon, May 11, 2026', time: '5:00 PM' });
  });
});

describe('buildFieldGamesCsv', () => {
  it('emits a Field-first header row followed by one row per game, grouped by field', () => {
    const csv = buildFieldGamesCsv(groupGamesByField(allGames, summaryFields), 'UTC');
    const rows = csv.trimEnd().split('\r\n');

    expect(rows[0]).toBe('Field,Date,Time,League,Matchup,Result');
    expect(rows).toHaveLength(6);
    expect(rows[1]).toBe(
      'No Field / TBD,"Wed, Apr 1, 2026",="6:00 PM",League,TBD Home vs TBD Away,Upcoming',
    );
    expect(rows[2]).toBe(
      'Berkley,"Mon, May 11, 2026",="9:00 PM",League,White Sox vs Dodgers,Upcoming',
    );
    expect(rows[5]).toBe('Hamtramck,"Mon, Jun 1, 2026",="6:00 PM",League,Tigers vs Cubs,Final');
  });

  it('pins a league name a spreadsheet would read as a number, such as 18+', () => {
    const ageLeagueGame = makeGame({
      id: 'g7',
      gameDate: '2026-05-11T21:00:00Z',
      field: field('f1', 'Berkley'),
      league: { id: 'l2', name: '18+' },
    });

    const csv = buildFieldGamesCsv(
      [{ fieldId: 'f1', fieldName: 'Berkley', games: [ageLeagueGame] }],
      'UTC',
    );

    expect(csv).toContain('="18+"');
    expect(csv).not.toContain(',18+,');
  });

  it('labels rows with the group field name even when the game has no field object', () => {
    const csv = buildFieldGamesCsv(
      [{ fieldId: 'f1', fieldName: 'Berkley', games: [legacyFieldIdGame] }],
      'UTC',
    );

    expect(csv).toContain(
      'Berkley,"Sat, Jun 20, 2026",="6:00 PM",League,Legacy Home vs Legacy Away,Upcoming',
    );
  });
});
