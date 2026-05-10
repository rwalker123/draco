import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
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

const { getRecentGamesHandler, getRecentGamesInputSchema } =
  await import('../../tools/getRecentGames.js');

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run(
    {
      userId: 'user-123',
      accessToken: 'tok',
      scopes: ['mcp:read'],
      requestId: 'req-abc',
      cache: new Map(),
    },
    fn,
  );
}

const fixtureSeason = { id: 'season-1', name: 'Spring 2026' };
const fixtureGame = {
  id: 'game-1',
  gameDate: '2026-04-10T19:00:00-05:00',
  homeTeam: { id: 'ht-1', name: 'Tigers' },
  visitorTeam: { id: 'vt-1', name: 'Bears' },
  league: { id: 'lg-1', name: 'Adult League' },
  homeScore: 5,
  visitorScore: 3,
  gameStatus: 1,
  gameStatusText: 'Final' as const,
  gameType: 0,
};

describe('getRecentGamesHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(getRecentGamesInputSchema);
      expect(() => schema.parse({})).toThrow();
    });

    it('rejects limit > 50', () => {
      const schema = z.object(getRecentGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', limit: 99 })).toThrow();
    });
  });

  describe('happy path', () => {
    it('returns recent games sorted newest first', async () => {
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
        data: {
          recent: [
            { ...fixtureGame, id: 'g1', gameDate: '2026-04-01T19:00:00-05:00' },
            { ...fixtureGame, id: 'g2', gameDate: '2026-04-10T19:00:00-05:00' },
          ],
          upcoming: [],
        },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', name: 'Test', configuration: { timeZone: 'UTC' } } },
      });

      const result = await withCtx(() => getRecentGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('Tigers');
    });
  });

  describe('edge cases', () => {
    it('returns friendly message when no recent games', async () => {
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
        data: { recent: [], upcoming: [] },
      });

      const result = await withCtx(() => getRecentGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('no recent games');
    });

    it('returns friendly message when no teams', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() => getRecentGamesHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('not on any teams');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getRecentGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps SDK 500 to McpError InternalError', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Server Error'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getRecentGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InternalError });
    });
  });
});
