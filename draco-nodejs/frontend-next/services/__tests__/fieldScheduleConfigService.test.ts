import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getFieldScheduleConfig as apiGetConfig,
  replaceFieldScheduleConfig as apiReplaceConfig,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { FieldScheduleConfigService } from '../fieldScheduleConfigService';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { FieldScheduleConfigType, FieldScheduleConfigUpsertType } from '@draco/shared-schemas';

vi.mock('@draco/shared-api-client', () => ({
  getFieldScheduleConfig: vi.fn(),
  replaceFieldScheduleConfig: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

const ACCOUNT_ID = 'account-1';
const FIELD_ID = 'field-42';

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, status = 400) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as never;

const makeConfig = (overrides: Partial<FieldScheduleConfigType> = {}): FieldScheduleConfigType => ({
  fieldId: FIELD_ID,
  scheduleEnabled: true,
  gameLengthMinutes: 120,
  bufferMinutes: 15,
  openHours: [
    { id: 'oh-1', dayOfWeek: 0, startTimeLocal: '09:00', endTimeLocal: '21:00' },
    { id: 'oh-2', dayOfWeek: 5, startTimeLocal: '08:00', endTimeLocal: '20:00' },
  ],
  closedDates: [{ id: 'cd-1', date: '2026-07-04', note: 'Independence Day' }],
  ...overrides,
});

describe('FieldScheduleConfigService', () => {
  let service: FieldScheduleConfigService;
  let client: Client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {} as Client;
    service = new FieldScheduleConfigService(undefined, client);
  });

  describe('getFieldScheduleConfig', () => {
    it('fetches and returns the config for a field', async () => {
      const config = makeConfig();
      vi.mocked(apiGetConfig).mockResolvedValue(makeOk(config));

      const result = await service.getFieldScheduleConfig(ACCOUNT_ID, FIELD_ID);

      expect(apiGetConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, fieldId: FIELD_ID },
        signal: undefined,
        throwOnError: false,
      });
      expect(result).toEqual(config);
    });

    it('passes the AbortSignal through to the API call', async () => {
      const config = makeConfig();
      vi.mocked(apiGetConfig).mockResolvedValue(makeOk(config));

      const controller = new AbortController();
      await service.getFieldScheduleConfig(ACCOUNT_ID, FIELD_ID, controller.signal);

      expect(apiGetConfig).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiGetConfig).mockResolvedValue(makeError('Not found', 404));

      await expect(service.getFieldScheduleConfig(ACCOUNT_ID, FIELD_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('replaceFieldScheduleConfig', () => {
    const upsert: FieldScheduleConfigUpsertType = {
      scheduleEnabled: true,
      gameLengthMinutes: 90,
      bufferMinutes: 20,
      openHours: [{ dayOfWeek: 1, startTimeLocal: '10:00', endTimeLocal: '18:00' }],
      closedDates: [],
    };

    it('sends the full replacement body and returns the updated config', async () => {
      const updated = makeConfig({ gameLengthMinutes: 90, bufferMinutes: 20 });
      vi.mocked(apiReplaceConfig).mockResolvedValue(makeOk(updated));

      const result = await service.replaceFieldScheduleConfig(ACCOUNT_ID, FIELD_ID, upsert);

      expect(apiReplaceConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, fieldId: FIELD_ID },
        body: upsert,
        signal: undefined,
        throwOnError: false,
      });
      expect(result.gameLengthMinutes).toBe(90);
      expect(result.bufferMinutes).toBe(20);
    });

    it('passes the AbortSignal through to the API call', async () => {
      const updated = makeConfig();
      vi.mocked(apiReplaceConfig).mockResolvedValue(makeOk(updated));

      const controller = new AbortController();
      await service.replaceFieldScheduleConfig(ACCOUNT_ID, FIELD_ID, upsert, controller.signal);

      expect(apiReplaceConfig).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiReplaceConfig).mockResolvedValue(makeError('Validation error', 422));

      await expect(
        service.replaceFieldScheduleConfig(ACCOUNT_ID, FIELD_ID, upsert),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
