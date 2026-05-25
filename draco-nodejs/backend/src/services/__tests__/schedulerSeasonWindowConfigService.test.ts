import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerSeasonWindowConfigService } from '../schedulerSeasonWindowConfigService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerSeasonConfigRepository } from '../../repositories/interfaces/ISchedulerSeasonConfigRepository.js';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../../repositories/interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerseasonconfig, schedulerseasonleagueselections } from '#prisma/client';
import type { dbSeason, dbSeasonWithLeagues } from '../../repositories/types/dbTypes.js';

const accountId = 10n;
const seasonId = 5n;
const leagueSeasonId = 55n;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeSeasonWithLeagues = (): dbSeasonWithLeagues => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
  leagueseason: [
    {
      id: leagueSeasonId,
      leagueid: 1n,
      league: { id: 1n, name: 'Open' },
    },
  ],
});

const makeConfig = (overrides: Partial<schedulerseasonconfig> = {}): schedulerseasonconfig =>
  ({
    seasonid: seasonId,
    accountid: accountId,
    startdate: new Date('2026-04-01T00:00:00Z'),
    enddate: new Date('2026-08-31T00:00:00Z'),
    umpirespergame: 2,
    maxgamesperumpireperday: null,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerseasonconfig;

const makeLeagueSelection = (): schedulerseasonleagueselections =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    leagueseasonid: leagueSeasonId,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
  }) as schedulerseasonleagueselections;

describe('SchedulerSeasonWindowConfigService', () => {
  let configRepo: Mocked<ISchedulerSeasonConfigRepository>;
  let selectionsRepo: Mocked<ISchedulerSeasonLeagueSelectionsRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let service: SchedulerSeasonWindowConfigService;

  beforeEach(() => {
    configRepo = {
      findForSeason: vi.fn(),
      upsertForSeason: vi.fn(),
    } as Mocked<ISchedulerSeasonConfigRepository>;

    selectionsRepo = {
      listForSeason: vi.fn(),
      replaceForSeason: vi.fn(),
    } as Mocked<ISchedulerSeasonLeagueSelectionsRepository>;

    seasonsRepo = {
      findSeasonById: vi.fn(),
      findAccountSeasons: vi.fn(),
      findSeasonWithLeagues: vi.fn(),
      findSeasonByName: vi.fn(),
      createSeason: vi.fn(),
      updateSeasonName: vi.fn(),
      deleteSeason: vi.fn(),
      findCurrentSeason: vi.fn(),
      upsertCurrentSeason: vi.fn(),
      createLeagueSeason: vi.fn(),
      countSeasonParticipants: vi.fn(),
      findSeasonParticipants: vi.fn(),
      findSeasonForCopy: vi.fn(),
      copySeasonStructure: vi.fn(),
      updateScheduleVisibility: vi.fn(),
    } as Mocked<ISeasonsRepository>;

    vi.spyOn(RepositoryFactory, 'getSchedulerSeasonConfigRepository').mockReturnValue(configRepo);
    vi.spyOn(RepositoryFactory, 'getSchedulerSeasonLeagueSelectionsRepository').mockReturnValue(
      selectionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    seasonsRepo.findSeasonWithLeagues.mockResolvedValue(makeSeasonWithLeagues());

    service = new SchedulerSeasonWindowConfigService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfig', () => {
    it('throws NotFoundError when no config row exists for the season', async () => {
      configRepo.findForSeason.mockResolvedValue(null);

      await expect(service.getConfig(accountId, seasonId)).rejects.toThrow(NotFoundError);
    });

    it('returns the formatted config when a row exists', async () => {
      configRepo.findForSeason.mockResolvedValue(makeConfig());
      selectionsRepo.listForSeason.mockResolvedValue([makeLeagueSelection()]);

      const result = await service.getConfig(accountId, seasonId);

      expect(result.startDate).toBe('2026-04-01');
      expect(result.endDate).toBe('2026-08-31');
      expect(result.umpiresPerGame).toBe(2);
      expect(result.leagueSeasonIds).toEqual([leagueSeasonId.toString()]);
    });
  });

  describe('upsertConfig', () => {
    it('creates a config on first upsert when none exists', async () => {
      configRepo.findForSeason.mockResolvedValue(null);
      const persisted = makeConfig({ umpirespergame: 1 });
      configRepo.upsertForSeason.mockResolvedValue(persisted);
      selectionsRepo.replaceForSeason.mockResolvedValue([makeLeagueSelection()]);

      const result = await service.upsertConfig(accountId, seasonId, {
        seasonId: seasonId.toString(),
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        umpiresPerGame: 1,
        leagueSeasonIds: [leagueSeasonId.toString()],
      });

      expect(configRepo.upsertForSeason).toHaveBeenCalledOnce();
      expect(result.umpiresPerGame).toBe(1);
    });

    it('updates an existing config on subsequent upsert', async () => {
      configRepo.findForSeason.mockResolvedValue(makeConfig({ umpirespergame: 2 }));
      const updated = makeConfig({ umpirespergame: 3 });
      configRepo.upsertForSeason.mockResolvedValue(updated);
      selectionsRepo.replaceForSeason.mockResolvedValue([makeLeagueSelection()]);

      const result = await service.upsertConfig(accountId, seasonId, {
        seasonId: seasonId.toString(),
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        umpiresPerGame: 3,
        leagueSeasonIds: [leagueSeasonId.toString()],
      });

      expect(configRepo.upsertForSeason).toHaveBeenCalledOnce();
      expect(result.umpiresPerGame).toBe(3);
    });

    it('throws NotFoundError when season does not belong to account', async () => {
      seasonsRepo.findSeasonById.mockResolvedValue(null);

      await expect(
        service.upsertConfig(accountId, seasonId, {
          seasonId: seasonId.toString(),
          startDate: '2026-04-01',
          endDate: '2026-08-31',
          umpiresPerGame: 2,
          leagueSeasonIds: [leagueSeasonId.toString()],
        }),
      ).rejects.toThrow(NotFoundError);

      expect(configRepo.upsertForSeason).not.toHaveBeenCalled();
    });
  });
});
