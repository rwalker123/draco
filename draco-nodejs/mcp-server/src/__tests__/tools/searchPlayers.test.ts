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

const mockSearchPublicContacts = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  searchPublicContacts: mockSearchPublicContacts,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

vi.mock('../../logging/auditLogger.js', () => ({ auditLog: vi.fn() }));

import { z } from 'zod';
const { searchPlayersHandler, searchPlayersInputSchema } =
  await import('../../tools/searchPlayers.js');

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

describe('searchPlayersHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns players with player_id (contact id) usable by get_player_career_stats', async () => {
    mockSearchPublicContacts.mockResolvedValueOnce({
      data: {
        results: [
          { id: '500', firstName: 'Jane', lastName: 'Slugger' },
          { id: '501', firstName: 'John', lastName: 'Smith' },
        ],
      },
    });

    const result = await withCtx(() => searchPlayersHandler({ account_id: '1', query: 'sl' }));
    const parsed = JSON.parse((result.content[0] as { text: string }).text);

    expect(parsed.count).toBe(2);
    expect(parsed.players[0]).toEqual({
      player_id: '500',
      name: 'Jane Slugger',
      first_name: 'Jane',
      last_name: 'Slugger',
    });
    expect(parsed.summary).toContain('player_id');
  });

  it('passes query and limit as strings to the SDK', async () => {
    mockSearchPublicContacts.mockResolvedValueOnce({ data: { results: [] } });

    await withCtx(() => searchPlayersHandler({ account_id: '1', query: 'smith', limit: 25 }));

    expect(mockSearchPublicContacts).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { accountId: '1' },
        query: { query: 'smith', limit: '25' },
      }),
    );
  });

  it('returns no-match summary when results are empty', async () => {
    mockSearchPublicContacts.mockResolvedValueOnce({ data: { results: [] } });

    const result = await withCtx(() =>
      searchPlayersHandler({ account_id: '1', query: 'zzznomatch' }),
    );
    const parsed = JSON.parse((result.content[0] as { text: string }).text);
    expect(parsed.count).toBe(0);
    expect(parsed.summary).toContain('No players found');
  });

  it('input schema rejects queries shorter than 2 characters', () => {
    const schema = z.object(searchPlayersInputSchema);
    expect(schema.safeParse({ account_id: '1', query: 'a' }).success).toBe(false);
    expect(schema.safeParse({ account_id: '1', query: '' }).success).toBe(false);
    expect(schema.safeParse({ account_id: '1', query: 'ab' }).success).toBe(true);
  });
});
