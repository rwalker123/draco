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

const mockGetCurrentUserContact = vi.fn();
const mockGetContactRoster = vi.fn();
const mockGetPlayerCareerStatistics = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getCurrentUserContact: mockGetCurrentUserContact,
  getContactRoster: mockGetContactRoster,
  getPlayerCareerStatistics: mockGetPlayerCareerStatistics,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { getMyBattingStatsHandler, getMyBattingStatsInputSchema } =
  await import('../../tools/getMyBattingStats.js');

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

const fixtureContact = { id: 'contact-1', firstName: 'John', lastName: 'Doe' };
const fixtureRoster = { id: 'player-99', firstYear: 2020, contact: fixtureContact };
const fixtureBattingRow = {
  playerId: 'player-99',
  playerName: 'John Doe',
  teamName: 'Tigers',
  ab: 100,
  h: 30,
  r: 15,
  d: 5,
  t: 1,
  hr: 3,
  rbi: 18,
  bb: 10,
  so: 25,
  hbp: 2,
  sb: 4,
  sf: 1,
  sh: 0,
  avg: 0.3,
  obp: 0.365,
  slg: 0.45,
  ops: 0.815,
  tb: 45,
  pa: 113,
  seasonId: 'season-1',
  seasonName: 'Spring 2026',
  level: 'season' as const,
};
const fixtureStats = {
  playerId: 'player-99',
  playerName: 'John Doe',
  batting: { rows: [fixtureBattingRow] },
  pitching: { rows: [] },
};

describe('getMyBattingStatsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(getMyBattingStatsInputSchema);
      expect(() => schema.parse({})).toThrow();
    });

    it('accepts account_id', () => {
      const schema = z.object(getMyBattingStatsInputSchema);
      expect(() => schema.parse({ account_id: 'acc-1' })).not.toThrow();
    });
  });

  describe('happy path', () => {
    it('returns batting stats when user has a roster entry', async () => {
      mockGetCurrentUserContact.mockResolvedValueOnce({ data: fixtureContact });
      mockGetContactRoster.mockResolvedValueOnce({ data: fixtureRoster });
      mockGetPlayerCareerStatistics.mockResolvedValueOnce({ data: fixtureStats });

      const result = await withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('John Doe');
      expect(text).toContain('Spring 2026');
      expect(mockGetPlayerCareerStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acc-1', playerId: 'player-99' },
        }),
      );
    });
  });

  describe('no roster edge case', () => {
    it('returns friendly message when user has no roster entry (contact exists, roster 404)', async () => {
      mockGetCurrentUserContact.mockResolvedValueOnce({ data: fixtureContact });
      mockGetContactRoster.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      const result = await withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain("don't have player stats");
      expect(mockGetPlayerCareerStatistics).not.toHaveBeenCalled();
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 on contact lookup to McpError InvalidRequest', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('maps contact 404 to McpError InvalidParams', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      await expect(
        withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });

    it('maps SDK 500 to McpError InternalError', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('Server Error'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InternalError });
    });

    it('logs error status on failure', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getMyBattingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool: 'get_my_batting_stats',
          accountId: 'acc-1',
        }),
      );
    });
  });
});
