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
const mockGetPublicTeamRosterMembers = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  getPublicTeamRosterMembers: mockGetPublicTeamRosterMembers,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getTeamRosterHandler, getTeamRosterInputSchema } =
  await import('../../tools/getTeamRoster.js');

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
const fixtureRosterResponse = {
  teamSeason: { id: 'ts-1', name: 'Tigers' },
  rosterMembers: [
    {
      id: 'rm-1',
      contactId: 'c-1',
      playerNumber: 7,
      firstName: 'Alice',
      lastName: 'Cooper',
      photoUrl: null,
      gamesPlayed: 10,
      middleName: null,
    },
    {
      id: 'rm-2',
      contactId: 'c-2',
      playerNumber: 14,
      firstName: 'Bob',
      lastName: 'Smith',
      photoUrl: null,
      gamesPlayed: 8,
      middleName: null,
    },
  ],
};

describe('getTeamRosterHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id and team_season_id', () => {
      const schema = z.object(getTeamRosterInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).toThrow();
      expect(() => schema.parse({ team_season_id: 'ts-1' })).toThrow();
    });

    it('accepts required fields', () => {
      const schema = z.object(getTeamRosterInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1', team_season_id: 'ts-1' })).not.toThrow();
    });
  });

  describe('happy path', () => {
    it('returns roster with names and jersey numbers', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockGetPublicTeamRosterMembers.mockResolvedValueOnce({ data: fixtureRosterResponse });

      const result = await withCtx(() =>
        getTeamRosterHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('Alice Cooper');
      expect(text).toContain('Bob Smith');
      expect(text).toContain('"jersey_number": 7');
      expect(text).toContain('"jersey_number": 14');
      expect(text).not.toContain('email');
      expect(text).not.toContain('phone');
      expect(text).not.toContain('address');
    });

    it('uses provided season_id without resolving current season', async () => {
      mockGetPublicTeamRosterMembers.mockResolvedValueOnce({ data: fixtureRosterResponse });

      await withCtx(() =>
        getTeamRosterHandler({
          account_id: 'acc-1',
          team_season_id: 'ts-1',
          season_id: 'season-99',
        }),
      );

      expect(mockGetCurrentSeason).not.toHaveBeenCalled();
      expect(mockGetPublicTeamRosterMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acc-1', seasonId: 'season-99', teamSeasonId: 'ts-1' },
        }),
      );
    });

    it('returns empty-roster message for team with no players', async () => {
      mockGetCurrentSeason.mockResolvedValueOnce({ data: fixtureSeason });
      mockGetPublicTeamRosterMembers.mockResolvedValueOnce({
        data: { teamSeason: { id: 'ts-1', name: 'Tigers' }, rosterMembers: [] },
      });

      const result = await withCtx(() =>
        getTeamRosterHandler({ account_id: 'acc-1', team_season_id: 'ts-1' }),
      );
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('No roster members');
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getTeamRosterHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps SDK 404 to McpError InvalidParams', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => getTeamRosterHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });

    it('logs error on failure', async () => {
      mockGetCurrentSeason.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getTeamRosterHandler({ account_id: 'acc-1', team_season_id: 'ts-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'get_team_roster', accountId: 'acc-1' }),
      );
    });
  });
});
