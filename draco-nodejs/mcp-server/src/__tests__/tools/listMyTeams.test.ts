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
  },
}));

const mockGetCurrentSeason = vi.fn();
const mockListMyTeamSeasons = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  listMyTeamSeasons: mockListMyTeamSeasons,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { listMyTeamsHandler, listMyTeamsInputSchema } = await import('../../tools/listMyTeams.js');

const fixtureCtx = {
  userId: 'user-123',
  accessToken: 'tok',
  scopes: ['mcp:read'],
  requestId: 'req-abc',
  cache: new Map(),
};

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run(fixtureCtx, fn);
}

const fixtureSeason = {
  id: 'season-1',
  name: 'Spring 2026',
  accountId: 'acc-1',
  scheduleVisible: true,
};
const fixtureTeam = {
  teamSeasonId: 'ts-1',
  teamName: 'Tigers',
  leagueSeasonId: 'ls-1',
  leagueName: 'Adult League',
  divisionSeasonId: 'ds-1',
  divisionName: 'Division B',
  jerseyNumber: 14,
};

describe('listMyTeamsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(listMyTeamsInputSchema);
      expect(() => schema.parse({})).toThrow();
    });

    it('accepts account_id without season_id', () => {
      const schema = z.object(listMyTeamsInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).not.toThrow();
    });

    it('accepts account_id with season_id', () => {
      const schema = z.object(listMyTeamsInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', season_id: 'season-1' })).not.toThrow();
    });

    it('rejects empty account_id', () => {
      const schema = z.object(listMyTeamsInputSchema);
      expect(() => schema.parse({ account_id: '' })).toThrow();
    });
  });

  describe('current-season resolution path', () => {
    it('calls getCurrentSeason when season_id is omitted', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [fixtureTeam] });

      await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));

      expect(mockGetCurrentSeason).toHaveBeenCalledOnce();
      expect(mockListMyTeamSeasons).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: 'acc-1', seasonId: 'season-1' } }),
      );
    });

    it('uses season name from getCurrentSeason in output', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('Spring 2026');
    });
  });

  describe('explicit season_id path', () => {
    it('skips getCurrentSeason when season_id is provided', async () => {
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [fixtureTeam] });

      await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1', season_id: 'season-99' }));

      expect(mockGetCurrentSeason).not.toHaveBeenCalled();
      expect(mockListMyTeamSeasons).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: 'acc-1', seasonId: 'season-99' } }),
      );
    });
  });

  describe('output shaping', () => {
    it('returns readable text with team details', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [fixtureTeam] });

      const result = await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('Tigers');
      expect(text).toContain('Adult League');
      expect(text).toContain('Division B');
      expect(text).toContain('jersey #14');
    });

    it('handles teams without division', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({
        data: [{ ...fixtureTeam, divisionSeasonId: null, divisionName: null }],
      });

      const result = await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('Tigers');
      expect(text).not.toContain('Division B');
    });

    it('handles teams without jersey number', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({
        data: [{ ...fixtureTeam, jerseyNumber: null }],
      });

      const result = await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('no jersey');
    });

    it('returns not-on-any-teams message for empty result', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockListMyTeamSeasons.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' }));
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
        withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({
        code: ErrorCode.InvalidRequest,
      });
    });

    it('maps SDK 404 to McpError InvalidParams', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({
        code: ErrorCode.InvalidParams,
      });
    });

    it('maps SDK 500 to McpError InternalError', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Server Error'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({
        code: ErrorCode.InternalError,
      });
    });

    it('logs error status on failure', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => listMyTeamsHandler({ account_id: 'acc-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'list_my_teams', accountId: 'acc-1' }),
      );
    });
  });
});
