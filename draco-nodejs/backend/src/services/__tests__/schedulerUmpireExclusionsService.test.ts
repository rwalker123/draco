import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerUmpireExclusionsService } from '../schedulerUmpireExclusionsService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerUmpireExclusionsRepository } from '../../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IUmpireRepository } from '../../repositories/interfaces/IUmpireRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerumpireexclusions, leagueumpires } from '#prisma/client';
import type { dbSeason } from '../../repositories/types/dbTypes.js';

const accountId = 10n;
const otherAccountId = 99n;
const seasonId = 5n;
const umpireId = 30n;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeUmpire = (overrides: Partial<leagueumpires> = {}): leagueumpires =>
  ({
    id: umpireId,
    accountid: accountId,
    contactid: 300n,
    ...overrides,
  }) as leagueumpires;

const makeExclusion = (
  overrides: Partial<schedulerumpireexclusions> = {},
): schedulerumpireexclusions =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    umpireid: umpireId,
    starttime: new Date('2026-04-10T00:00:00Z'),
    endtime: new Date('2026-04-11T00:00:00Z'),
    note: null,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerumpireexclusions;

describe('SchedulerUmpireExclusionsService', () => {
  let exclusionsRepo: Mocked<ISchedulerUmpireExclusionsRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let umpireRepo: Mocked<IUmpireRepository>;
  let service: SchedulerUmpireExclusionsService;

  beforeEach(() => {
    exclusionsRepo = {
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerUmpireExclusionsRepository>;

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

    umpireRepo = {
      findById: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findByAccount: vi.fn(),
      findByAccountAndId: vi.fn(),
      findByAccountAndContact: vi.fn(),
      countByAccount: vi.fn(),
    } as Mocked<IUmpireRepository>;

    vi.spyOn(RepositoryFactory, 'getSchedulerUmpireExclusionsRepository').mockReturnValue(
      exclusionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);
    vi.spyOn(RepositoryFactory, 'getUmpireRepository').mockReturnValue(umpireRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    umpireRepo.findById.mockResolvedValue(makeUmpire());

    service = new SchedulerUmpireExclusionsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExclusion', () => {
    it('creates and returns the formatted exclusion', async () => {
      const created = makeExclusion({ id: 9n });
      exclusionsRepo.create.mockResolvedValue(created);

      const result = await service.createExclusion(accountId, seasonId, {
        seasonId: seasonId.toString(),
        umpireId: umpireId.toString(),
        startTime: '2026-04-10T00:00:00Z',
        endTime: '2026-04-11T00:00:00Z',
        enabled: true,
      });

      expect(exclusionsRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('9');
      expect(result.umpireId).toBe(umpireId.toString());
    });

    it('throws NotFoundError when umpire does not belong to this account', async () => {
      umpireRepo.findById.mockResolvedValue(makeUmpire({ accountid: otherAccountId }));

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
          umpireId: umpireId.toString(),
          startTime: '2026-04-10T00:00:00Z',
          endTime: '2026-04-11T00:00:00Z',
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when umpire does not exist', async () => {
      umpireRepo.findById.mockResolvedValue(null);

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
          umpireId: umpireId.toString(),
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
      const existing = makeExclusion({ id: 5n });
      exclusionsRepo.findForAccount.mockResolvedValue(existing);
      exclusionsRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteExclusion(accountId, seasonId, 5n);

      expect(exclusionsRepo.delete).toHaveBeenCalledWith(5n);
      expect(result.id).toBe('5');
    });

    it('enforces account boundary: record from another account cannot be deleted', async () => {
      exclusionsRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteExclusion(accountId, seasonId, 5n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
