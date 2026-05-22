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

const mockListAccountSeasons = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  listAccountSeasons: mockListAccountSeasons,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { listSeasonsHandler } = await import('../../tools/listSeasons.js');

const fixtureCtx = {
  userId: 'user-1',
  accessToken: 'tok',
  scopes: ['mcp:read'],
  requestId: 'req-1',
  cache: new Map(),
};

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run(fixtureCtx, fn);
}

const fixtureSeason = {
  id: '101',
  name: 'Spring 2026',
  accountId: '1',
  isCurrent: true,
  scheduleVisible: true,
  leagues: [
    {
      id: '500',
      league: { id: '900', name: 'Adult League' },
      divisions: [
        { id: '700', division: { id: '910', name: 'Division A' }, priority: 1 },
        { id: '701', division: { id: '911', name: 'Division B' }, priority: 2 },
      ],
    },
    {
      id: '501',
      league: { id: '901', name: 'Pickup League' },
    },
  ],
};

describe('listSeasonsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns shaped JSON with season_id, league_season_id, and division_season_id', async () => {
    mockListAccountSeasons.mockResolvedValueOnce({ data: [fixtureSeason] });

    const result = await withCtx(() => listSeasonsHandler({ account_id: '1' }));

    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);

    expect(parsed.count).toBe(1);
    expect(parsed.seasons[0].season_id).toBe('101');
    expect(parsed.seasons[0].season_name).toBe('Spring 2026');
    expect(parsed.seasons[0].is_current).toBe(true);
    expect(parsed.seasons[0].leagues).toHaveLength(2);
    expect(parsed.seasons[0].leagues[0].league_season_id).toBe('500');
    expect(parsed.seasons[0].leagues[0].league_name).toBe('Adult League');
    expect(parsed.seasons[0].leagues[0].divisions).toHaveLength(2);
    expect(parsed.seasons[0].leagues[0].divisions[0].division_season_id).toBe('700');
    expect(parsed.seasons[0].leagues[0].divisions[0].division_name).toBe('Division A');
  });

  it('handles a league with no divisions', async () => {
    mockListAccountSeasons.mockResolvedValueOnce({ data: [fixtureSeason] });

    const result = await withCtx(() => listSeasonsHandler({ account_id: '1' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.seasons[0].leagues[1].league_season_id).toBe('501');
    expect(parsed.seasons[0].leagues[1].divisions).toEqual([]);
  });

  it('returns empty list when account has no seasons', async () => {
    mockListAccountSeasons.mockResolvedValueOnce({ data: [] });

    const result = await withCtx(() => listSeasonsHandler({ account_id: '1' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.count).toBe(0);
    expect(parsed.seasons).toEqual([]);
  });

  it('passes includeDivisions: true to the SDK', async () => {
    mockListAccountSeasons.mockResolvedValueOnce({ data: [] });

    await withCtx(() => listSeasonsHandler({ account_id: '1' }));

    expect(mockListAccountSeasons).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { accountId: '1' },
        query: { includeDivisions: true },
      }),
    );
  });

  it('maps a 500 error to InternalError', async () => {
    mockListAccountSeasons.mockRejectedValueOnce(
      Object.assign(new Error('boom'), { response: { status: 500 } }),
    );

    await expect(withCtx(() => listSeasonsHandler({ account_id: '1' }))).rejects.toMatchObject({
      code: ErrorCode.InternalError,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', tool: 'list_seasons' }),
    );
  });
});
