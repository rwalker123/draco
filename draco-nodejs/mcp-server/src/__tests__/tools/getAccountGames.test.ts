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
const mockListSeasonGames = vi.fn();
const mockGetAccountById = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  listSeasonGames: mockListSeasonGames,
  getAccountById: mockGetAccountById,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getAccountGamesHandler, getAccountGamesInputSchema } =
  await import('../../tools/getAccountGames.js');

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

function game(overrides: Record<string, unknown> = {}) {
  return {
    id: 'game-1',
    gameDate: '2026-05-15T19:00:00-05:00',
    homeTeam: { id: 'ht-1', name: 'Tigers' },
    visitorTeam: { id: 'vt-1', name: 'Bears' },
    league: { id: 'lg-adult', name: '18+ Adult' },
    field: { id: 'f-1', name: 'North Field', shortName: 'NF' },
    homeScore: 0,
    visitorScore: 0,
    gameStatus: 0,
    gameStatusText: 'Scheduled' as const,
    gameType: 0,
    ...overrides,
  };
}

function parsedText(result: { content: unknown[] }) {
  const first = result.content[0] as { text: string };
  return JSON.parse(first.text);
}

function seasonGamesResponse(games: ReturnType<typeof game>[], total?: number) {
  return {
    data: { games, pagination: { page: 1, limit: 100, total: total ?? games.length } },
  };
}

describe('getAccountGamesHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() => schema.parse({})).toThrow();
    });

    it('accepts account_id alone and defaults the limit', () => {
      const schema = z.object(getAccountGamesInputSchema);
      const parsed = schema.parse({ account_id: 'acc-1' });
      expect(parsed.limit).toBe(25);
    });

    it('rejects an unknown range value', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', range: 'next_year' })).toThrow();
    });

    it('rejects limit > 100', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', limit: 101 })).toThrow();
    });

    it('rejects a malformed from date', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', from: 'not-a-date' })).toThrow();
    });

    it('rejects impossible calendar dates', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', to: '2026-02-30' })).toThrow();
      expect(() => schema.parse({ account_id: 'acc-1', to: '2026-13-01' })).toThrow();
    });

    it('accepts a valid YYYY-MM-DD date', () => {
      const schema = z.object(getAccountGamesInputSchema);
      expect(() =>
        schema.parse({ account_id: 'acc-1', from: '2026-05-29', to: '2026-05-31' }),
      ).not.toThrow();
    });
  });

  describe('account-wide query', () => {
    it('resolves the current season and queries season games with a padded date window', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-15T18:00:00.000Z'));

      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'America/Chicago' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(seasonGamesResponse([game()]));

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', range: 'today' }),
      );

      expect(mockGetCurrentSeason).toHaveBeenCalledTimes(1);
      expect(mockListSeasonGames).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acc-1', seasonId: 'season-1' },
          query: expect.objectContaining({
            startDate: '2026-05-14T00:00:00.000Z',
            endDate: '2026-05-16T23:59:59.999Z',
            sortOrder: 'asc',
          }),
        }),
      );

      const body = parsedText(result);
      expect(body.count).toBe(1);
      expect(body.games[0].league_name).toBe('18+ Adult');
    });

    it('surfaces runs for completed games and null for unplayed games', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(
        seasonGamesResponse([
          game({
            id: 'final',
            gameDate: '2026-05-10T19:00:00Z',
            gameStatus: 1,
            gameStatusText: 'Final',
            homeScore: 7,
            visitorScore: 3,
          }),
          game({
            id: 'scheduled',
            gameDate: '2026-05-12T19:00:00Z',
            gameStatus: 0,
            gameStatusText: 'Scheduled',
            homeScore: 0,
            visitorScore: 0,
          }),
        ]),
      );

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', from: '2026-05-01' }),
      );

      const body = parsedText(result);
      const final = body.games.find((g: { game_id: string }) => g.game_id === 'final');
      const scheduled = body.games.find((g: { game_id: string }) => g.game_id === 'scheduled');
      expect(final.home_score).toBe(7);
      expect(final.visitor_score).toBe(3);
      expect(scheduled.home_score).toBeNull();
      expect(scheduled.visitor_score).toBeNull();
    });

    it('uses an explicit season_id without calling getCurrentSeason', async () => {
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(seasonGamesResponse([]));

      await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', season_id: 'season-99', range: 'today' }),
      );

      expect(mockGetCurrentSeason).not.toHaveBeenCalled();
      expect(mockListSeasonGames).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: 'acc-1', seasonId: 'season-99' } }),
      );
    });
  });

  describe('local-date filtering', () => {
    it('drops games that fall outside the requested local day', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-15T18:00:00.000Z'));

      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'America/Chicago' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(
        seasonGamesResponse([
          game({ id: 'today-evening', gameDate: '2026-05-15T23:00:00-05:00' }),
          game({ id: 'tomorrow-early', gameDate: '2026-05-16T10:00:00-05:00' }),
        ]),
      );

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', range: 'today' }),
      );

      const body = parsedText(result);
      expect(body.count).toBe(1);
      expect(body.games[0].game_id).toBe('today-evening');
    });
  });

  describe('league filtering', () => {
    it('keeps only games in the requested league_season_id', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(
        seasonGamesResponse([
          game({ id: 'g-adult', league: { id: 'lg-adult', name: '18+ Adult' } }),
          game({ id: 'g-youth', league: { id: 'lg-youth', name: 'Youth 12U' } }),
        ]),
      );

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', from: '2026-05-01', league_id: 'lg-adult' }),
      );

      const body = parsedText(result);
      expect(body.count).toBe(1);
      expect(body.games[0].game_id).toBe('g-adult');
      expect(body.summary).toContain('in the selected league');
    });
  });

  describe('result shaping and limits', () => {
    it('sorts by date ascending and caps at the requested limit', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(
        seasonGamesResponse([
          game({ id: 'later', gameDate: '2026-05-20T19:00:00Z' }),
          game({ id: 'earlier', gameDate: '2026-05-18T19:00:00Z' }),
          game({ id: 'latest', gameDate: '2026-05-22T19:00:00Z' }),
        ]),
      );

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', from: '2026-05-01', limit: 2 }),
      );

      const body = parsedText(result);
      expect(body.count).toBe(2);
      expect(body.matched).toBe(3);
      expect(body.summary).toContain('3 games scheduled');
      expect(body.summary).toContain('showing the first 2');
      expect(body.games.map((g: { game_id: string }) => g.game_id)).toEqual(['earlier', 'later']);
    });
  });

  describe('pagination', () => {
    it('pages through every backend page in the window before filtering', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) =>
        game({ id: `g-${i}`, gameDate: '2026-05-15T18:00:00Z' }),
      );
      const page2 = Array.from({ length: 50 }, (_, i) =>
        game({ id: `g-${100 + i}`, gameDate: '2026-05-15T18:00:00Z' }),
      );

      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames
        .mockResolvedValueOnce({
          data: { games: page1, pagination: { page: 1, limit: 100, total: 150 } },
        })
        .mockResolvedValueOnce({
          data: { games: page2, pagination: { page: 2, limit: 100, total: 150 } },
        });

      const result = await withCtx(() =>
        getAccountGamesHandler({
          account_id: 'acc-1',
          from: '2026-05-15',
          to: '2026-05-15',
          limit: 100,
        }),
      );

      expect(mockListSeasonGames).toHaveBeenCalledTimes(2);
      expect(mockListSeasonGames).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ query: expect.objectContaining({ page: 1, limit: 100 }) }),
      );
      expect(mockListSeasonGames).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ query: expect.objectContaining({ page: 2, limit: 100 }) }),
      );

      const body = parsedText(result);
      expect(body.matched).toBe(150);
      expect(body.count).toBe(100);
      expect(body.truncated).toBe(false);
    });

    it('caps at the max page count and flags the result as truncated', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      for (let p = 1; p <= 20; p += 1) {
        const pageGames = Array.from({ length: 100 }, (_, i) =>
          game({ id: `p${p}-${i}`, gameDate: '2026-05-15T18:00:00Z' }),
        );
        mockListSeasonGames.mockResolvedValueOnce({
          data: { games: pageGames, pagination: { page: p, limit: 100, total: 3000 } },
        });
      }

      const result = await withCtx(() =>
        getAccountGamesHandler({
          account_id: 'acc-1',
          from: '2026-05-15',
          to: '2026-05-15',
          limit: 100,
        }),
      );

      expect(mockListSeasonGames).toHaveBeenCalledTimes(20);
      const body = parsedText(result);
      expect(body.truncated).toBe(true);
      expect(body.summary).toContain('may be incomplete');
    });
  });

  describe('empty results', () => {
    it('returns a friendly summary when no games match (including hidden schedules)', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockResolvedValueOnce(seasonGamesResponse([]));

      const result = await withCtx(() =>
        getAccountGamesHandler({ account_id: 'acc-1', range: 'tonight' }),
      );

      const body = parsedText(result);
      expect(body.count).toBe(0);
      expect(body.summary).toBe('No games scheduled today.');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getAccountGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('logs error status and throws McpError on 500', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: 'season-1', name: 'Spring' } });
      mockGetAccountById.mockResolvedValueOnce({
        data: { account: { id: 'acc-1', configuration: { timeZone: 'UTC' } } },
      });
      mockListSeasonGames.mockRejectedValueOnce(
        Object.assign(new Error('boom'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getAccountGamesHandler({ account_id: 'acc-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'get_account_games', accountId: 'acc-1' }),
      );
    });
  });
});
