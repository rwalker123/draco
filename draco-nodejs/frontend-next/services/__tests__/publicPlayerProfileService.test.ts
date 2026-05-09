import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getAccountPlayerPublicProfile } from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { fetchPublicPlayerProfile } from '../publicPlayerProfileService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  getAccountPlayerPublicProfile: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({}) as Client),
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
    error: { message, statusCode: 404 },
    request: {} as Request,
    response: { status: 404 } as Response,
  }) as never;

describe('publicPlayerProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPublicPlayerProfile', () => {
    it('forwards accountId, contactId, signal, and provided client to the OpenAPI op and returns its data', async () => {
      const profile = {
        contact: { id: 'c-1', firstName: 'Jane', lastName: 'Smith', photoUrl: undefined },
        currentSeason: { id: 's-1', name: '2026' },
        teams: [],
        hasCareerStatistics: false,
      };
      vi.mocked(getAccountPlayerPublicProfile).mockResolvedValue(makeOkResult(profile));
      const controller = new AbortController();

      const result = await fetchPublicPlayerProfile('acct-1', 'c-1', {
        client: mockClient,
        signal: controller.signal,
      });

      expect(getAccountPlayerPublicProfile).toHaveBeenCalledTimes(1);
      expect(getAccountPlayerPublicProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          path: { accountId: 'acct-1', contactId: 'c-1' },
          signal: controller.signal,
          throwOnError: false,
        }),
      );
      expect(result).toEqual(profile);
    });

    it('throws ApiClientError when the API returns an error result', async () => {
      vi.mocked(getAccountPlayerPublicProfile).mockResolvedValue(
        makeErrorResult('Contact not found'),
      );

      await expect(
        fetchPublicPlayerProfile('acct-1', 'c-1', { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
