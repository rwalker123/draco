import { describe, expect, it, beforeEach, vi } from 'vitest';
import { listSeasonManagers as apiListSeasonManagers } from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { createManagerService } from '../managerService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  listSeasonManagers: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({}) as Client),
}));

const makeOkResult = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeErrorResult = (message: string) =>
  ({
    data: undefined,
    error: { message, statusCode: 500 },
    request: {} as Request,
    response: { status: 500 } as Response,
  }) as never;

const managerApiFixture = {
  managers: [
    {
      contact: {
        id: 'c-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        contactDetails: { phone1: '555-1234', phone2: '', phone3: '' },
      },
      hasValidEmail: true,
      allTeams: [{ id: 'ts-1', league: { id: 'ls-1' } }],
    },
    {
      contact: {
        id: 'c-2',
        firstName: '',
        lastName: '',
        email: null,
        contactDetails: null,
      },
      hasValidEmail: false,
      allTeams: [],
    },
  ],
  leagueNames: [{ id: 'ls-1', name: 'Premier League' }],
  teamNames: [{ id: 'ts-1', name: 'Eagles' }],
};

describe('createManagerService', () => {
  let service: ReturnType<typeof createManagerService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createManagerService('token-abc');
  });

  describe('fetchManagers', () => {
    it('returns transformed managers, leagueNames, and teamNames', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      const result = await service.fetchManagers('acct-1', 'season-1');

      expect(apiListSeasonManagers).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', seasonId: 'season-1' },
          throwOnError: false,
        }),
      );
      expect(result.managers).toHaveLength(2);
      expect(result.leagueNames).toEqual({ 'ls-1': 'Premier League' });
      expect(result.teamNames).toEqual({ 'ts-1': 'Eagles' });
    });

    it('maps contact fields to ManagerInfo correctly', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      const { managers } = await service.fetchManagers('acct-1', 'season-1');

      expect(managers[0]).toEqual({
        id: 'c-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone1: '555-1234',
        phone2: '',
        phone3: '',
        allTeams: [{ leagueSeasonId: 'ls-1', teamSeasonId: 'ts-1' }],
        hasValidEmail: true,
      });
    });

    it('falls back to contact id when name segments are empty', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      const { managers } = await service.fetchManagers('acct-1', 'season-1');

      expect(managers[1].name).toBe('c-2');
    });

    it('sets phone fields to empty string when contactDetails is null', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      const { managers } = await service.fetchManagers('acct-1', 'season-1');

      expect(managers[1].phone1).toBe('');
      expect(managers[1].phone2).toBe('');
      expect(managers[1].phone3).toBe('');
    });

    it('throws an error when the API call fails', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeErrorResult('Service unavailable'));

      await expect(service.fetchManagers('acct-1', 'season-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('fetchManagersByLeague', () => {
    it('passes leagueSeasonId query parameter', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      await service.fetchManagersByLeague('acct-1', 'season-1', 'ls-1');

      expect(apiListSeasonManagers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { leagueSeasonId: 'ls-1' },
        }),
      );
    });

    it('throws a meaningful error when the API fails', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.fetchManagersByLeague('acct-1', 'season-1', 'ls-bad'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchManagersByTeam', () => {
    it('passes teamSeasonId query parameter', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      await service.fetchManagersByTeam('acct-1', 'season-1', 'ts-1');

      expect(apiListSeasonManagers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { teamSeasonId: 'ts-1' },
        }),
      );
    });

    it('throws when the API fails', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(
        service.fetchManagersByTeam('acct-1', 'season-1', 'ts-bad'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('searchManagers', () => {
    it('passes the search query parameter', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeOkResult(managerApiFixture));

      await service.searchManagers('acct-1', 'season-1', 'Alice');

      expect(apiListSeasonManagers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { search: 'Alice' },
        }),
      );
    });

    it('throws when the API fails', async () => {
      vi.mocked(apiListSeasonManagers).mockResolvedValue(makeErrorResult('Server error'));

      await expect(service.searchManagers('acct-1', 'season-1', 'xyz')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
