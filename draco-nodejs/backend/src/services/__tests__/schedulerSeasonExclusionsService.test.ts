import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerSeasonExclusionsService } from '../schedulerSeasonExclusionsService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerseasonexclusions } from '#prisma/client';
import type { dbSeason } from '../../repositories/types/dbTypes.js';

const accountId = 10n;
const otherAccountId = 99n;
const seasonId = 5n;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeExclusion = (
  overrides: Partial<schedulerseasonexclusions> = {},
): schedulerseasonexclusions =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    starttime: new Date('2026-04-10T00:00:00Z'),
    endtime: new Date('2026-04-11T00:00:00Z'),
    note: null,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerseasonexclusions;

describe('SchedulerSeasonExclusionsService', () => {
  let exclusionsRepo: Mocked<ISchedulerSeasonExclusionsRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let service: SchedulerSeasonExclusionsService;

  beforeEach(() => {
    exclusionsRepo = {
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerSeasonExclusionsRepository>;

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

    vi.spyOn(RepositoryFactory, 'getSchedulerSeasonExclusionsRepository').mockReturnValue(
      exclusionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());

    service = new SchedulerSeasonExclusionsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExclusion', () => {
    it('creates and returns the formatted exclusion', async () => {
      const created = makeExclusion({ id: 7n });
      exclusionsRepo.create.mockResolvedValue(created);

      const result = await service.createExclusion(accountId, seasonId, {
        seasonId: seasonId.toString(),
        startTime: '2026-04-10T00:00:00Z',
        endTime: '2026-04-11T00:00:00Z',
        enabled: true,
      });

      expect(exclusionsRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('7');
      expect(result.seasonId).toBe(seasonId.toString());
    });

    it('throws NotFoundError when season does not exist', async () => {
      seasonsRepo.findSeasonById.mockResolvedValue(null);

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
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
      const existing = makeExclusion({ id: 3n });
      exclusionsRepo.findForAccount.mockResolvedValue(existing);
      exclusionsRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteExclusion(accountId, seasonId, 3n);

      expect(exclusionsRepo.delete).toHaveBeenCalledWith(3n);
      expect(result.id).toBe('3');
    });

    it('throws NotFoundError when exclusion belongs to a different account', async () => {
      exclusionsRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteExclusion(accountId, seasonId, 3n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when exclusion belongs to a different season', async () => {
      const wrongSeason = makeExclusion({ id: 3n, seasonid: 999n });
      exclusionsRepo.findForAccount.mockResolvedValue(wrongSeason);

      await expect(service.deleteExclusion(accountId, seasonId, 3n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });

    it('enforces account boundary: record from another account cannot be deleted', async () => {
      exclusionsRepo.findForAccount.mockImplementation(async (id, acctId) => {
        if (acctId !== otherAccountId) return null;
        return makeExclusion({ id, accountid: otherAccountId });
      });

      await expect(service.deleteExclusion(accountId, seasonId, 3n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
