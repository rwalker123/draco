import { Request, Response, NextFunction } from 'express';
import httpMocks from 'node-mocks-http';
import { domainRouting } from '../domainRouting.js';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    accountsurl: {
      findFirst: vi.fn(),
    },
    $extends: vi.fn().mockReturnThis(),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

const mockPrisma = (PrismaClient as any).mock.results[0].value;
const mockFindFirst = mockPrisma.accountsurl.findFirst;

describe('domainRouting middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next if no host header', async () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue(undefined);
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next if no matching accountUrl', async () => {
    const req = httpMocks.createRequest({ headers: { host: 'example.com' } });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue('example.com');
    mockFindFirst.mockResolvedValue(null);
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next for common paths', async () => {
    const req = httpMocks.createRequest({
      headers: { host: 'example.com' },
      method: 'GET',
      url: '/api/auth/login',
      path: '/api/auth/login',
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue('example.com');
    mockFindFirst.mockResolvedValue({
      accounts: { id: 123, name: 'Test', accounttypes: [] },
    });
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalled();
  });

  it('sets account context and calls next for API requests', async () => {
    const req = httpMocks.createRequest({
      headers: { host: 'example.com' },
      method: 'GET',
      url: '/api/something',
      path: '/api/something',
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue('example.com');
    mockFindFirst.mockResolvedValue({
      accounts: { id: 123, name: 'Test', accounttypes: [] },
    });
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(req.accountId).toBe('123');
    expect(req.account).toEqual({ id: 123, name: 'Test', accounttypes: [] });
    expect(next).toHaveBeenCalled();
  });

  it('redirects for frontend requests', async () => {
    const req = httpMocks.createRequest({
      headers: { host: 'example.com' },
      method: 'GET',
      url: '/somepage',
      path: '/somepage',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue('example.com');
    mockFindFirst.mockResolvedValue({
      accounts: { id: 123, name: 'Test', accounttypes: [] },
    });
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(res._getRedirectUrl()).toBe('/account/123/home');
  });

  it('calls next on error', async () => {
    const req = httpMocks.createRequest({ headers: { host: 'example.com' } });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    req.get = vi.fn().mockReturnValue('example.com');
    mockFindFirst.mockRejectedValue(new Error('fail'));
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalled();
  });
});
