import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
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

const mockListStatisticalLeaders = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  listStatisticalLeaders: mockListStatisticalLeaders,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

import { z } from 'zod';
const { getStatisticalLeadersHandler, getStatisticalLeadersInputSchema } =
  await import('../../tools/getStatisticalLeaders.js');

const fixtureCtx = {
  userId: 'u-1',
  accessToken: 'tok',
  scopes: ['mcp:read'],
  requestId: 'req-1',
  cache: new Map(),
};

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run(fixtureCtx, fn);
}

describe('getStatisticalLeadersHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns leaders with player_id usable by get_player_career_stats', async () => {
    mockListStatisticalLeaders.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          playerId: '900',
          playerName: 'Jane Slugger',
          teamName: 'Tigers',
          statValue: 12,
          category: 'hr',
        },
        {
          rank: 2,
          playerId: '901',
          playerName: 'John Hitter',
          teamName: 'Bears',
          teams: ['Bears'],
          statValue: 10,
          category: 'hr',
          isTie: true,
          tieCount: 2,
        },
      ],
    });

    const result = await withCtx(() =>
      getStatisticalLeadersHandler({
        account_id: '1',
        league_id: '500',
        category: 'hr',
        limit: 10,
      }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.category).toBe('hr');
    expect(parsed.count).toBe(2);
    expect(parsed.leaders[0]).toMatchObject({
      rank: 1,
      player_id: '900',
      player_name: 'Jane Slugger',
      team_name: 'Tigers',
      value: 12,
      is_tie: false,
    });
    expect(parsed.leaders[1]).toMatchObject({
      rank: 2,
      player_id: '901',
      value: 10,
      is_tie: true,
      tie_count: 2,
    });
  });

  it('passes filters through to SDK', async () => {
    mockListStatisticalLeaders.mockResolvedValueOnce({ data: [] });

    await withCtx(() =>
      getStatisticalLeadersHandler({
        account_id: '1',
        league_id: '500',
        category: 'avg',
        division_id: '700',
        team_id: '42',
        is_historical: true,
        limit: 5,
      }),
    );

    expect(mockListStatisticalLeaders).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { accountId: '1', leagueId: '500' },
        query: expect.objectContaining({
          category: 'avg',
          divisionId: '700',
          teamId: '42',
          isHistorical: true,
          limit: '5',
        }),
      }),
    );
  });

  it('returns empty leaders with helpful summary', async () => {
    mockListStatisticalLeaders.mockResolvedValueOnce({ data: [] });

    const result = await withCtx(() =>
      getStatisticalLeadersHandler({ account_id: '1', league_id: '500', category: 'hr' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.count).toBe(0);
    expect(parsed.leaders).toEqual([]);
    expect(parsed.summary).toContain('No leaders');
  });

  it('input schema rejects empty category and missing required fields', () => {
    const schema = z.object(getStatisticalLeadersInputSchema);
    expect(schema.safeParse({ account_id: '1', league_id: '500', category: '' }).success).toBe(
      false,
    );
    expect(schema.safeParse({ account_id: '1', league_id: '500' }).success).toBe(false);
    expect(schema.safeParse({ account_id: '1', category: 'hr' }).success).toBe(false);
    expect(schema.safeParse({ account_id: '1', league_id: '500', category: 'hr' }).success).toBe(
      true,
    );
  });

  it('maps SDK 404 to McpError InvalidParams', async () => {
    mockListStatisticalLeaders.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { response: { status: 404 } }),
    );

    await expect(
      withCtx(() =>
        getStatisticalLeadersHandler({ account_id: '1', league_id: '500', category: 'hr' }),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
  });
});
