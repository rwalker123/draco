import { Request, Response, NextFunction } from 'express';
import * as httpMocks from 'node-mocks-http';
import { domainRouting } from '../domainRouting';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    accountsurl: {
      findFirst: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const mockPrisma = (PrismaClient as jest.Mock).mock.results[0].value;
const mockFindFirst = mockPrisma.accountsurl.findFirst;

describe('domainRouting middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next if no host header', async () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue(undefined);
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
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue('example.com');
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
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue('example.com');
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
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue('example.com');
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
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue('example.com');
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
    const next = jest.fn();
    req.get = jest.fn().mockReturnValue('example.com');
    mockFindFirst.mockRejectedValue(new Error('fail'));
    await domainRouting(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalled();
  });
});
