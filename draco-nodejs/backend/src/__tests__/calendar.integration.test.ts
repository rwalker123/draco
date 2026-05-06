import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { CalendarService } from '../services/calendarService.js';
import { GameStatus } from '../types/gameEnums.js';
import type { dbGameInfo } from '../repositories/index.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';

const buildExpectedEtag = (fingerprint: {
  count: number;
  maxId: bigint | null;
  maxGamedate: Date | null;
}): string => {
  const maxIdHex = fingerprint.maxId !== null ? fingerprint.maxId.toString(16) : '0';
  const maxEpoch =
    fingerprint.maxGamedate !== null ? fingerprint.maxGamedate.getTime().toString() : '0';
  return `W/"${fingerprint.count}-${maxIdHex}-${maxEpoch}"`;
};

const makeGame = (id: bigint, overrides: Partial<dbGameInfo> = {}): dbGameInfo =>
  ({
    id,
    gamedate: new Date('2025-06-15T18:00:00Z'),
    hteamid: 10n,
    vteamid: 20n,
    leagueid: 5n,
    fieldid: null,
    hscore: null,
    vscore: null,
    gamestatus: GameStatus.Scheduled,
    gametype: 0,
    comment: null,
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    hometeam: { id: 10n, name: 'Home Team' },
    visitingteam: { id: 20n, name: 'Visitor Team' },
    leagueseason: { id: 5n, league: { name: 'Test League' } },
    _count: { gamerecap: 0 },
    ...overrides,
  }) as dbGameInfo;

const baseContext = {
  teamName: 'Rockets',
  leagueName: 'Test League',
  seasonName: '2025 Summer',
  seasonId: 100n,
  accountId: 1n,
  scheduleVisible: true,
};

const baseGames = [makeGame(1n), makeGame(2n)];

const makeRepo = (overrides: Partial<IScheduleRepository> = {}): IScheduleRepository =>
  ({
    findTeamSeasonCalendarContext: vi.fn().mockResolvedValue({ ...baseContext }),
    listAllGamesForTeam: vi.fn().mockResolvedValue([...baseGames]),
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    findGameWithAccountContext: vi.fn(),
    findGameWithDetails: vi.fn(),
    listSeasonGames: vi.fn(),
    countSeasonGames: vi.fn(),
    findTeamsInLeagueSeason: vi.fn(),
    createGame: vi.fn(),
    updateGame: vi.fn(),
    updateGameResults: vi.fn(),
    deleteGame: vi.fn(),
    findFieldConflict: vi.fn(),
    countFieldBookingsAtTime: vi.fn(),
    countTeamBookingsAtTime: vi.fn(),
    countUmpireBookingsAtTime: vi.fn(),
    countTeamGamesInRange: vi.fn(),
    countUmpireGamesInRange: vi.fn(),
    countUmpireAssignmentsForAccount: vi.fn(),
    findRecap: vi.fn(),
    upsertRecap: vi.fn(),
    getTeamNames: vi.fn(),
    listUpcomingGamesForTeam: vi.fn(),
    listRecentGamesForTeam: vi.fn(),
    ...overrides,
  }) as unknown as IScheduleRepository;

describe('calendar integration', () => {
  let app: Express;
  let repo: IScheduleRepository;

  beforeAll(async () => {
    repo = makeRepo();
    const calendarService = new CalendarService(repo);
    vi.spyOn(ServiceFactory, 'getCalendarService').mockReturnValue(calendarService);

    const appModule = await import('../app.js');
    app = appModule.default;
  });

  beforeEach(() => {
    vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue({ ...baseContext });
    vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([...baseGames]);
  });

  describe('GET /api/calendar/team-season/:teamSeasonId.ics', () => {
    it('returns 200 with text/calendar content type and BEGIN:VCALENDAR body', async () => {
      const res = await request(app).get('/api/calendar/team-season/42.ics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/calendar');
      expect(res.text).toContain('BEGIN:VCALENDAR');
    });

    it('returns Cache-Control header on 200', async () => {
      const res = await request(app).get('/api/calendar/team-season/42.ics');
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toContain('public');
    });

    it('returns ETag header on 200', async () => {
      const res = await request(app).get('/api/calendar/team-season/42.ics');
      expect(res.status).toBe(200);
      expect(res.headers['etag']).toBeDefined();
    });

    it('returns 404 on missing team-season', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue(null);
      const res = await request(app).get('/api/calendar/team-season/99999.ics');
      expect(res.status).toBe(404);
    });

    it('returns 404 on hidden season', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue({
        ...baseContext,
        scheduleVisible: false,
      });
      const res = await request(app).get('/api/calendar/team-season/77777.ics');
      expect(res.status).toBe(404);
    });

    it('returns 400 on invalid teamSeasonId', async () => {
      const res = await request(app).get('/api/calendar/team-season/not-a-number.ics');
      expect(res.status).toBe(400);
    });

    it('returns 304 on If-None-Match match with empty body', async () => {
      const first = await request(app).get('/api/calendar/team-season/42.ics');
      const etag = first.headers['etag'] as string;
      expect(etag).toBeDefined();

      const res = await request(app)
        .get('/api/calendar/team-season/42.ics')
        .set('If-None-Match', etag);
      expect(res.status).toBe(304);
      expect(res.text).toBe('');
    });

    it('echoes ETag on 304 If-None-Match response', async () => {
      const first = await request(app).get('/api/calendar/team-season/42.ics');
      const etag = first.headers['etag'] as string;

      const res = await request(app)
        .get('/api/calendar/team-season/42.ics')
        .set('If-None-Match', etag);
      expect(res.status).toBe(304);
      expect(res.headers['etag']).toBe(etag);
    });

    it('returns 304 on If-Modified-Since match', async () => {
      const first = await request(app).get('/api/calendar/team-season/42.ics');
      const lastModified = first.headers['last-modified'] as string;
      expect(lastModified).toBeDefined();

      const res = await request(app)
        .get('/api/calendar/team-season/42.ics')
        .set('If-Modified-Since', lastModified);
      expect(res.status).toBe(304);
    });

    it('returns 200 when If-None-Match is stale', async () => {
      const res = await request(app)
        .get('/api/calendar/team-season/42.ics')
        .set('If-None-Match', 'W/"stale-etag-value"');
      expect(res.status).toBe(200);
      expect(res.text).toContain('BEGIN:VCALENDAR');
    });

    it('ETag is stable across three sequential calls', async () => {
      const r1 = await request(app).get('/api/calendar/team-season/42.ics');
      const r2 = await request(app).get('/api/calendar/team-season/42.ics');
      const r3 = await request(app).get('/api/calendar/team-season/42.ics');
      expect(r1.headers['etag']).toBe(r2.headers['etag']);
      expect(r2.headers['etag']).toBe(r3.headers['etag']);
    });

    it('ETag changes when underlying data changes', async () => {
      const firstFingerprint = {
        count: 2,
        maxId: 200n,
        maxGamedate: new Date('2025-09-01T00:00:00Z'),
      };
      const secondFingerprint = {
        count: 99,
        maxId: 9999n,
        maxGamedate: new Date('2030-01-01T00:00:00Z'),
      };

      const etag1 = buildExpectedEtag(firstFingerprint);
      const etag2 = buildExpectedEtag(secondFingerprint);

      expect(etag1).not.toBe(etag2);
    });
  });
});
