import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { partialMock } from '../../test-utils/partialMock.js';

vi.mock('../../services/serviceFactory.js', () => ({
  ServiceFactory: {
    getOauthService: vi.fn(),
  },
}));

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: {
    getUserRepository: vi.fn(),
  },
}));

import { ServiceFactory } from '../../services/serviceFactory.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import { OauthAuthenticationError } from '../../services/oauthErrors.js';
import { oauthAuthMiddleware } from '../../middleware/oauthAuthMiddleware.js';

function mockReq(authHeader?: string): Request {
  return partialMock<Request>({
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
    isOauth: undefined,
    oauthScopes: undefined,
    oauthJti: undefined,
    oauthClientId: undefined,
  });
}

function mockRes(): {
  res: Response;
  statusSpy: ReturnType<typeof vi.fn>;
  jsonSpy: ReturnType<typeof vi.fn>;
  setSpy: ReturnType<typeof vi.fn>;
} {
  const jsonSpy = vi.fn().mockReturnThis();
  const setSpy = vi.fn().mockReturnThis();
  const statusSpy = vi.fn();
  const res = partialMock<Response>({
    status: statusSpy,
    json: jsonSpy,
    set: setSpy,
  });
  statusSpy.mockReturnValue(res);
  setSpy.mockReturnValue(res);
  return { res, statusSpy, jsonSpy, setSpy };
}

const mockNext: NextFunction = vi.fn();

describe('oauthAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 with WWW-Authenticate when no Authorization header', async () => {
    const req = mockReq();
    const { res, statusSpy } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('includes resource_metadata in WWW-Authenticate on 401', async () => {
    const req = mockReq();
    const { res, setSpy } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    const wwwHeader = vi.mocked(setSpy).mock.calls[0][1] as string;
    expect(wwwHeader).toContain('resource_metadata=');
  });

  it('returns 401 when Authorization header is malformed (no Bearer)', async () => {
    const req = mockReq('Basic dXNlcjpwYXNz');
    const { res, statusSpy } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it('returns 401 with error=invalid_token when OauthAuthenticationError thrown', async () => {
    vi.mocked(ServiceFactory.getOauthService).mockReturnValue({
      verifyAccessToken: vi.fn().mockRejectedValue(new OauthAuthenticationError('Token revoked')),
    } as never);

    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue({ id: 'user-123', username: 'testuser' }),
    } as never);

    const req = mockReq('Bearer validtoken');
    const { res, jsonSpy } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_token' }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('populates req and calls next() on valid token', async () => {
    vi.mocked(ServiceFactory.getOauthService).mockReturnValue({
      verifyAccessToken: vi.fn().mockResolvedValue({
        userId: 'user-123',
        scopes: ['mcp:read'],
        jti: 'jti-abc',
        clientId: 'mcp_client',
        expiresAt: Date.now() + 3600000,
      }),
    } as never);

    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue({
      findByUserId: vi
        .fn()
        .mockResolvedValue({ id: 'user-123', username: 'testuser', securitystamp: 'stamp' }),
    } as never);

    const req = mockReq('Bearer validtoken');
    const { res } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    expect(req.user).toEqual({ id: 'user-123', username: 'testuser' });
    expect(req.isOauth).toBe(true);
    expect(req.oauthScopes).toContain('mcp:read');
    expect(req.oauthJti).toBe('jti-abc');
    expect(req.oauthClientId).toBe('mcp_client');
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('uses empty string username when user not found', async () => {
    vi.mocked(ServiceFactory.getOauthService).mockReturnValue({
      verifyAccessToken: vi.fn().mockResolvedValue({
        userId: 'user-123',
        scopes: ['mcp:read'],
        jti: 'jti-abc',
        clientId: 'mcp_client',
        expiresAt: Date.now() + 3600000,
      }),
    } as never);

    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue(null),
    } as never);

    const req = mockReq('Bearer validtoken');
    const { res } = mockRes();

    await oauthAuthMiddleware(req, res, mockNext);

    expect(req.user).toEqual({ id: 'user-123', username: '' });
    expect(mockNext).toHaveBeenCalledOnce();
  });
});
