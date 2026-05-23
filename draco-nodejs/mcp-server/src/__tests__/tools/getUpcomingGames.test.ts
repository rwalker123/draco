import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { requestContext } from '../../auth/perRequestContext.js';

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    MCP_AUDIENCE: 'mcp',
    OAUTH_ISSUER: 'https://test.draco.com',
    MCP_PORT: 3010,
    BACKEND_BASE_URL: 'http://localhost:3001',
    OAUTH_RESOURCE_METADATA_URL: 'http://localhost:3001/.well-known/oauth-protected-resource',
    LOG_LEVEL: 'info',
    NODE_ENV: 'test',
    MCP_RATE_LIMIT_PER_MIN: 60,
    MCP_RATE_LIMIT_PER_HOUR: 600,
  },
}));

const mockGetCurrentSeason = vi.fn();
const mockListMyTeamSeasons = vi.fn();
const mockListTeamSeasonGames = vi.fn();
const mockGetAccountById = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  listMyTeamSeasons: mockListMyTeamSeasons,
  listTeamSeasonGames: mockListTeamSeasonGames,
  getAccountById: mockGetAccountById,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getUpcomingGamesHandler, getUpcomingGamesInputSchema } =
  await import('../../tools/getUpcomingGames.js');

const fixtureCtx = {
  userId: 'user-123',
  accessToken: 'tok',
  scopes: ['mcp:read'],
  requestId: 'req-abc',
  cache: new Map(),
};

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run({ ...fixtureCtx, cache: new Map() }, fn);
}

const fixtureSeason = { id: 'season-1', name: 'Spring 2026' };
const fixtureGame = {
  id: 'game-1',
  gameDate: '2026-05-15T19:00:00-05:00',
  homeTeam: { id: 'ht-1', name: 'Tigers' },
  visitorTeam: { id: 'vt-1', name: 'Bears' },
  league: { id: 'lg-1', name: 'Adult League' },
  field: { id: 'f-1', name: 'North Field', shortName: 'NF' },
  homeScore: 0,
  visitorScore: 0,
  gameStatus: 0,
  gameStatusText: 'Scheduled' as const,
  gameType: 0,
};

describe('getUpcomingGamesHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(getUpcomingGamesInputSchema);
      expect(() => schema.parse({})).toThrow();
    });

    it('accepts account_id alone', () => {
      const schema = z.object(getUpcomingGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).not.toThrow();
    });

    it('rejects limit > 50', () => {
      const schema = z.object(getUpcomingGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', limit: 51 })).toThrow();
    });

    it('accepts optional team_season_id and limit', () => {
      const schema = z.object(getUpcomingGamesInputSchema);
      expect(() =>
        schema.parse({ account_id: 'acc-1', team_season_id: 'ts-1', limit: 10 }),
      ).not.toThrow();
    });
  });

  describe('happy path — multiple teams', () => {
    it('fans out to each team and returns sorted upcoming games', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({
        data: [
          {
            teamSeasonId: 'ts-1',
            teamName: 'Tigers',
            leagueSeasonId: 'ls-1',
            leagueName: 'A',
            divisionSeasonId: null,
            divisionName: null,
            jerseyNumber: null,
          },
          {
            teamSeasonId: 'ts-2',
            teamName: 'Bears',
            leagueSeasonId: 'ls-1',
            leagueName: 'A',
            divisionSeasonId: null,
            divisionName: null,
            jerseyNumber: null,
          },
        ],
      });
      mockListTeamSeasonGames
        .mockResolvedValueOnce({
          data: {
            upcoming: [{ ...fixtureGame, gameDate: '2026-05-20T19:00:00-05:00' }],
            recent: [],
          },
        })
        .mockResolvedValueOnce({
          data: {
            upcoming: [{ ...fixtureGame, id: 'game-2', gameDate: '2026-05-15T19:00:00-05:00' }],
            recent: [],
          },
        });
      mockGetAccountById.mockResolvedValueOnce({
        data: {
          account: { id: 'acc-1', name: 'Test', configuration: { timeZone: 'America/Chicago' } },
        },
      });

      const result = await withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(mockListTeamSeasonGames).toHaveBeenCalledTimes(2);
      expect(text).toContain('Tigers');
      expect(text).toContain('Bears');
    });
  });

  describe('single team_season_id', () => {
    it('uses provided team_season_id directly', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonGames.mockResolvedValueOnce({
        data: { upcoming: [fixtureGame], recent: [] },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', name: 'Test', configuration: { timeZone: 'UTC' } } },
      });

      await withCtx(() =>
        getUpcomingGamesHandler({ account_id: 'acc-1', team_season_id: 'ts-99' }),
      );

      expect(mockListMyTeamSeasons).not.toHaveBeenCalled();
      expect(mockListTeamSeasonGames).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.objectContaining({ teamSeasonId: 'ts-99' }) }),
      );
    });
  });

  describe('edge cases', () => {
    it('returns friendly message when user has no teams', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('not on any teams');
    });

    it('returns friendly message when no upcoming games', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({
        data: [
          {
            teamSeasonId: 'ts-1',
            teamName: 'Tigers',
            leagueSeasonId: 'ls-1',
            leagueName: 'A',
            divisionSeasonId: null,
            divisionName: null,
            jerseyNumber: null,
          },
        ],
      });
      mockListTeamSeasonGames.mockResolvedValueOnce({
        data: { upcoming: [], recent: [] },
      });

      const result = await withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('no upcoming games');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps SDK 404 to McpError InvalidParams', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });

    it('logs error status on failure', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getUpcomingGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool: 'get_upcoming_games',
          accountId: 'acc-1',
        }),
      );
    });
  });
});
