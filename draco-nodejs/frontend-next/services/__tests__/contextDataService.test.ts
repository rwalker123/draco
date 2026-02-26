import { describe, expect, it, beforeEach, vi } from 'vitest';
import { listSeasonLeagueSeasons as apiListLeagueSeasons } from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { ContextDataService } from '../contextDataService';

vi.mock('@draco/shared-api-client', () => ({
  listSeasonLeagueSeasons: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../../utils/leagueSeasonMapper', () => ({
  mapLeagueSetup: vi.fn((data) => data),
}));

const season = {
  id: 'season-1',
  accountId: 'account-1',
  name: 'Spring 2025',
  startDate: '2025-03-01',
  endDate: '2025-06-30',
};

const teamA = {
  id: 'team-season-1',
  name: 'Tigers',
  playerCount: 12,
  managerCount: 2,
};

const teamB = {
  id: 'team-season-2',
  name: 'Lions',
  playerCount: 10,
  managerCount: 1,
};

const unassignedTeam = {
  id: 'team-season-3',
  name: 'Bears',
  playerCount: 8,
  managerCount: 1,
};

const leagueSeasonWithTeams = {
  id: 'league-season-1',
  name: 'Major League',
  divisions: [
    {
      id: 'division-1',
      name: 'Division A',
      teams: [teamA, teamB],
    },
  ],
  unassignedTeams: [unassignedTeam],
};

const apiResponse = {
  season,
  leagueSeasons: [leagueSeasonWithTeams],
};

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, status = 500) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as never;

describe('ContextDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLeaguesAndTeams', () => {
    it('fetches leagues and teams with include flags and returns mapped data', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk(apiResponse));

      const service = new ContextDataService('token-abc');
      const result = await service.fetchLeaguesAndTeams('account-1', 'season-1');

      expect(apiListLeagueSeasons).toHaveBeenCalledWith({
        client: expect.anything(),
        path: { accountId: 'account-1', seasonId: 'season-1' },
        query: { includeTeams: true, includeUnassignedTeams: true },
        signal: undefined,
        throwOnError: false,
      });

      expect(result.season).toEqual(season);
      expect(result.leagueSeasons).toHaveLength(1);
      expect(result.leagueSeasons[0].id).toBe('league-season-1');
    });

    it('passes an AbortSignal to the API call', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk(apiResponse));
      const controller = new AbortController();

      const service = new ContextDataService('token-abc');
      await service.fetchLeaguesAndTeams('account-1', 'season-1', controller.signal);

      expect(apiListLeagueSeasons).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws ApiClientError when the API fails', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeError('Internal Server Error'));

      const service = new ContextDataService('token-abc');
      await expect(service.fetchLeaguesAndTeams('account-1', 'season-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('fetchLeagues', () => {
    it('fetches leagues without include flags and returns league seasons', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk(apiResponse));

      const service = new ContextDataService('token-abc');
      const result = await service.fetchLeagues('account-1', 'season-1');

      expect(apiListLeagueSeasons).toHaveBeenCalledWith({
        client: expect.anything(),
        path: { accountId: 'account-1', seasonId: 'season-1' },
        signal: undefined,
        throwOnError: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('league-season-1');
    });

    it('throws ApiClientError when the API fails', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeError('Unauthorized', 401));

      const service = new ContextDataService('token-abc');
      await expect(service.fetchLeagues('account-1', 'season-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('fetchTeams', () => {
    it('flattens teams from all divisions and unassigned teams', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk(apiResponse));

      const service = new ContextDataService('token-abc');
      const result = await service.fetchTeams('account-1', 'season-1');

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.id)).toEqual(['team-season-1', 'team-season-2', 'team-season-3']);
    });

    it('returns only division teams when there are no unassigned teams', async () => {
      const responseWithoutUnassigned = {
        season,
        leagueSeasons: [{ ...leagueSeasonWithTeams, unassignedTeams: [] }],
      };
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk(responseWithoutUnassigned));

      const service = new ContextDataService('token-abc');
      const result = await service.fetchTeams('account-1', 'season-1');

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['team-season-1', 'team-season-2']);
    });

    it('returns an empty array when there are no leagues', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeOk({ season, leagueSeasons: [] }));

      const service = new ContextDataService('token-abc');
      const result = await service.fetchTeams('account-1', 'season-1');

      expect(result).toEqual([]);
    });

    it('throws ApiClientError when the underlying fetch fails', async () => {
      vi.mocked(apiListLeagueSeasons).mockResolvedValue(makeError('Server Error'));

      const service = new ContextDataService('token-abc');
      await expect(service.fetchTeams('account-1', 'season-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
