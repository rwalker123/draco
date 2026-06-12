import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatisticsService } from '../statisticsService.js';
import type {
  IBattingStatisticsRepository,
  IContactRepository,
  ILeagueLeadersDisplayRepository,
  IPitchingStatisticsRepository,
  IScheduleRepository,
} from '../../repositories/interfaces/index.js';
import type { dbGameInfo } from '../../repositories/index.js';
import { GameStatus } from '../../types/gameEnums.js';
import { partialMock, partialPrismaMock } from '../../test-utils/partialMock.js';

const makeRawTeam = (teamId: bigint, overrides: Record<string, unknown> = {}) => ({
  teamName: `Team ${teamId}`,
  teamId,
  leagueId: 5n,
  leagueName: 'Test League',
  divisionId: 7n,
  divisionName: 'East',
  divisionPriority: 1,
  w: 5,
  l: 3,
  t: 0,
  div_w: 2,
  div_l: 1,
  div_t: 0,
  rs: 40,
  ra: 25,
  ...overrides,
});

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

describe('StatisticsService.getStandings', () => {
  let queryRawUnsafe: ReturnType<typeof vi.fn>;
  let scheduleRepository: IScheduleRepository;
  let service: StatisticsService;

  const buildService = () => {
    queryRawUnsafe = vi.fn();
    const prisma = partialPrismaMock({ $queryRawUnsafe: queryRawUnsafe });
    scheduleRepository = partialMock<IScheduleRepository>({
      listScheduledGamesForSeason: vi.fn().mockResolvedValue([]),
    });
    return new StatisticsService(
      prisma,
      partialMock<IBattingStatisticsRepository>({}),
      partialMock<IPitchingStatisticsRepository>({}),
      partialMock<ILeagueLeadersDisplayRepository>({}),
      partialMock<IContactRepository>({}),
      scheduleRepository,
    );
  };

  beforeEach(() => {
    service = buildService();
  });

  it('maps runs scored and runs against onto each standings row', async () => {
    queryRawUnsafe.mockResolvedValue([
      makeRawTeam(10n, { rs: 40, ra: 25 }),
      makeRawTeam(20n, { rs: 18, ra: 33 }),
    ]);

    const standings = await service.getStandings(1n, 100n);

    const team10 = standings.find((t) => t.teamId === 10n);
    const team20 = standings.find((t) => t.teamId === 20n);
    expect(team10).toMatchObject({ rs: 40, ra: 25 });
    expect(team20).toMatchObject({ rs: 18, ra: 33 });
  });

  it('assigns each team its earliest scheduled game from home and away perspectives', async () => {
    queryRawUnsafe.mockResolvedValue([makeRawTeam(10n), makeRawTeam(20n)]);

    // Ordered by date ascending, as the repository returns them.
    (scheduleRepository.listScheduledGamesForSeason as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeGame(100n, {
        gamedate: new Date('2025-07-01T18:00:00Z'),
        hteamid: 10n,
        vteamid: 20n,
        hometeam: { id: 10n, name: 'Team 10' },
        visitingteam: { id: 20n, name: 'Team 20' },
      }),
      makeGame(200n, {
        gamedate: new Date('2025-07-05T18:00:00Z'),
        hteamid: 20n,
        vteamid: 30n,
        hometeam: { id: 20n, name: 'Team 20' },
        visitingteam: { id: 30n, name: 'Team 30' },
      }),
    ]);

    const standings = await service.getStandings(1n, 100n);

    const team10 = standings.find((t) => t.teamId === 10n);
    const team20 = standings.find((t) => t.teamId === 20n);

    expect(team10?.nextGame).toEqual({
      id: '100',
      gameDate: new Date('2025-07-01T18:00:00Z').toISOString(),
      opponentId: '20',
      opponentName: 'Team 20',
      isHome: true,
    });

    // Team 20's earliest game is still game 100 (as the away side), not game 200.
    expect(team20?.nextGame).toEqual({
      id: '100',
      gameDate: new Date('2025-07-01T18:00:00Z').toISOString(),
      opponentId: '10',
      opponentName: 'Team 10',
      isHome: false,
    });
  });

  it('leaves nextGame undefined for teams without an upcoming game', async () => {
    queryRawUnsafe.mockResolvedValue([makeRawTeam(10n), makeRawTeam(99n)]);
    (scheduleRepository.listScheduledGamesForSeason as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeGame(100n, {
        hteamid: 10n,
        vteamid: 20n,
        hometeam: { id: 10n, name: 'Team 10' },
        visitingteam: { id: 20n, name: 'Team 20' },
      }),
    ]);

    const standings = await service.getStandings(1n, 100n);

    expect(standings.find((t) => t.teamId === 10n)?.nextGame).toBeDefined();
    expect(standings.find((t) => t.teamId === 99n)?.nextGame).toBeUndefined();
  });
});
