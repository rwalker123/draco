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
const mockListTeamManagers = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  listTeamManagers: mockListTeamManagers,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getTeamManagersHandler, getTeamManagersInputSchema } =
  await import('../../tools/getTeamManagers.js');

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
const fixtureManager = {
  id: 'mgr-1',
  team: { id: 'team-1', name: 'Tigers' },
  contact: { id: 'c-1', firstName: 'Bob', lastName: 'Smith' },
};

describe('getTeamManagersHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id and team_season_id', () => {
      const schema = z.object(getTeamManagersInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).toThrow();
      expect(() => schema.parse({ team_season_id: 'ts-1' })).toThrow();
    });

    it('accepts required fields', () => {
      const schema = z.object(getTeamManagersInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', team_season_id: 'ts-1' })).not.toThrow();
    });

    it('accepts optional season_id', () => {
      const schema = z.object(getTeamManagersInputSchema);
      expect(() =>
        schema.parse({ account_id: 'acc-1', team_season_id: 'ts-1', season_id: 's-1' }),
      ).not.toThrow();
    });
  });

  describe('happy path', () => {
    it('resolves current season and lists managers', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamManagers.mockResolvedValueOnce({ data: [fixtureManager] });

      const result = await withCtx(() =>
        getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('Bob Smith');
      expect(text).toContain('Tigers');
      expect(mockListTeamManagers).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acc-1', seasonId: 'season-1', teamSeasonId: 'ts-1' },
        }),
      );
    });

    it('skips getCurrentSeason when season_id provided', async () => {
      mockListTeamManagers.mockResolvedValueOnce({ data: [fixtureManager] });

      await withCtx(() =>
        getTeamManagersHandler({
          account_id: 'acc-1',
          team_season_id: 'ts-1',
          season_id: 'season-99',
        }),
      );

      expect(mockGetCurrentSeason).not.toHaveBeenCalled();
      expect(mockListTeamManagers).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.objectContaining({ seasonId: 'season-99' }) }),
      );
    });

    it('returns no-managers message for empty list', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListTeamManagers.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() =>
        getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('No managers');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps SDK 404 to McpError InvalidParams', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });

    it('maps SDK 500 to McpError InternalError', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('error'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InternalError });
    });

    it('logs error status on failure', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getTeamManagersHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'get_team_managers', accountId: 'acc-1' }),
      );
    });
  });
});
