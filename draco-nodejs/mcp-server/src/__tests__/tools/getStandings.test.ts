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

const mockGetSeasonStandings = vi.fn();
const mockGetCurrentSeason = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  getSeasonStandings: mockGetSeasonStandings,
  getCurrentSeason: mockGetCurrentSeason,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

const { getStandingsHandler } = await import('../../tools/getStandings.js');

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

const groupedFixture = [
  {
    league: { id: '500', name: 'Adult League' },
    divisions: [
      {
        division: {
          id: '700',
          division: { id: '910', name: 'Division A' },
          priority: 1,
        },
        teams: [
          {
            w: 10,
            l: 3,
            t: 0,
            team: { id: '42', name: 'Tigers' },
            league: { id: '500', name: 'Adult League' },
            division: { id: '700', name: 'Division A' },
            pct: 0.769,
            gb: 0,
            divisionRecord: { w: 5, l: 1, t: 0 },
          },
          {
            w: 8,
            l: 5,
            t: 0,
            team: { id: '43', name: 'Bears' },
            league: { id: '500', name: 'Adult League' },
            division: { id: '700', name: 'Division A' },
            pct: 0.615,
            gb: 2,
          },
        ],
      },
      {
        division: {
          id: '701',
          division: { id: '911', name: 'Division B' },
          priority: 2,
        },
        teams: [
          {
            w: 6,
            l: 7,
            t: 0,
            team: { id: '44', name: 'Falcons' },
            league: { id: '500', name: 'Adult League' },
            division: { id: '701', name: 'Division B' },
            pct: 0.462,
            gb: 0,
          },
        ],
      },
    ],
  },
  {
    league: { id: '501', name: 'Pickup League' },
    divisions: [
      {
        division: { id: '702', division: { id: '912', name: 'Open' }, priority: 1 },
        teams: [
          {
            w: 4,
            l: 4,
            t: 1,
            team: { id: '45', name: 'Coyotes' },
            league: { id: '501', name: 'Pickup League' },
            division: { id: '702', name: 'Open' },
            pct: 0.5,
            gb: 0,
          },
        ],
      },
    ],
  },
];

const flatFixture = [
  {
    w: 10,
    l: 3,
    t: 0,
    team: { id: '42', name: 'Tigers' },
    league: { id: '500', name: 'Adult League' },
    division: { id: '700', name: 'Division A' },
    pct: 0.769,
    gb: 0,
  },
  {
    w: 8,
    l: 5,
    t: 0,
    team: { id: '43', name: 'Bears' },
    league: { id: '500', name: 'Adult League' },
    division: { id: '700', name: 'Division A' },
    pct: 0.615,
    gb: 2,
  },
  {
    w: 4,
    l: 4,
    t: 1,
    team: { id: '45', name: 'Coyotes' },
    league: { id: '501', name: 'Pickup League' },
    division: { id: '702', name: 'Open' },
    pct: 0.5,
    gb: 0,
  },
];

describe('getStandingsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns grouped standings by league and division with stable team_season_ids', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: groupedFixture });

    const result = await withCtx(() => getStandingsHandler({ account_id: '1', season_id: '101' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.grouped).toBe(true);
    expect(parsed.season_id).toBe('101');
    expect(parsed.leagues).toHaveLength(2);
    expect(parsed.leagues[0]).toMatchObject({
      league_season_id: '500',
      league_name: 'Adult League',
    });
    expect(parsed.leagues[0].divisions).toHaveLength(2);
    expect(parsed.leagues[0].divisions[0]).toMatchObject({
      division_season_id: '700',
      division_name: 'Division A',
    });
    expect(parsed.leagues[0].divisions[0].teams[0]).toMatchObject({
      rank: 1,
      team_season_id: '42',
      team_name: 'Tigers',
      w: 10,
      l: 3,
      t: 0,
      pct: 0.769,
      gb: 0,
      division_record: { w: 5, l: 1, t: 0 },
    });
    expect(parsed.leagues[0].divisions[0].teams[1].rank).toBe(2);
  });

  it('filters grouped standings by league_id when provided', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: groupedFixture });

    const result = await withCtx(() =>
      getStandingsHandler({ account_id: '1', season_id: '101', league_id: '500' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.leagues).toHaveLength(1);
    expect(parsed.leagues[0].league_season_id).toBe('500');
  });

  it('returns flat standings when grouped=false with rank per team', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: flatFixture });

    const result = await withCtx(() =>
      getStandingsHandler({ account_id: '1', season_id: '101', grouped: false }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.grouped).toBe(false);
    expect(parsed.teams).toHaveLength(3);
    expect(parsed.teams[0]).toMatchObject({
      rank: 1,
      team_season_id: '42',
      team_name: 'Tigers',
      league_season_id: '500',
      league_name: 'Adult League',
      division_season_id: '700',
      division_name: 'Division A',
      pct: 0.769,
    });
    expect(parsed.teams[2].rank).toBe(3);
  });

  it('filters flat standings by league_id', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: flatFixture });

    const result = await withCtx(() =>
      getStandingsHandler({
        account_id: '1',
        season_id: '101',
        grouped: false,
        league_id: '501',
      }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.teams).toHaveLength(1);
    expect(parsed.teams[0].team_name).toBe('Coyotes');
  });

  it('resolves current season when season_id omitted', async () => {
    mockGetCurrentSeason.mockResolvedValueOnce({ data: { id: '101', name: 'Spring 2026' } });
    mockGetSeasonStandings.mockResolvedValueOnce({ data: [] });

    await withCtx(() => getStandingsHandler({ account_id: '1' }));

    expect(mockGetCurrentSeason).toHaveBeenCalledOnce();
    expect(mockGetSeasonStandings).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { accountId: '1', seasonId: '101' },
        query: { grouped: true },
      }),
    );
  });

  it('returns helpful summary when no standings exist', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: [] });

    const result = await withCtx(() => getStandingsHandler({ account_id: '1', season_id: '101' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.leagues).toEqual([]);
    expect(parsed.summary).toContain('No standings');
  });

  it('returns league-filter empty summary when filter matches nothing', async () => {
    mockGetSeasonStandings.mockResolvedValueOnce({ data: groupedFixture });

    const result = await withCtx(() =>
      getStandingsHandler({ account_id: '1', season_id: '101', league_id: '9999' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.leagues).toEqual([]);
    expect(parsed.summary).toContain('No standings');
  });

  it('maps SDK 500 to McpError InternalError', async () => {
    mockGetSeasonStandings.mockRejectedValueOnce(
      Object.assign(new Error('boom'), { response: { status: 500 } }),
    );

    await expect(
      withCtx(() => getStandingsHandler({ account_id: '1', season_id: '101' })),
    ).rejects.toMatchObject({ code: ErrorCode.InternalError });
  });
});
