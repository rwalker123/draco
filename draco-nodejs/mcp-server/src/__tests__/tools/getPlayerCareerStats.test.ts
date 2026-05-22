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

const mockGetPlayerCareerStatistics = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  getPlayerCareerStatistics: mockGetPlayerCareerStatistics,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

const { getPlayerCareerStatsHandler } = await import('../../tools/getPlayerCareerStats.js');

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

const fixtureStats = {
  playerId: '500',
  playerName: 'Jane Slugger',
  photoUrl: '',
  batting: {
    rows: [
      {
        level: 'season',
        seasonId: '101',
        seasonName: 'Spring 2026',
        teamId: '42',
        teamName: 'Tigers',
        ab: 40,
        h: 14,
        r: 10,
        d: 3,
        t: 0,
        hr: 4,
        rbi: 12,
        bb: 6,
        so: 8,
        hbp: 1,
        sb: 2,
        sf: 0,
        sh: 0,
        avg: 0.35,
        obp: 0.45,
        slg: 0.6,
        ops: 1.05,
      },
      {
        level: 'career',
        ab: 80,
        h: 28,
        r: 20,
        d: 6,
        t: 0,
        hr: 8,
        rbi: 24,
        bb: 12,
        so: 16,
        hbp: 2,
        sb: 4,
        sf: 0,
        sh: 0,
        avg: 0.35,
        obp: 0.45,
        slg: 0.6,
        ops: 1.05,
      },
    ],
  },
  pitching: {
    rows: [
      {
        level: 'season',
        seasonName: 'Spring 2026',
        teamName: 'Tigers',
        ip: 12.5,
        w: 2,
        l: 1,
        s: 0,
        h: 10,
        r: 4,
        er: 3,
        bb: 4,
        so: 14,
        hr: 1,
        era: 2.16,
        whip: 1.12,
      },
    ],
  },
};

describe('getPlayerCareerStatsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns both batting and pitching shaped rows with player_id round-tripped', async () => {
    mockGetPlayerCareerStatistics.mockResolvedValueOnce({ data: fixtureStats });

    const result = await withCtx(() =>
      getPlayerCareerStatsHandler({ account_id: '1', player_id: '500' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.player_id).toBe('500');
    expect(parsed.player_name).toBe('Jane Slugger');
    expect(parsed.batting.count).toBe(2);
    expect(parsed.batting.rows[0]).toMatchObject({
      level: 'season',
      season_name: 'Spring 2026',
      team_name: 'Tigers',
      ab: 40,
      h: 14,
      hr: 4,
      rbi: 12,
      avg: 0.35,
    });
    expect(parsed.pitching.count).toBe(1);
    expect(parsed.pitching.rows[0]).toMatchObject({
      level: 'season',
      ip: 12.5,
      w: 2,
      l: 1,
      era: 2.16,
      whip: 1.12,
    });
  });

  it('handles a player with no pitching rows', async () => {
    mockGetPlayerCareerStatistics.mockResolvedValueOnce({
      data: { ...fixtureStats, pitching: { rows: [] } },
    });

    const result = await withCtx(() =>
      getPlayerCareerStatsHandler({ account_id: '1', player_id: '500' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.pitching.count).toBe(0);
    expect(parsed.pitching.rows).toEqual([]);
  });

  it('passes player_id through as playerId path param', async () => {
    mockGetPlayerCareerStatistics.mockResolvedValueOnce({ data: fixtureStats });

    await withCtx(() => getPlayerCareerStatsHandler({ account_id: '1', player_id: '500' }));

    expect(mockGetPlayerCareerStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ path: { accountId: '1', playerId: '500' } }),
    );
  });

  it('maps SDK 404 to McpError InvalidParams', async () => {
    mockGetPlayerCareerStatistics.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { response: { status: 404 } }),
    );

    await expect(
      withCtx(() => getPlayerCareerStatsHandler({ account_id: '1', player_id: '500' })),
    ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
  });
});
