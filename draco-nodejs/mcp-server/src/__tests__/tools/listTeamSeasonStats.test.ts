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

const mockListTeamSeasonBattingStats = vi.fn();
const mockListTeamSeasonPitchingStats = vi.fn();
const mockGetCurrentSeason = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  listTeamSeasonBattingStats: mockListTeamSeasonBattingStats,
  listTeamSeasonPitchingStats: mockListTeamSeasonPitchingStats,
  getCurrentSeason: mockGetCurrentSeason,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

const { listTeamSeasonStatsHandler } = await import('../../tools/listTeamSeasonStats.js');

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

const battingRow = {
  contactId: '500',
  playerName: 'Jane Slugger',
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
};

const pitchingRow = {
  contactId: '501',
  playerName: 'John Pitcher',
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
};

describe('listTeamSeasonStatsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns batting stats with shaped player_id and stat fields', async () => {
    mockListTeamSeasonBattingStats.mockResolvedValueOnce({ data: [battingRow] });

    const result = await withCtx(() =>
      listTeamSeasonStatsHandler({
        account_id: '1',
        team_season_id: '42',
        season_id: '101',
        stat_type: 'batting',
      }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.stat_type).toBe('batting');
    expect(parsed.count).toBe(1);
    expect(parsed.rows[0]).toMatchObject({
      player_id: '500',
      player_name: 'Jane Slugger',
      ab: 40,
      hr: 4,
      rbi: 12,
      '2b': 3,
      '3b': 0,
    });
  });

  it('returns pitching stats with shaped player_id and stat fields', async () => {
    mockListTeamSeasonPitchingStats.mockResolvedValueOnce({ data: [pitchingRow] });

    const result = await withCtx(() =>
      listTeamSeasonStatsHandler({
        account_id: '1',
        team_season_id: '42',
        season_id: '101',
        stat_type: 'pitching',
      }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.stat_type).toBe('pitching');
    expect(parsed.rows[0]).toMatchObject({
      player_id: '501',
      ip: 12.5,
      w: 2,
      era: 2.16,
      whip: 1.12,
    });
  });

  it('resolves current season when season_id is omitted', async () => {
    mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: '101', name: 'Spring 2026' } });
    mockListTeamSeasonBattingStats.mockResolvedValueOnce({ data: [] });

    await withCtx(() =>
      listTeamSeasonStatsHandler({
        account_id: '1',
        team_season_id: '42',
        stat_type: 'batting',
      }),
    );

    expect(mockGetCurrentSeason).toHaveBeenCalledOnce();
    expect(mockListTeamSeasonBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { accountId: '1', seasonId: '101', teamSeasonId: '42' },
      }),
    );
  });

  it('returns helpful empty summary when team has no stats', async () => {
    mockListTeamSeasonPitchingStats.mockResolvedValueOnce({ data: [] });

    const result = await withCtx(() =>
      listTeamSeasonStatsHandler({
        account_id: '1',
        team_season_id: '42',
        season_id: '101',
        stat_type: 'pitching',
      }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.count).toBe(0);
    expect(parsed.summary).toContain('No pitching');
  });

  it('rejects invalid stat_type', async () => {
    await expect(
      withCtx(() =>
        listTeamSeasonStatsHandler({
          account_id: '1',
          team_season_id: '42',
          season_id: '101',
          // @ts-expect-error - intentional invalid input
          stat_type: 'fielding',
        }),
      ),
    ).rejects.toBeTruthy();
  });

  it('maps SDK 404 to McpError InvalidParams', async () => {
    mockListTeamSeasonBattingStats.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { response: { status: 404 } }),
    );

    await expect(
      withCtx(() =>
        listTeamSeasonStatsHandler({
          account_id: '1',
          team_season_id: '42',
          season_id: '101',
          stat_type: 'batting',
        }),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
  });
});
