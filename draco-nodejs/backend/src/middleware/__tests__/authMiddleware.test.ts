import { authenticateToken } from '../authMiddleware.js';
import httpMocks from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {},
  },
}));

vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockClient = {
    aspnetusers: { findUnique: mockFindUnique },
    $extends: vi.fn().mockReturnThis(),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockClient),
    mockFindUnique,
  };
});
const { mockFindUnique: mockPrismaFindUnique } = (await import('@prisma/client')) as unknown as {
  mockFindUnique: any;
};

describe('authenticateToken middleware', () => {
  const JWT_SECRET = 'test-secret'; // pragma: allowlist secret
  const userId = 'user123';
  const username = 'testuser';
  // const expiredToken = 'expired.jwt.token'; // removed unused variable

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('returns 401 if no token is provided', async () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = vi.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().message).toMatch(/Access token required/);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token is invalid', async () => {
    (jwt.verify as any).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid');
    });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer invalid.token` },
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().message).toMatch(/Invalid token/);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if user not found', async () => {
    (jwt.verify as any).mockReturnValue({ userId, username });
    mockPrismaFindUnique.mockResolvedValue(null);
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer valid.jwt.token` },
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().message).toMatch(/User not found/);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if user is locked out', async () => {
    (jwt.verify as any).mockReturnValue({ userId, username });
    mockPrismaFindUnique.mockResolvedValue({
      id: userId,
      username,
      lockoutenabled: true,
      lockoutenddateutc: new Date(Date.now() + 100000),
    });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer valid.jwt.token` },
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().message).toMatch(/Account is temporarily locked/);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches user if token and user are valid', async () => {
    (jwt.verify as any).mockReturnValue({ userId, username });
    mockPrismaFindUnique.mockResolvedValue({
      id: userId,
      username,
      lockoutenabled: false,
      lockoutenddateutc: null,
    });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer valid.jwt.token` },
    });
    const res = httpMocks.createResponse();
    const next = vi.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: userId, username });
  });
});
