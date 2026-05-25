import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerFieldAvailabilityRulesService } from '../schedulerFieldAvailabilityRulesService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerFieldAvailabilityRulesRepository } from '../../repositories/interfaces/ISchedulerFieldAvailabilityRulesRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IFieldRepository } from '../../repositories/interfaces/IFieldRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerfieldavailabilityrules, availablefields } from '#prisma/client';
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

const makeRule = (
  overrides: Partial<schedulerfieldavailabilityrules> = {},
): schedulerfieldavailabilityrules =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    fieldid: fieldId,
    startdate: null,
    enddate: null,
    daysofweekmask: 62,
    starttimelocal: '09:00',
    endtimelocal: '17:00',
    startincrementminutes: 60,
    enabled: true,
    ...overrides,
  }) as schedulerfieldavailabilityrules;

describe('SchedulerFieldAvailabilityRulesService', () => {
  let rulesRepo: Mocked<ISchedulerFieldAvailabilityRulesRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let fieldRepo: Mocked<IFieldRepository>;
  let service: SchedulerFieldAvailabilityRulesService;

  beforeEach(() => {
    rulesRepo = {
      findById: vi.fn(),
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerFieldAvailabilityRulesRepository>;

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

    vi.spyOn(RepositoryFactory, 'getSchedulerFieldAvailabilityRulesRepository').mockReturnValue(
      rulesRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);
    vi.spyOn(RepositoryFactory, 'getFieldRepository').mockReturnValue(fieldRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    fieldRepo.findAccountField.mockResolvedValue(makeField());

    service = new SchedulerFieldAvailabilityRulesService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRule', () => {
    it('creates and returns the formatted rule', async () => {
      const created = makeRule({ id: 11n });
      rulesRepo.create.mockResolvedValue(created);

      const result = await service.createRule(accountId, seasonId, {
        seasonId: seasonId.toString(),
        fieldId: fieldId.toString(),
        daysOfWeekMask: 62,
        startTimeLocal: '09:00',
        endTimeLocal: '17:00',
        enabled: true,
      });

      expect(rulesRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('11');
      expect(result.fieldId).toBe(fieldId.toString());
    });

    it('throws NotFoundError when field does not belong to this account', async () => {
      fieldRepo.findAccountField.mockResolvedValue(null);

      await expect(
        service.createRule(accountId, seasonId, {
          seasonId: seasonId.toString(),
          fieldId: fieldId.toString(),
          daysOfWeekMask: 62,
          startTimeLocal: '09:00',
          endTimeLocal: '17:00',
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(rulesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    it('deletes and returns the formatted rule', async () => {
      const existing = makeRule({ id: 6n });
      rulesRepo.findForAccount.mockResolvedValue(existing);
      rulesRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteRule(accountId, seasonId, 6n);

      expect(rulesRepo.delete).toHaveBeenCalledWith(6n);
      expect(result.id).toBe('6');
    });

    it('throws NotFoundError when rule belongs to a different account', async () => {
      rulesRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteRule(accountId, seasonId, 6n)).rejects.toThrow(NotFoundError);

      expect(rulesRepo.delete).not.toHaveBeenCalled();
    });

    it('enforces account boundary: rule from another account cannot be deleted', async () => {
      rulesRepo.findForAccount.mockImplementation(async (id, acctId) => {
        if (acctId !== otherAccountId) return null;
        return makeRule({ id, accountid: otherAccountId });
      });

      await expect(service.deleteRule(accountId, seasonId, 6n)).rejects.toThrow(NotFoundError);

      expect(rulesRepo.delete).not.toHaveBeenCalled();
    });
  });
});
