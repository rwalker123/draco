import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerLeagueSeasonExclusionsService } from '../schedulerLeagueSeasonExclusionsService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerLeagueSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerLeagueSeasonExclusionsRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerleagueseasonexclusions } from '#prisma/client';
import type { dbSeason } from '../../repositories/types/dbTypes.js';

const accountId = 10n;
const seasonId = 5n;
const leagueSeasonId = 20n;

vi.mock('../../lib/prisma.js', () => ({
  default: {
    leagueseason: {
      findFirst: vi.fn(),
    },
  },
}));

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeExclusion = (
  overrides: Partial<schedulerleagueseasonexclusions> = {},
): schedulerleagueseasonexclusions =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    leagueseasonid: leagueSeasonId,
    starttime: new Date('2026-04-10T00:00:00Z'),
    endtime: new Date('2026-04-11T00:00:00Z'),
    note: null,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerleagueseasonexclusions;

describe('SchedulerLeagueSeasonExclusionsService', () => {
  let exclusionsRepo: Mocked<ISchedulerLeagueSeasonExclusionsRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let service: SchedulerLeagueSeasonExclusionsService;
  let mockPrisma: { leagueseason: { findFirst: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    const prismaModule = await import('../../lib/prisma.js');
    mockPrisma = prismaModule.default as unknown as typeof mockPrisma;

    exclusionsRepo = {
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerLeagueSeasonExclusionsRepository>;

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

    vi.spyOn(RepositoryFactory, 'getSchedulerLeagueSeasonExclusionsRepository').mockReturnValue(
      exclusionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    mockPrisma.leagueseason.findFirst.mockResolvedValue({
      id: leagueSeasonId,
      seasonid: seasonId,
      leagueid: 1n,
    });

    service = new SchedulerLeagueSeasonExclusionsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExclusion', () => {
    it('creates and returns the formatted exclusion with leagueSeasonId', async () => {
      const created = makeExclusion({ id: 8n });
      exclusionsRepo.create.mockResolvedValue(created);

      const result = await service.createExclusion(accountId, seasonId, {
        seasonId: seasonId.toString(),
        leagueSeasonId: leagueSeasonId.toString(),
        startTime: '2026-04-10T00:00:00Z',
        endTime: '2026-04-11T00:00:00Z',
        enabled: true,
      });

      expect(exclusionsRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('8');
      expect(result.leagueSeasonId).toBe(leagueSeasonId.toString());
    });

    it('throws NotFoundError when leagueSeason does not belong to this account/season', async () => {
      mockPrisma.leagueseason.findFirst.mockResolvedValue(null);

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
          leagueSeasonId: leagueSeasonId.toString(),
          startTime: '2026-04-10T00:00:00Z',
          endTime: '2026-04-11T00:00:00Z',
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteExclusion', () => {
    it('deletes and returns the formatted exclusion', async () => {
      const existing = makeExclusion({ id: 4n });
      exclusionsRepo.findForAccount.mockResolvedValue(existing);
      exclusionsRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteExclusion(accountId, seasonId, 4n);

      expect(exclusionsRepo.delete).toHaveBeenCalledWith(4n);
      expect(result.id).toBe('4');
    });

    it('throws NotFoundError when exclusion is not found for this account', async () => {
      exclusionsRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteExclusion(accountId, seasonId, 4n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
