import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { partialMock } from '../../test-utils/partialMock.js';

vi.mock('../../middleware/oauthAuthMiddleware.js', () => ({
  verifyOauthBearer: vi.fn(),
  buildWwwAuthenticate: vi.fn(
    (code?: string, desc?: string) =>
      `Bearer realm="draco"${code ? `, error="${code}"` : ''}${desc ? `, error_description="${desc}"` : ''}, resource_metadata="test"`,
  ),
}));

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: vi.fn(),
}));

import { verifyOauthBearer } from '../../middleware/oauthAuthMiddleware.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { authenticateAny, requireGet } from '../../middleware/authenticateAny.js';
import { OauthAuthenticationError } from '../../services/oauthErrors.js';
import jwt from 'jsonwebtoken';

function makeReq(authHeader?: string, method = 'GET'): Request {
  return partialMock<Request>({
    headers: authHeader ? { authorization: authHeader } : {},
    method,
    user: undefined,
    isOauth: undefined,
    oauthScopes: undefined,
    oauthJti: undefined,
    oauthClientId: undefined,
  });
}

function makeRes(): {
  res: Response;
  statusSpy: ReturnType<typeof vi.fn>;
  jsonSpy: ReturnType<typeof vi.fn>;
  setSpy: ReturnType<typeof vi.fn>;
} {
  const jsonSpy = vi.fn().mockReturnThis();
  const setSpy = vi.fn();
  const statusSpy = vi.fn();
  const res = partialMock<Response>({ status: statusSpy, json: jsonSpy, set: setSpy });
  statusSpy.mockReturnValue(res);
  setSpy.mockReturnValue(res);
  return { res, statusSpy, jsonSpy, setSpy };
}

function makeOauthToken(): string {
  return jwt.sign(
    {
      sub: 'user-123',
      aud: 'mcp',
      iss: 'test',
      scope: 'mcp:read',
      client_id: 'client',
      jti: 'jti',
    },
    'secret',
    { algorithm: 'HS256' },
  );
}

function makeUserToken(): string {
  return jwt.sign({ userId: 'user-123', username: 'test', securityStamp: 'stamp' }, 'secret', {
    algorithm: 'HS256',
  });
}

describe('authenticateAny', () => {
  const nextFn: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header', async () => {
    const req = makeReq();
    const { res, statusSpy } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it('routes to OAuth verifier when aud=mcp', async () => {
    const token = makeOauthToken();

    vi.mocked(verifyOauthBearer).mockImplementation(async (_rawToken, req) => {
      req.isOauth = true;
      req.user = { id: 'user-123', username: 'testuser' };
    });

    const req = makeReq(`Bearer ${token}`);
    const { res } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(verifyOauthBearer).toHaveBeenCalled();
    expect(authenticateToken).not.toHaveBeenCalled();
    expect(nextFn).toHaveBeenCalledOnce();
    expect(req.isOauth).toBe(true);
  });

  it('routes to standard JWT verifier when aud != mcp', async () => {
    const token = makeUserToken();
    vi.mocked(authenticateToken).mockImplementation((_req, _res, next) => {
      next();
      return Promise.resolve();
    });

    const req = makeReq(`Bearer ${token}`);
    const { res } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(authenticateToken).toHaveBeenCalled();
    expect(verifyOauthBearer).not.toHaveBeenCalled();
  });

  it('falls through to standard JWT path when token cannot be decoded', async () => {
    vi.mocked(authenticateToken).mockImplementation((_req, _res, next) => {
      next();
      return Promise.resolve();
    });

    const req = makeReq('Bearer malformed.token');
    const { res } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(authenticateToken).toHaveBeenCalled();
  });

  it('returns 401 on OAuth verifier failure', async () => {
    const token = makeOauthToken();

    vi.mocked(verifyOauthBearer).mockRejectedValue(new OauthAuthenticationError('Token revoked'));

    const req = makeReq(`Bearer ${token}`);
    const { res, statusSpy } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it('sets WWW-Authenticate header with resource_metadata on OAuth verifier failure', async () => {
    const token = makeOauthToken();

    vi.mocked(verifyOauthBearer).mockRejectedValue(new OauthAuthenticationError('Token revoked'));

    const req = makeReq(`Bearer ${token}`);
    const { res, setSpy, jsonSpy } = makeRes();

    await authenticateAny(req, res, nextFn);

    expect(setSpy).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Bearer'));
    expect(setSpy).toHaveBeenCalledWith(
      'WWW-Authenticate',
      expect.stringContaining('resource_metadata='),
    );
    expect(setSpy).toHaveBeenCalledWith(
      'WWW-Authenticate',
      expect.stringContaining('error="invalid_token"'),
    );
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'invalid_token', error_description: 'Token revoked' }),
    );
  });
});

describe('requireGet', () => {
  const nextFn: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows GET requests from OAuth tokens', () => {
    const req = makeReq(undefined, 'GET');
    req.isOauth = true;
    const { res, statusSpy } = makeRes();

    requireGet(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledOnce();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('blocks POST requests from OAuth tokens with 403', () => {
    const req = makeReq(undefined, 'POST');
    req.isOauth = true;
    const { res, statusSpy, jsonSpy } = makeRes();

    requireGet(req, res, nextFn);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ error: 'insufficient_scope' }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('allows POST requests from non-OAuth tokens', () => {
    const req = makeReq(undefined, 'POST');
    req.isOauth = undefined;
    const { res, statusSpy } = makeRes();

    requireGet(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledOnce();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('allows all methods when not OAuth (isOauth = false)', () => {
    const req = makeReq(undefined, 'DELETE');
    req.isOauth = false;
    const { res, statusSpy } = makeRes();

    requireGet(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledOnce();
    expect(statusSpy).not.toHaveBeenCalled();
  });
});

describe('authenticateAny enforceAccountBoundary compatibility', () => {
  it('req.user.id is set correctly from OAuth token for downstream middleware', async () => {
    const token = makeOauthToken();

    vi.mocked(verifyOauthBearer).mockImplementation(async (_rawToken, req) => {
      req.user = { id: 'user-fixed-id', username: 'fixeduser' };
      req.isOauth = true;
    });

    const req = makeReq(`Bearer ${token}`);
    const { res } = makeRes();

    const localNext: NextFunction = vi.fn();
    await authenticateAny(req, res, localNext);

    expect(req.user?.id).toBe('user-fixed-id');
    expect(req.user?.username).toBe('fixeduser');
  });
});
