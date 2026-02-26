import { describe, expect, it, vi } from 'vitest';
import {
  transformGamesFromAPI,
  mapGameResponseToScheduleGame,
  convertGameToGameCardData,
} from '../gameTransformers';
import { GameStatus } from '../../types/schedule';

type ApiGame = Parameters<typeof transformGamesFromAPI>[0][number];

vi.mock('../gameUtils', () => ({
  getGameStatusText: (status: number) => {
    const map: Record<number, string> = { 0: 'Incomplete', 1: 'Final', 2: 'Rainout' };
    return map[status] ?? 'Unknown';
  },
  getGameStatusShortText: (status: number) => {
    const map: Record<number, string> = { 0: '', 1: 'F', 2: 'R' };
    return map[status] ?? '';
  },
}));

const makeApiGame = (overrides: Record<string, unknown> = {}): ApiGame =>
  ({
    id: 'g1',
    gameDate: '2024-06-15T14:00:00Z',
    homeTeam: { id: 'ht1', name: 'Home Team' },
    visitorTeam: { id: 'vt1', name: 'Visitor Team' },
    homeScore: 5,
    visitorScore: 3,
    gameStatus: GameStatus.Completed,
    gameStatusText: undefined,
    gameStatusShortText: undefined,
    comment: 'Great game',
    gameType: 0,
    field: undefined,
    league: { id: 'l1', name: 'Main League' },
    season: { id: 's1', name: '2024' },
    hasGameRecap: false,
    ...overrides,
  }) as ApiGame;

describe('transformGamesFromAPI', () => {
  it('transforms an array of API games', () => {
    const games = [makeApiGame(), makeApiGame({ id: 'g2' })];
    const result = transformGamesFromAPI(games);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('g1');
    expect(result[1].id).toBe('g2');
  });

  it('maps basic game properties', () => {
    const [game] = transformGamesFromAPI([makeApiGame()]);
    expect(game.homeTeamId).toBe('ht1');
    expect(game.visitorTeamId).toBe('vt1');
    expect(game.homeTeamName).toBe('Home Team');
    expect(game.visitorTeamName).toBe('Visitor Team');
    expect(game.homeScore).toBe(5);
    expect(game.visitorScore).toBe(3);
    expect(game.gameStatus).toBe(GameStatus.Completed);
    expect(game.leagueName).toBe('Main League');
    expect(game.comment).toBe('Great game');
  });

  it('defaults missing team names to Unknown Team', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ homeTeam: null, visitorTeam: null })]);
    expect(game.homeTeamName).toBe('Unknown Team');
    expect(game.visitorTeamName).toBe('Unknown Team');
  });

  it('defaults missing scores to 0', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ homeScore: null, visitorScore: null })]);
    expect(game.homeScore).toBe(0);
    expect(game.visitorScore).toBe(0);
  });

  it('maps field details when present', () => {
    const [game] = transformGamesFromAPI([
      makeApiGame({
        field: { id: 'f1', name: 'Main Field', shortName: 'MF', address: '123 St' },
      }),
    ]);
    expect(game.fieldId).toBe('f1');
    expect(game.fieldName).toBe('Main Field');
    expect(game.fieldShortName).toBe('MF');
    expect(game.fieldDetails).toBeTruthy();
  });

  it('sets null field details when no field', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ field: null })]);
    expect(game.fieldId).toBeNull();
    expect(game.fieldName).toBeNull();
  });

  it('uses gameStatusText from API when provided', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ gameStatusText: 'Custom Status' })]);
    expect(game.gameStatusText).toBe('Custom Status');
  });

  it('falls back to computed status text when not provided', () => {
    const [game] = transformGamesFromAPI([
      makeApiGame({ gameStatus: GameStatus.Completed, gameStatusText: undefined }),
    ]);
    expect(game.gameStatusText).toBe('Final');
  });

  it('maps recaps when present', () => {
    const [game] = transformGamesFromAPI([
      makeApiGame({
        recaps: [{ team: { id: 'ht1' }, recap: 'Good game' }],
      }),
    ]);
    expect(game.gameRecaps).toHaveLength(1);
    expect(game.gameRecaps[0].teamId).toBe('ht1');
    expect(game.gameRecaps[0].recap).toBe('Good game');
    expect(game.hasGameRecap).toBe(true);
  });

  it('parses gameType as number', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ gameType: '1' })]);
    expect(game.gameType).toBe(1);
  });

  it('handles undefined gameType', () => {
    const [game] = transformGamesFromAPI([makeApiGame({ gameType: undefined })]);
    expect(game.gameType).toBeUndefined();
  });
});

describe('mapGameResponseToScheduleGame', () => {
  it('maps to ScheduleGame format', () => {
    const result = mapGameResponseToScheduleGame(makeApiGame());
    expect(result.id).toBe('g1');
    expect(result.gameDate).toBe('2024-06-15T14:00:00Z');
    expect(result.homeTeamId).toBe('ht1');
    expect(result.league.name).toBe('Main League');
    expect(result.season.name).toBe('2024');
  });

  it('defaults gameStatus to Scheduled', () => {
    const result = mapGameResponseToScheduleGame(makeApiGame({ gameStatus: undefined }));
    expect(result.gameStatus).toBe(GameStatus.Scheduled);
  });

  it('maps field details', () => {
    const result = mapGameResponseToScheduleGame(
      makeApiGame({
        field: {
          id: 'f1',
          name: 'Diamond',
          shortName: 'D',
          address: '1 St',
          city: 'Town',
          state: 'TX',
        },
      }),
    );
    expect(result.field).toBeTruthy();
    expect(result.field!.name).toBe('Diamond');
    expect(result.fieldId).toBe('f1');
  });
});

describe('convertGameToGameCardData', () => {
  it('converts a display Game to GameCardData', () => {
    const game = transformGamesFromAPI([makeApiGame()])[0];
    const result = convertGameToGameCardData(game);
    expect(result.id).toBe('g1');
    expect(result.homeTeamName).toBe('Home Team');
  });

  it('overrides team names from provided teams array', () => {
    const game = transformGamesFromAPI([makeApiGame()])[0];
    const teams = [
      { id: 'ht1', name: 'Override Home' },
      { id: 'vt1', name: 'Override Visitor' },
    ];
    const result = convertGameToGameCardData(game, teams);
    expect(result.homeTeamName).toBe('Override Home');
    expect(result.visitorTeamName).toBe('Override Visitor');
  });

  it('converts a ScheduleGame to GameCardData', () => {
    const scheduleGame = mapGameResponseToScheduleGame(makeApiGame());
    const result = convertGameToGameCardData(scheduleGame);
    expect(result.id).toBe('g1');
    expect(result.date).toBe('2024-06-15T14:00:00Z');
  });

  it('merges field details from fields array', () => {
    const game = transformGamesFromAPI([
      makeApiGame({ field: { id: 'f1', name: 'Diamond', shortName: 'D' } }),
    ])[0];
    const fields = [
      {
        id: 'f1',
        name: 'Diamond Park',
        shortName: 'DP',
        address: '100 Main St',
        city: 'City',
        state: 'ST',
      },
    ];
    const result = convertGameToGameCardData(game, [], fields);
    expect(result.fieldDetails).toBeTruthy();
  });
});
