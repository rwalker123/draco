import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getLeaderCategories,
  listBattingStatistics,
  listPitchingStatistics,
  listStatisticalLeaders,
  searchPublicContacts as apiSearchPublicContacts,
  getPlayerCareerStatistics,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import {
  fetchLeaderCategories,
  fetchBattingStatistics,
  fetchPitchingStatistics,
  fetchStatisticalLeaders,
  searchPublicContacts,
  fetchPlayerCareerStatistics,
} from '../statisticsService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  getLeaderCategories: vi.fn(),
  listBattingStatistics: vi.fn(),
  listPitchingStatistics: vi.fn(),
  listStatisticalLeaders: vi.fn(),
  searchPublicContacts: vi.fn(),
  getPlayerCareerStatistics: vi.fn(),
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
    error: { message, statusCode: 400 },
    request: {} as Request,
    response: { status: 400 } as Response,
  }) as never;

describe('statisticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLeaderCategories', () => {
    it('returns leader categories for an account', async () => {
      const categories = { batting: ['AVG', 'HR'], pitching: ['ERA'] };
      vi.mocked(getLeaderCategories).mockResolvedValue(makeOkResult(categories));

      const result = await fetchLeaderCategories('acct-1', { client: mockClient });

      expect(getLeaderCategories).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          path: { accountId: 'acct-1' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(categories);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(getLeaderCategories).mockResolvedValue(makeErrorResult('Not found'));

      await expect(fetchLeaderCategories('acct-1', { client: mockClient })).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('fetchBattingStatistics', () => {
    const battingRow = {
      playerId: 'p-1',
      playerName: 'John Doe',
      teamName: 'Eagles',
      avg: 0.312,
      hr: 15,
      rbi: 50,
    };

    it('returns batting statistics for a league', async () => {
      vi.mocked(listBattingStatistics).mockResolvedValue(makeOkResult([battingRow]));

      const result = await fetchBattingStatistics('acct-1', 'league-1', {}, { client: mockClient });

      expect(listBattingStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          path: { accountId: 'acct-1', leagueId: 'league-1' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual([battingRow]);
    });

    it('converts numeric query params to strings', async () => {
      vi.mocked(listBattingStatistics).mockResolvedValue(makeOkResult([]));

      await fetchBattingStatistics(
        'acct-1',
        'league-1',
        { page: 2, pageSize: 25, minAB: 10 },
        { client: mockClient },
      );

      expect(listBattingStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ page: '2', pageSize: '25', minAB: '10' }),
        }),
      );
    });

    it('strips zero-value division and team ids from the query', async () => {
      vi.mocked(listBattingStatistics).mockResolvedValue(makeOkResult([]));

      await fetchBattingStatistics(
        'acct-1',
        'league-1',
        { divisionId: '0', teamId: '' },
        { client: mockClient },
      );

      expect(listBattingStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ divisionId: undefined, teamId: undefined }),
        }),
      );
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(listBattingStatistics).mockResolvedValue(makeErrorResult('Server error'));

      await expect(
        fetchBattingStatistics('acct-1', 'league-1', {}, { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchPitchingStatistics', () => {
    it('returns pitching statistics for a league', async () => {
      const pitchingRow = { playerId: 'p-2', playerName: 'Jane Smith', era: 2.85 };
      vi.mocked(listPitchingStatistics).mockResolvedValue(makeOkResult([pitchingRow]));

      const result = await fetchPitchingStatistics(
        'acct-1',
        'league-1',
        {},
        { client: mockClient },
      );

      expect(listPitchingStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', leagueId: 'league-1' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual([pitchingRow]);
    });

    it('converts minIP to a string in the query', async () => {
      vi.mocked(listPitchingStatistics).mockResolvedValue(makeOkResult([]));

      await fetchPitchingStatistics('acct-1', 'league-1', { minIP: 20 }, { client: mockClient });

      expect(listPitchingStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ minIP: '20' }),
        }),
      );
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(listPitchingStatistics).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(
        fetchPitchingStatistics('acct-1', 'league-1', {}, { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchStatisticalLeaders', () => {
    it('returns leaders for a given category', async () => {
      const leaders = [{ rank: 1, playerId: 'p-1', value: 0.35 }];
      vi.mocked(listStatisticalLeaders).mockResolvedValue(makeOkResult(leaders));

      const result = await fetchStatisticalLeaders(
        'acct-1',
        'league-1',
        'AVG',
        {},
        { client: mockClient },
      );

      expect(listStatisticalLeaders).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', leagueId: 'league-1' },
          query: expect.objectContaining({ category: 'AVG' }),
          throwOnError: false,
        }),
      );
      expect(result).toEqual(leaders);
    });

    it('converts limit to a string in the query', async () => {
      vi.mocked(listStatisticalLeaders).mockResolvedValue(makeOkResult([]));

      await fetchStatisticalLeaders(
        'acct-1',
        'league-1',
        'HR',
        { limit: 5 },
        { client: mockClient },
      );

      expect(listStatisticalLeaders).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ limit: '5' }),
        }),
      );
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(listStatisticalLeaders).mockResolvedValue(makeErrorResult('Bad request'));

      await expect(
        fetchStatisticalLeaders('acct-1', 'league-1', 'AVG', {}, { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('searchPublicContacts', () => {
    it('returns search results for a query string', async () => {
      const searchResponse = { contacts: [{ id: 'c-1', firstName: 'John', lastName: 'Doe' }] };
      vi.mocked(apiSearchPublicContacts).mockResolvedValue(makeOkResult(searchResponse));

      const result = await searchPublicContacts(
        'acct-1',
        { query: 'John' },
        { client: mockClient },
      );

      expect(apiSearchPublicContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1' },
          query: expect.objectContaining({ query: 'John' }),
          throwOnError: false,
        }),
      );
      expect(result).toEqual(searchResponse);
    });

    it('converts limit to a string in the query', async () => {
      vi.mocked(apiSearchPublicContacts).mockResolvedValue(makeOkResult({ contacts: [] }));

      await searchPublicContacts('acct-1', { query: 'Jane', limit: 10 }, { client: mockClient });

      expect(apiSearchPublicContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ limit: '10' }),
        }),
      );
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiSearchPublicContacts).mockResolvedValue(makeErrorResult('Server error'));

      await expect(
        searchPublicContacts('acct-1', { query: 'x' }, { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchPlayerCareerStatistics', () => {
    it('returns career statistics for a player', async () => {
      const careerStats = {
        playerId: 'p-1',
        seasons: [{ year: 2023, avg: 0.3 }],
      };
      vi.mocked(getPlayerCareerStatistics).mockResolvedValue(makeOkResult(careerStats));

      const result = await fetchPlayerCareerStatistics('acct-1', 'p-1', { client: mockClient });

      expect(getPlayerCareerStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', playerId: 'p-1' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(careerStats);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(getPlayerCareerStatistics).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        fetchPlayerCareerStatistics('acct-1', 'p-1', { client: mockClient }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
