import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
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

const mockGetMyAccounts = vi.fn();
vi.mock('@draco/shared-api-client', () => ({
  getMyAccounts: mockGetMyAccounts,
}));

vi.mock('../../sdkClient/createDracoClient.js', () => ({
  getDracoClient: vi.fn(() => ({ __mockClient: true })),
}));

const mockAuditLog = vi.fn();
vi.mock('../../logging/auditLogger.js', () => ({
  auditLog: mockAuditLog,
}));

const { listMyAccountsHandler } = await import('../../tools/listMyAccounts.js');

const fixtureCtx = {
  userId: 'user-123',
  accessToken: 'tok',
  scopes: ['mcp:read'],
  requestId: 'req-abc',
  cache: new Map(),
};

function withCtx<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run(fixtureCtx, fn);
}

describe('listMyAccountsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('returns shaped text content for multiple accounts', async () => {
      mockGetMyAccounts.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            name: 'Diamond League',
            configuration: { accountType: { id: 'bt', name: 'baseball' } },
          },
          { id: '2', name: 'Pickup Crew', configuration: {} },
        ],
      });

      const result = await withCtx(() => listMyAccountsHandler());

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toMatchObject({ type: 'text' });
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('2 Draco accounts');
      expect(text).toContain('"Diamond League"');
      expect(text).toContain('"Pickup Crew"');
    });

    it('returns empty-state message when user has no accounts', async () => {
      mockGetMyAccounts.mockResolvedValueOnce({ data: [] });

      const result = await withCtx(() => listMyAccountsHandler());

      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("don't belong to any");
    });

    it('calls auditLog with ok status and correct count', async () => {
      mockGetMyAccounts.mockResolvedValueOnce({ data: [{ id: '1', name: 'A' }] });

      await withCtx(() => listMyAccountsHandler());

      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tool: 'list_my_accounts',
          userId: 'user-123',
          status: 'ok',
          count: 1,
          requestId: 'req-abc',
        }),
      );
    });
  });

  describe('ALS context propagation smoke test', () => {
    it('ALS context survives SDK callback chain', async () => {
      mockGetMyAccounts.mockImplementation(async () => {
        const { getContext } = await import('../../auth/perRequestContext.js');
        const ctx = getContext();
        expect(ctx.userId).toBe('user-123');
        expect(ctx.accessToken).toBe('tok');
        return { data: [] };
      });

      await withCtx(() => listMyAccountsHandler());

      expect(mockGetMyAccounts).toHaveBeenCalledOnce();
    });
  });

  describe('error mapping', () => {
    it('maps SDK 401 to McpError InvalidRequest', async () => {
      const sdkErr = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
      mockGetMyAccounts.mockRejectedValueOnce(sdkErr);

      await expect(withCtx(() => listMyAccountsHandler())).rejects.toMatchObject({
        code: ErrorCode.InvalidRequest,
      });
    });

    it('maps SDK 403 to McpError InvalidRequest', async () => {
      mockGetMyAccounts.mockRejectedValueOnce(
        Object.assign(new Error('Forbidden'), { response: { status: 403 } }),
      );

      await expect(withCtx(() => listMyAccountsHandler())).rejects.toMatchObject({
        code: ErrorCode.InvalidRequest,
      });
    });

    it('maps SDK 500 to McpError InternalError', async () => {
      mockGetMyAccounts.mockRejectedValueOnce(
        Object.assign(new Error('Server Error'), { response: { status: 500 } }),
      );

      await expect(withCtx(() => listMyAccountsHandler())).rejects.toMatchObject({
        code: ErrorCode.InternalError,
      });
    });

    it('calls auditLog with error status on failure', async () => {
      mockGetMyAccounts.mockRejectedValueOnce(
        Object.assign(new Error('err'), { response: { status: 500 } }),
      );

      await expect(withCtx(() => listMyAccountsHandler())).rejects.toBeInstanceOf(McpError);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', tool: 'list_my_accounts' }),
      );
    });
  });
});
