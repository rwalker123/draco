import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerFieldExclusionDatesService } from '../schedulerFieldExclusionDatesService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerFieldExclusionDatesRepository } from '../../repositories/interfaces/ISchedulerFieldExclusionDatesRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IFieldRepository } from '../../repositories/interfaces/IFieldRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerfieldexclusiondates, availablefields } from '#prisma/client';
import type { dbSeason } from '../../repositories/types/dbTypes.js';
import { DEFAULT_FIELD_START_INCREMENT_MINUTES } from '../../constants/fieldConstants.js';

const accountId = 10n;
const otherAccountId = 99n;
const seasonId = 5n;
const fieldId = 100n;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeField = (): availablefields =>
  ({
    id: fieldId,
    accountid: accountId,
    name: 'Field 1',
    shortname: 'F1',
    comment: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    directions: '',
    rainoutnumber: '',
    latitude: '',
    longitude: '',
    haslights: true,
    maxparallelgames: 1,
    schedulerstartincrementminutes: DEFAULT_FIELD_START_INCREMENT_MINUTES,
  }) as availablefields;

const makeExclusionDate = (
  overrides: Partial<schedulerfieldexclusiondates> = {},
): schedulerfieldexclusiondates =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    fieldid: fieldId,
    exclusiondate: new Date('2026-04-15'),
    note: null,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerfieldexclusiondates;

describe('SchedulerFieldExclusionDatesService', () => {
  let exclusionsRepo: Mocked<ISchedulerFieldExclusionDatesRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let fieldRepo: Mocked<IFieldRepository>;
  let service: SchedulerFieldExclusionDatesService;

  beforeEach(() => {
    exclusionsRepo = {
      findById: vi.fn(),
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerFieldExclusionDatesRepository>;

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

    fieldRepo = {
      findAccountField: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findByAccount: vi.fn(),
      countByAccount: vi.fn(),
      findByName: vi.fn(),
      findByNameExcludingId: vi.fn(),
      isFieldInUse: vi.fn(),
    } as Mocked<IFieldRepository>;

    vi.spyOn(RepositoryFactory, 'getSchedulerFieldExclusionDatesRepository').mockReturnValue(
      exclusionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);
    vi.spyOn(RepositoryFactory, 'getFieldRepository').mockReturnValue(fieldRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    fieldRepo.findAccountField.mockResolvedValue(makeField());

    service = new SchedulerFieldExclusionDatesService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExclusion', () => {
    it('creates and returns the formatted exclusion date', async () => {
      const created = makeExclusionDate({ id: 12n });
      exclusionsRepo.create.mockResolvedValue(created);

      const result = await service.createExclusion(accountId, seasonId, {
        seasonId: seasonId.toString(),
        fieldId: fieldId.toString(),
        date: '2026-04-15',
        enabled: true,
      });

      expect(exclusionsRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('12');
      expect(result.fieldId).toBe(fieldId.toString());
    });

    it('throws NotFoundError when field does not belong to this account', async () => {
      fieldRepo.findAccountField.mockResolvedValue(null);

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
          fieldId: fieldId.toString(),
          date: '2026-04-15',
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteExclusion', () => {
    it('deletes and returns the formatted exclusion date', async () => {
      const existing = makeExclusionDate({ id: 7n });
      exclusionsRepo.findForAccount.mockResolvedValue(existing);
      exclusionsRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteExclusion(accountId, seasonId, 7n);

      expect(exclusionsRepo.delete).toHaveBeenCalledWith(7n);
      expect(result.id).toBe('7');
    });

    it('throws NotFoundError when exclusion belongs to a different account', async () => {
      exclusionsRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteExclusion(accountId, seasonId, 7n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });

    it('enforces account boundary: exclusion from another account cannot be deleted', async () => {
      exclusionsRepo.findForAccount.mockImplementation(async (id, acctId) => {
        if (acctId !== otherAccountId) return null;
        return makeExclusionDate({ id, accountid: otherAccountId });
      });

      await expect(service.deleteExclusion(accountId, seasonId, 7n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
