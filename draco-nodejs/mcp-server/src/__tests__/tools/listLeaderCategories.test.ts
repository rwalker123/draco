import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockGetLeaderCategories = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  getLeaderCategories: mockGetLeaderCategories,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

const { listLeaderCategoriesHandler } = await import('../../tools/listLeaderCategories.js');

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

describe('listLeaderCategoriesHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns batting and pitching categories with key/label/format', async () => {
    mockGetLeaderCategories.mockResolvedValueOnce({
      data: {
        batting: [
          { key: 'avg', label: 'Batting Average', format: 'avg' },
          { key: 'hr', label: 'Home Runs', format: 'int' },
        ],
        pitching: [{ key: 'era', label: 'Earned Run Average', format: 'era' }],
      },
    });

    const result = await withCtx(() => listLeaderCategoriesHandler({ account_id: '1' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.batting).toHaveLength(2);
    expect(parsed.pitching).toHaveLength(1);
    expect(parsed.batting[0]).toEqual({
      key: 'avg',
      label: 'Batting Average',
      format: 'avg',
    });
    expect(parsed.pitching[0].key).toBe('era');
    expect(parsed.summary).toContain('2 batting and 1 pitching');
  });

  it('handles empty category lists', async () => {
    mockGetLeaderCategories.mockResolvedValueOnce({
      data: { batting: [], pitching: [] },
    });

    const result = await withCtx(() => listLeaderCategoriesHandler({ account_id: '1' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.batting).toEqual([]);
    expect(parsed.pitching).toEqual([]);
  });
});
