import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { CalendarService } from '../services/calendarService.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GameStatus } from '../types/gameEnums.js';
import type { dbGameInfo } from '../repositories/index.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import { partialMock } from '../test-utils/partialMock.js';

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

const makeRepo = () =>
  partialMock<IScheduleRepository>({
    findTeamSeasonCalendarContext: vi.fn().mockResolvedValue({ ...baseContext }),
    listAllGamesForTeam: vi.fn().mockResolvedValue([...baseGames]),
  });

describe('calendar integration', () => {
  let app: Express;
  let repo: ReturnType<typeof makeRepo>;

  beforeAll(async () => {
    repo = makeRepo();
    vi.spyOn(RepositoryFactory, 'getScheduleRepository').mockReturnValue(repo);
    vi.spyOn(ServiceFactory, 'getCalendarService').mockReturnValue(new CalendarService());

    const appModule = await import('../app.js');
    app = appModule.default;
  });

  beforeEach(() => {
    repo.findTeamSeasonCalendarContext.mockResolvedValue({ ...baseContext });
    repo.listAllGamesForTeam.mockResolvedValue([...baseGames]);
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
      repo.findTeamSeasonCalendarContext.mockResolvedValue(null);
      const res = await request(app).get('/api/calendar/team-season/99999.ics');
      expect(res.status).toBe(404);
    });

    it('returns 404 on hidden season', async () => {
      repo.findTeamSeasonCalendarContext.mockResolvedValue({
        ...baseContext,
        scheduleVisible: false,
      });
      const res = await request(app).get('/api/calendar/team-season/77777.ics');
      expect(res.status).toBe(404);
    });

    it('hidden season takes effect on the next request even after a prior visible response', async () => {
      const firstId = '88888';
      const initial = await request(app).get(`/api/calendar/team-season/${firstId}.ics`);
      expect(initial.status).toBe(200);

      repo.findTeamSeasonCalendarContext.mockResolvedValue({
        ...baseContext,
        scheduleVisible: false,
      });

      const second = await request(app).get(`/api/calendar/team-season/${firstId}.ics`);
      expect(second.status).toBe(404);
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

    it('returns 304 on If-None-Match wildcard when feed exists', async () => {
      const res = await request(app)
        .get('/api/calendar/team-season/42.ics')
        .set('If-None-Match', '*');
      expect(res.status).toBe(304);
      expect(res.text).toBe('');
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
  });
});
