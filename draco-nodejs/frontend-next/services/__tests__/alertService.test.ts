import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listActiveAlerts,
  listAllAlerts,
  createAlert as apiCreateAlert,
  updateAlert as apiUpdateAlert,
  deleteAlert as apiDeleteAlert,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import {
  fetchActiveAlerts,
  fetchAllAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from '../alertService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  listActiveAlerts: vi.fn(),
  listAllAlerts: vi.fn(),
  createAlert: vi.fn(),
  updateAlert: vi.fn(),
  deleteAlert: vi.fn(),
}));

const mockClient = {} as Client;

const makeOkResult = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeErrorResult = (message: string) =>
  ({
    data: undefined,
    error: { message, statusCode: 500, isRetryable: false },
    request: {} as Request,
    response: { status: 500 } as Response,
  }) as never;

const alertFixture = {
  id: 'alert-1',
  message: 'System maintenance tonight',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const alertListFixture = { alerts: [alertFixture] };

describe('alertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchActiveAlerts', () => {
    it('returns mapped alerts from the active alerts endpoint', async () => {
      vi.mocked(listActiveAlerts).mockResolvedValue(makeOkResult(alertListFixture));

      const result = await fetchActiveAlerts(mockClient);

      expect(listActiveAlerts).toHaveBeenCalledWith({
        client: mockClient,
        throwOnError: false,
        signal: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(alertFixture);
    });

    it('defaults isActive to true when the field is absent', async () => {
      const alertWithoutIsActive = { ...alertFixture, isActive: undefined };
      vi.mocked(listActiveAlerts).mockResolvedValue(
        makeOkResult({ alerts: [alertWithoutIsActive] }),
      );

      const result = await fetchActiveAlerts(mockClient);

      expect(result[0].isActive).toBe(true);
    });

    it('passes the abort signal through to the API call', async () => {
      vi.mocked(listActiveAlerts).mockResolvedValue(makeOkResult(alertListFixture));
      const controller = new AbortController();

      await fetchActiveAlerts(mockClient, controller.signal);

      expect(listActiveAlerts).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws ApiClientError when the API returns an error', async () => {
      vi.mocked(listActiveAlerts).mockResolvedValue(makeErrorResult('Service unavailable'));

      await expect(fetchActiveAlerts(mockClient)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchAllAlerts', () => {
    it('returns all alerts including inactive ones', async () => {
      const inactiveAlert = { ...alertFixture, id: 'alert-2', isActive: false };
      vi.mocked(listAllAlerts).mockResolvedValue(
        makeOkResult({ alerts: [alertFixture, inactiveAlert] }),
      );

      const result = await fetchAllAlerts(mockClient);

      expect(result).toHaveLength(2);
      expect(result[1].isActive).toBe(false);
    });

    it('throws ApiClientError when the API returns an error', async () => {
      vi.mocked(listAllAlerts).mockResolvedValue(makeErrorResult('Unauthorized'));

      await expect(fetchAllAlerts(mockClient)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createAlert', () => {
    it('creates an alert and returns the mapped result', async () => {
      vi.mocked(apiCreateAlert).mockResolvedValue(makeOkResult(alertFixture));

      const payload = { message: 'System maintenance tonight', isActive: true };
      const result = await createAlert(payload, mockClient);

      expect(apiCreateAlert).toHaveBeenCalledWith({
        client: mockClient,
        throwOnError: false,
        body: payload,
      });
      expect(result).toEqual(alertFixture);
    });

    it('throws ApiClientError when creation fails', async () => {
      vi.mocked(apiCreateAlert).mockResolvedValue(makeErrorResult('Validation failed'));

      await expect(createAlert({ message: '', isActive: true }, mockClient)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('updateAlert', () => {
    it('updates an alert by id and returns the updated result', async () => {
      const updated = { ...alertFixture, message: 'Maintenance cancelled' };
      vi.mocked(apiUpdateAlert).mockResolvedValue(makeOkResult(updated));

      const payload = { message: 'Maintenance cancelled', isActive: true };
      const result = await updateAlert('alert-1', payload, mockClient);

      expect(apiUpdateAlert).toHaveBeenCalledWith({
        client: mockClient,
        throwOnError: false,
        path: { alertId: 'alert-1' },
        body: payload,
      });
      expect(result.message).toBe('Maintenance cancelled');
    });

    it('throws ApiClientError when the alert is not found', async () => {
      vi.mocked(apiUpdateAlert).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        updateAlert('missing', { message: 'x', isActive: true }, mockClient),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAlert', () => {
    it('deletes an alert by id without returning a value', async () => {
      vi.mocked(apiDeleteAlert).mockResolvedValue({
        data: null,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(deleteAlert('alert-1', mockClient)).resolves.toBeUndefined();
      expect(apiDeleteAlert).toHaveBeenCalledWith({
        client: mockClient,
        throwOnError: false,
        path: { alertId: 'alert-1' },
      });
    });

    it('throws ApiClientError when deletion fails', async () => {
      vi.mocked(apiDeleteAlert).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(deleteAlert('alert-1', mockClient)).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
