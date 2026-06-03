import { describe, it, expect } from 'vitest';

import { ScheduleResponseFormatter } from '../scheduleResponseFormatter.js';
import type { dbScheduleGameWithDetails } from '../../repositories/types/index.js';

const makeGame = (overrides: Partial<dbScheduleGameWithDetails> = {}): dbScheduleGameWithDetails =>
  ({
    id: 1n,
    leagueid: 10n,
    hteamid: 100n,
    vteamid: 200n,
    gamedate: new Date('2025-06-15T19:00:00Z'),
    fieldid: null,
    gamestatus: 1,
    gametype: 0,
    hscore: 3,
    vscore: 2,
    comment: '',
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    leagueseason: {
      id: 10n,
      seasonid: 5n,
      leagueid: 1n,
      league: {
        id: 1n,
        name: 'Summer League',
        accountid: 99n,
        divisiondefs: [],
        scheduler: false,
        sport: 0,
        teamsperleague: 0,
        leaguetype: 0,
        inactive: false,
        teamlimit: 0,
        divisionlimit: 0,
      },
      season: {
        id: 5n,
        name: '2025 Season',
        accountid: 99n,
        schedulevisible: true,
      },
    },
    _count: { gamerecap: 0 },
    ...overrides,
  }) as dbScheduleGameWithDetails;

const teamNames = new Map<string, string>([
  ['100', 'Home Team'],
  ['200', 'Visitor Team'],
]);

describe('ScheduleResponseFormatter.formatGamesList teamsWithStats', () => {
  it('lists both home and visitor team ids when both have stats', () => {
    const statsMap = new Map<string, Set<string>>([['1', new Set(['100', '200'])]]);

    const [game] = ScheduleResponseFormatter.formatGamesList([makeGame()], teamNames, statsMap);

    expect(game.teamsWithStats).toEqual(['100', '200']);
  });

  it('lists only the team that has stats', () => {
    const statsMap = new Map<string, Set<string>>([['1', new Set(['200'])]]);

    const [game] = ScheduleResponseFormatter.formatGamesList([makeGame()], teamNames, statsMap);

    expect(game.teamsWithStats).toEqual(['200']);
  });

  it('ignores team ids in the map that are not part of the game', () => {
    const statsMap = new Map<string, Set<string>>([['1', new Set(['100', '999'])]]);

    const [game] = ScheduleResponseFormatter.formatGamesList([makeGame()], teamNames, statsMap);

    expect(game.teamsWithStats).toEqual(['100']);
  });

  it('returns undefined when the game has no stats entry', () => {
    const statsMap = new Map<string, Set<string>>([['2', new Set(['100'])]]);

    const [game] = ScheduleResponseFormatter.formatGamesList([makeGame()], teamNames, statsMap);

    expect(game.teamsWithStats).toBeUndefined();
  });

  it('returns undefined when no stats map is provided', () => {
    const [game] = ScheduleResponseFormatter.formatGamesList([makeGame()], teamNames);

    expect(game.teamsWithStats).toBeUndefined();
  });
});
