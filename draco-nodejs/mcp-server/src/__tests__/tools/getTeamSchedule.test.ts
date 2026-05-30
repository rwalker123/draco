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
const mockListTeamSeasonSchedule = vi.fn();
const mockGetAccountById = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  listTeamSeasonSchedule: mockListTeamSeasonSchedule,
  getAccountById: mockGetAccountById,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getTeamScheduleHandler, getTeamScheduleInputSchema } =
  await import('../../tools/getTeamSchedule.js');

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
  gameDate: '2026-05-10T19:00:00-05:00',
  homeTeam: { id: 'ht-1', name: 'Tigers' },
  visitorTeam: { id: 'vt-1', name: 'Bears' },
  league: { id: 'lg-1', name: 'Adult League' },
  homeScore: 0,
  visitorScore: 0,
  gameStatus: 0,
  gameType: 0,
};

describe('getTeamScheduleHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id and team_season_id', () => {
      const schema = z.object(getTeamScheduleInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).toThrow();
    });

    it('accepts date range', () => {
      const schema = z.object(getTeamScheduleInputSchema);
      expect(() =>
        schema.parse({
          account_id: 'acc-1',
          team_season_id: 'ts-1',
          from: '2026-05-01',
          to: '2026-06-30',
        }),
      ).not.toThrow();
    });
  });

  describe('happy path', () => {
    it('resolves season and returns schedule', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonSchedule.mockResolvedValueOnce({
        data: { games: [fixtureGame], pagination: { page: 1, limit: 100, total: 1 } },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: {
          account: { id: 'acc-1', name: 'Test', configuration: { timeZone: 'America/New_York' } },
        },
      });

      const result = await withCtx(() =>
        getTeamScheduleHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('Tigers');
      expect(text).toContain('Bears');
    });

    it('passes date range filters to SDK', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonSchedule.mockResolvedValueOnce({
        data: { games: [fixtureGame], pagination: { page: 1, limit: 100, total: 1 } },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', name: 'Test', configuration: { timeZone: 'UTC' } } },
      });

      await withCtx(() =>
        getTeamScheduleHandler({
          account_id: 'acc-1',
          team_season_id: 'ts-1',
          from: '2026-05-01',
          to: '2026-05-31',
        }),
      );

      expect(mockListTeamSeasonSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            startDate: '2026-04-30T00:00:00.000Z',
            endDate: '2026-06-01T23:59:59.999Z',
          }),
        }),
      );
    });

    it('filters on local date so a Friday-night ET game survives to=that Friday', async () => {
      // Fri 2026-05-29 8:15 PM ET == 2026-05-30 00:15 UTC (next UTC day).
      const fridayNightGame = {
        ...fixtureGame,
        id: 'fri-night',
        gameDate: '2026-05-30T00:15:00.000Z',
      };
      const saturdayGame = {
        ...fixtureGame,
        id: 'sat',
        gameDate: '2026-05-30T18:00:00.000Z',
      };

      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonSchedule.mockResolvedValueOnce({
        data: {
          games: [fridayNightGame, saturdayGame],
          pagination: { page: 1, limit: 100, total: 2 },
        },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'America/New_York' } } },
      });

      const result = await withCtx(() =>
        getTeamScheduleHandler({
          account_id: 'acc-1',
          team_season_id: 'ts-1',
          to: '2026-05-29',
        }),
      );

      const body = JSON.parse((result.content[0] as { text: string }).text);
      expect(body.count).toBe(1);
      expect(body.games[0].game_id).toBe('fri-night');
    });

    it('surfaces runs for completed games and null for unplayed games', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonSchedule.mockResolvedValueOnce({
        data: {
          games: [
            {
              ...fixtureGame,
              id: 'final',
              gameStatus: 1,
              gameStatusText: 'Final',
              homeScore: 5,
              visitorScore: 2,
            },
            {
              ...fixtureGame,
              id: 'scheduled',
              gameDate: '2026-05-12T19:00:00-05:00',
              gameStatus: 0,
              gameStatusText: 'Scheduled',
            },
          ],
          pagination: { page: 1, limit: 100, total: 2 },
        },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });

      const result = await withCtx(() =>
        getTeamScheduleHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );

      const body = JSON.parse((result.content[0] as { text: string }).text);
      const final = body.games.find((g: { game_id: string }) => g.game_id === 'final');
      const scheduled = body.games.find((g: { game_id: string }) => g.game_id === 'scheduled');
      expect(final.home_score).toBe(5);
      expect(final.visitor_score).toBe(2);
      expect(scheduled.home_score).toBeNull();
      expect(scheduled.visitor_score).toBeNull();
    });

    it('returns no-games message for empty schedule', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamSeasonSchedule.mockResolvedValueOnce({
        data: { games: [], pagination: { page: 1, limit: 100, total: 0 } },
      });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });

      const result = await withCtx(() =>
        getTeamScheduleHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('No games found');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getTeamScheduleHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps SDK 404 to McpError InvalidParams', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => getTeamScheduleHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });
  });
});
