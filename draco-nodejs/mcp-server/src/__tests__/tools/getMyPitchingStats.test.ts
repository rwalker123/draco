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

const { getMyPitchingStatsHandler, getMyPitchingStatsInputSchema } =
  await import('../../tools/getMyPitchingStats.js');

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

const fixtureContact = { id: 'contact-1', firstName: 'Jane', lastName: 'Pitcher' };
const fixtureRoster = { id: 'player-42', firstYear: 2018, contact: fixtureContact };
const fixturePitchingRow = {
  playerId: 'player-42',
  playerName: 'Jane Pitcher',
  teamName: 'Tigers',
  ip: 45.2,
  ip2: 45,
  w: 5,
  l: 3,
  s: 2,
  h: 40,
  r: 18,
  er: 15,
  bb: 12,
  so: 55,
  hr: 3,
  bf: 180,
  wp: 2,
  hbp: 1,
  era: 2.99,
  whip: 1.15,
  k9: 10.96,
  bb9: 2.39,
  oba: 0.231,
  slg: 0.34,
  ipDecimal: 45.67,
  seasonName: 'Spring 2026',
  level: 'season' as const,
};
const fixtureStats = {
  playerId: 'player-42',
  playerName: 'Jane Pitcher',
  batting: { rows: [] },
  pitching: { rows: [fixturePitchingRow] },
};

describe('getMyPitchingStatsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input schema validation', () => {
    it('requires account_id', () => {
      const schema = z.object(getMyPitchingStatsInputSchema);
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('happy path', () => {
    it('returns pitching stats when user has a roster entry', async () => {
      mockGetCurrentUserContact.mockResolvedValueOnce({ data: fixtureContact });
      mockGetContactRoster.mockResolvedValueOnce({ data: fixtureRoster });
      mockGetPlayerCareerStatistics.mockResolvedValueOnce({ data: fixtureStats });

      const result = await withCtx(() => getMyPitchingStatsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain('Jane Pitcher');
      expect(text).toContain('Spring 2026');
    });
  });

  describe('no roster edge case', () => {
    it('returns friendly message when contact has no roster record', async () => {
      mockGetCurrentUserContact.mockResolvedValueOnce({ data: fixtureContact });
      mockGetContactRoster.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { response: { status: 404 } }),
      );

      const result = await withCtx(() => getMyPitchingStatsHandler({ account_id: 'acc-1' }));
      const text = (result.content[0] as { type: string; text: string }).text;

      expect(text).toContain("don't have player stats");
      expect(mockGetPlayerCareerStatistics).not.toHaveBeenCalled();
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      );

      await expect(
        withCtx(() => getMyPitchingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    });

    it('logs error on failure', async () => {
      mockGetCurrentUserContact.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(
        withCtx(() => getMyPitchingStatsHandler({ account_id: 'acc-1' })),
      ).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'get_my_pitching_stats' }),
      );
    });
  });
});
