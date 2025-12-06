import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import httpMocks from 'node-mocks-http';
import type { Request, Response, NextFunction } from 'express';
import { createFrontendBaseUrlMiddleware } from '../frontendBaseUrlMiddleware.js';
import { OriginAllowList } from '../../utils/originAllowList.js';
import { AccountBaseUrlResolver } from '../../services/utils/accountBaseUrlResolver.js';
import { getFrontendBaseUrlFromContext } from '../../utils/frontendBaseUrlContext.js';

describe('frontendBaseUrlMiddleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  let originAllowList: OriginAllowList;
  let next: NextFunction;

  const buildReqRes = (path = '/api/test', headers: Record<string, string> = {}) => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: path,
      headers,
    }) as unknown as Request;
    const res = httpMocks.createResponse() as unknown as Response;
    return { req, res };
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    originAllowList = new OriginAllowList();
    vi.spyOn(originAllowList, 'isAllowed').mockResolvedValue(true);
    next = vi.fn(() => {
      // read context inside next to validate AsyncLocalStorage propagation
      getFrontendBaseUrlFromContext();
    }) as unknown as NextFunction;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
    vi.restoreAllMocks();
  });

  it('skips non-API routes', async () => {
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    const { req, res } = buildReqRes('/health');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as Request).frontendBaseUrl).toBeUndefined();
    expect(res.statusCode).toBe(200);
  });

  it('allows missing base URL header without error', async () => {
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    const { req, res } = buildReqRes('/api/test');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as Request).frontendBaseUrl).toBeUndefined();
    expect(res.statusCode).toBe(200);
  });

  it('rejects non-https origins in production', async () => {
    process.env.NODE_ENV = 'production';
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    const { req, res } = buildReqRes('/api/test', { 'x-frontend-base-url': 'http://example.com' });

    await middleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect((res as any)._getData()).toContain('https');
  });

  it('rejects invalid origins', async () => {
    process.env.NODE_ENV = 'production';
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    // Force normalize to return an invalid URL so the URL constructor throws
    const spy = vi.spyOn(AccountBaseUrlResolver, 'normalizeBaseUrl').mockReturnValue('nota-url');
    const { req, res } = buildReqRes('/api/test', { 'x-frontend-base-url': 'nota-url' });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    spy.mockRestore();
  });

  it('rejects disallowed origins in production', async () => {
    process.env.NODE_ENV = 'production';
    (originAllowList.isAllowed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    const { req, res } = buildReqRes('/api/test', { 'x-frontend-base-url': 'https://blocked.com' });

    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
  });

  it('stores normalized base URL in request and context when allowed', async () => {
    process.env.NODE_ENV = 'production';
    (originAllowList.isAllowed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const middleware = createFrontendBaseUrlMiddleware({ originAllowList });
    const { req, res } = buildReqRes('/api/test', {
      'x-frontend-base-url': 'https://tenant.example.com/',
    });

    await middleware(req, res, () => {
      next();
      expect(getFrontendBaseUrlFromContext()).toBe('https://tenant.example.com');
    });

    expect(next).toHaveBeenCalled();
    expect((req as Request).frontendBaseUrl).toBe('https://tenant.example.com');
    expect(res.statusCode).toBe(200);
  });
});
