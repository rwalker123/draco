import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarService } from '../calendarService.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import { GameStatus } from '../../types/gameEnums.js';
import type { dbGameInfo } from '../../repositories/index.js';

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

const makeContext = (
  overrides: Partial<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    seasonId: bigint;
    accountId: bigint;
    scheduleVisible: boolean;
  }> = {},
) => ({
  teamName: 'Rockets',
  leagueName: 'Premier League',
  seasonName: '2025 Summer',
  seasonId: 100n,
  accountId: 1n,
  scheduleVisible: true,
  ...overrides,
});

const makeRepo = (overrides: Partial<IScheduleRepository> = {}): IScheduleRepository =>
  ({
    findTeamSeasonCalendarContext: vi.fn().mockResolvedValue(makeContext()),
    listAllGamesForTeam: vi.fn().mockResolvedValue([makeGame(1n), makeGame(2n), makeGame(3n)]),
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

describe('CalendarService', () => {
  let repo: IScheduleRepository;
  let service: CalendarService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    repo = makeRepo();
    service = new CalendarService(repo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTeamSeasonCalendarFingerprint', () => {
    it('returns null when context lookup returns null', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue(null);
      const result = await service.getTeamSeasonCalendarFingerprint(1n);
      expect(result).toBeNull();
    });

    it('returns null when scheduleVisible is false', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue(
        makeContext({ scheduleVisible: false }),
      );
      const result = await service.getTeamSeasonCalendarFingerprint(1n);
      expect(result).toBeNull();
    });

    it('returns fingerprint with ETag when context is visible', async () => {
      const result = await service.getTeamSeasonCalendarFingerprint(1n);
      expect(result).not.toBeNull();
      expect(result?.etag).toMatch(/^W\//);
    });
  });

  describe('getTeamSeasonCalendar', () => {
    it('returns null when context lookup returns null', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue(null);
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result).toBeNull();
    });

    it('returns null when scheduleVisible is false', async () => {
      vi.mocked(repo.findTeamSeasonCalendarContext).mockResolvedValue(
        makeContext({ scheduleVisible: false }),
      );
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result).toBeNull();
    });

    it('returns a result with body containing BEGIN:VCALENDAR', async () => {
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result).not.toBeNull();
      expect(result?.body).toContain('BEGIN:VCALENDAR');
    });

    it('VEVENT count matches input game count', async () => {
      const result = await service.getTeamSeasonCalendar(1n);
      const veventMatches = result?.body.match(/BEGIN:VEVENT/g);
      expect(veventMatches?.length).toBe(3);
    });

    it('ETag is stable across two consecutive calls when data unchanged', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(30_000);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).toBe(second?.etag);
    });

    it('second call within TTL does not re-query the repo', async () => {
      await service.getTeamSeasonCalendar(1n);
      const callCount = vi.mocked(repo.listAllGamesForTeam).mock.calls.length;
      vi.advanceTimersByTime(30_000);
      await service.getTeamSeasonCalendar(1n);
      expect(vi.mocked(repo.listAllGamesForTeam).mock.calls.length).toBe(callCount);
    });

    it('re-queries the repo after TTL expires', async () => {
      await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      await service.getTeamSeasonCalendar(1n);
      expect(vi.mocked(repo.listAllGamesForTeam).mock.calls.length).toBe(2);
    });

    it('ETag changes when game count changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n),
        makeGame(2n),
        makeGame(3n),
        makeGame(4n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('ETag changes when a game gamedate changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamedate: new Date('2025-07-15T18:00:00Z') }),
        makeGame(2n),
        makeGame(3n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('ETag changes when a game gamestatus changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamestatus: GameStatus.Rainout }),
        makeGame(2n),
        makeGame(3n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('ETag changes when a game fieldid changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { fieldid: 42n }),
        makeGame(2n),
        makeGame(3n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('ETag changes when a game comment changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { comment: 'doubleheader' }),
        makeGame(2n),
        makeGame(3n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('ETag changes when a game team assignment changes', async () => {
      const first = await service.getTeamSeasonCalendar(1n);
      vi.advanceTimersByTime(61_000);
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { hteamid: 99n }),
        makeGame(2n),
        makeGame(3n),
      ]);
      const second = await service.getTeamSeasonCalendar(1n);
      expect(first?.etag).not.toBe(second?.etag);
    });

    it('in-flight dedupe: two concurrent calls trigger only one repo call', async () => {
      vi.useRealTimers();
      repo = makeRepo();
      let resolveContext!: (v: ReturnType<typeof makeContext>) => void;
      const contextPromise = new Promise<ReturnType<typeof makeContext>>(
        (resolve) => (resolveContext = resolve),
      );
      vi.mocked(repo.findTeamSeasonCalendarContext).mockReturnValue(contextPromise);

      service = new CalendarService(repo);

      const p1 = service.getTeamSeasonCalendar(1n);
      const p2 = service.getTeamSeasonCalendar(1n);

      resolveContext(makeContext());

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1?.body).toBe(r2?.body);
      expect(vi.mocked(repo.findTeamSeasonCalendarContext).mock.calls.length).toBe(1);
    });

    it('STATUS:CANCELLED appears for Rainout games', async () => {
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamestatus: GameStatus.Rainout }),
      ]);
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result?.body).toContain('STATUS:CANCELLED');
    });

    it('STATUS:CONFIRMED appears for Scheduled games', async () => {
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamestatus: GameStatus.Scheduled }),
      ]);
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result?.body).toContain('STATUS:CONFIRMED');
    });

    it('STATUS:CANCELLED appears for Postponed games', async () => {
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamestatus: GameStatus.Postponed }),
      ]);
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result?.body).toContain('STATUS:CANCELLED');
    });

    it('STATUS:CONFIRMED appears for Forfeit games', async () => {
      vi.mocked(repo.listAllGamesForTeam).mockResolvedValue([
        makeGame(1n, { gamestatus: GameStatus.Forfeit }),
      ]);
      const result = await service.getTeamSeasonCalendar(1n);
      expect(result?.body).toContain('STATUS:CONFIRMED');
    });
  });
});
