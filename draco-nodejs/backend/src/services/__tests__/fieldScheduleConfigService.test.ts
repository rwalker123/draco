import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { FieldScheduleConfigService } from '../fieldScheduleConfigService.js';
import type { IFieldScheduleConfigRepository } from '../../repositories/interfaces/IFieldScheduleConfigRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { availablefields, fieldopenhours, fieldcloseddates } from '#prisma/client';

const accountId = 10n;
const otherAccountId = 99n;
const fieldId = 42n;

const makeField = (overrides: Partial<availablefields> = {}): availablefields =>
  ({
    id: fieldId,
    accountid: accountId,
    name: 'Riverside Park',
    shortname: 'RP',
    comment: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    directions: '',
    rainoutnumber: '',
    latitude: '',
    longitude: '',
    haslights: false,
    maxparallelgames: 1,
    scheduleenabled: true,
    gamelengthminutes: 90,
    bufferminutes: 15,
    ...overrides,
  }) as availablefields;

const makeOpenHour = (overrides: Partial<fieldopenhours> = {}): fieldopenhours =>
  ({
    id: 1n,
    fieldid: fieldId,
    dayofweek: 0,
    starttimelocal: '09:00',
    endtimelocal: '17:00',
    createdat: new Date('2026-01-01T00:00:00Z'),
    updatedat: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as fieldopenhours;

const makeClosedDate = (overrides: Partial<fieldcloseddates> = {}): fieldcloseddates =>
  ({
    id: 1n,
    fieldid: fieldId,
    closeddate: new Date('2026-07-04T00:00:00Z'),
    note: 'Holiday',
    createdat: new Date('2026-01-01T00:00:00Z'),
    updatedat: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as fieldcloseddates;

describe('FieldScheduleConfigService', () => {
  let repo: Mocked<IFieldScheduleConfigRepository>;
  let service: FieldScheduleConfigService;

  beforeEach(() => {
    repo = {
      findFieldInAccount: vi.fn(),
      getConfigForField: vi.fn(),
      replaceConfigForField: vi.fn(),
      listOpenHoursForAccount: vi.fn(),
      listClosedDatesForAccount: vi.fn(),
    } as Mocked<IFieldScheduleConfigRepository>;

    service = new FieldScheduleConfigService(repo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfig', () => {
    it('throws NotFoundError when field does not belong to account', async () => {
      repo.findFieldInAccount.mockResolvedValue(null);

      await expect(service.getConfig(accountId, fieldId)).rejects.toThrow(NotFoundError);

      expect(repo.getConfigForField).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for a field that belongs to a different account', async () => {
      repo.findFieldInAccount.mockImplementation(async (acctId) => {
        if (acctId === otherAccountId) return makeField({ accountid: otherAccountId });
        return null;
      });

      await expect(service.getConfig(accountId, fieldId)).rejects.toThrow(NotFoundError);
    });

    it('returns correctly mapped config with sorted openHours and closedDates', async () => {
      const field = makeField({ scheduleenabled: true, gamelengthminutes: 90, bufferminutes: 15 });
      const openHours = [
        makeOpenHour({ id: 2n, dayofweek: 2, starttimelocal: '08:00', endtimelocal: '14:00' }),
        makeOpenHour({ id: 1n, dayofweek: 0, starttimelocal: '09:00', endtimelocal: '17:00' }),
      ];
      const closedDates = [
        makeClosedDate({ id: 2n, closeddate: new Date('2026-12-25T00:00:00Z'), note: 'Christmas' }),
        makeClosedDate({
          id: 1n,
          closeddate: new Date('2026-07-04T00:00:00Z'),
          note: 'Fourth of July',
        }),
      ];

      repo.findFieldInAccount.mockResolvedValue(field);
      repo.getConfigForField.mockResolvedValue({ openHours, closedDates });

      const result = await service.getConfig(accountId, fieldId);

      expect(result.fieldId).toBe(fieldId.toString());
      expect(result.scheduleEnabled).toBe(true);
      expect(result.gameLengthMinutes).toBe(90);
      expect(result.bufferMinutes).toBe(15);

      expect(result.openHours).toHaveLength(2);
      expect(result.openHours[0].dayOfWeek).toBe(0);
      expect(result.openHours[0].startTimeLocal).toBe('09:00');
      expect(result.openHours[1].dayOfWeek).toBe(2);
      expect(result.openHours[1].startTimeLocal).toBe('08:00');

      expect(result.closedDates).toHaveLength(2);
      expect(result.closedDates[0].date).toBe('2026-07-04');
      expect(result.closedDates[0].note).toBe('Fourth of July');
      expect(result.closedDates[1].date).toBe('2026-12-25');
    });

    it('returns null for gameLengthMinutes when field has no game length', async () => {
      repo.findFieldInAccount.mockResolvedValue(makeField({ gamelengthminutes: null }));
      repo.getConfigForField.mockResolvedValue({ openHours: [], closedDates: [] });

      const result = await service.getConfig(accountId, fieldId);

      expect(result.gameLengthMinutes).toBeNull();
      expect(result.openHours).toHaveLength(0);
      expect(result.closedDates).toHaveLength(0);
    });
  });

  describe('replaceConfig', () => {
    it('throws NotFoundError when field does not belong to account', async () => {
      repo.findFieldInAccount.mockResolvedValue(null);

      await expect(
        service.replaceConfig(accountId, fieldId, {
          scheduleEnabled: true,
          gameLengthMinutes: 90,
          bufferMinutes: 15,
          openHours: [],
          closedDates: [],
        }),
      ).rejects.toThrow(NotFoundError);

      expect(repo.replaceConfigForField).not.toHaveBeenCalled();
    });

    it('calls replaceConfigForField with correctly-mapped input including null coercions', async () => {
      const field = makeField();
      repo.findFieldInAccount.mockResolvedValue(field);
      repo.replaceConfigForField.mockResolvedValue(undefined);
      repo.getConfigForField.mockResolvedValue({ openHours: [], closedDates: [] });

      await service.replaceConfig(accountId, fieldId, {
        scheduleEnabled: false,
        gameLengthMinutes: undefined,
        bufferMinutes: 0,
        openHours: [{ dayOfWeek: 1, startTimeLocal: '10:00', endTimeLocal: '18:00' }],
        closedDates: [{ date: '2026-07-04', note: undefined }],
      });

      expect(repo.replaceConfigForField).toHaveBeenCalledOnce();
      const callArg = repo.replaceConfigForField.mock.calls[0][1];
      expect(callArg.scheduleEnabled).toBe(false);
      expect(callArg.gameLengthMinutes).toBeNull();
      expect(callArg.bufferMinutes).toBe(0);
      expect(callArg.openHours).toHaveLength(1);
      expect(callArg.openHours[0].dayOfWeek).toBe(1);
      expect(callArg.closedDates).toHaveLength(1);
      expect(callArg.closedDates[0].date).toBe('2026-07-04');
      expect(callArg.closedDates[0].note).toBeNull();
    });

    it('returns reloaded config after replace', async () => {
      const field = makeField({ scheduleenabled: true, gamelengthminutes: 60, bufferminutes: 10 });
      repo.findFieldInAccount.mockResolvedValue(field);
      repo.replaceConfigForField.mockResolvedValue(undefined);
      repo.getConfigForField.mockResolvedValue({
        openHours: [makeOpenHour({ id: 5n, dayofweek: 3 })],
        closedDates: [],
      });

      const result = await service.replaceConfig(accountId, fieldId, {
        scheduleEnabled: true,
        gameLengthMinutes: 60,
        bufferMinutes: 10,
        openHours: [{ dayOfWeek: 3, startTimeLocal: '09:00', endTimeLocal: '15:00' }],
        closedDates: [],
      });

      expect(result.openHours).toHaveLength(1);
      expect(result.openHours[0].id).toBe('5');
      expect(result.openHours[0].dayOfWeek).toBe(3);
    });
  });
});
