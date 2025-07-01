import { authenticateToken } from '../authMiddleware';
import * as httpMocks from 'node-mocks-http';
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

jest.mock('jsonwebtoken');

jest.mock('@prisma/client', () => {
  const mockFindUnique = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      aspnetusers: { findUnique: mockFindUnique },
    })),
    mockFindUnique,
  };
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mockFindUnique: mockPrismaFindUnique } = require('@prisma/client') as {
  mockFindUnique: jest.Mock;
};

describe('authenticateToken middleware', () => {
  const JWT_SECRET = 'test-secret'; // pragma: allowlist secret
  const userId = 'user123';
  const username = 'testuser';
  // const expiredToken = 'expired.jwt.token'; // removed unused variable

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('returns 401 if no token is provided', async () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
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
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid');
    });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer invalid.token` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();
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
    (jwt.verify as jest.Mock).mockReturnValue({ userId, username });
    mockPrismaFindUnique.mockResolvedValue(null);
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer valid.jwt.token` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();
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
    (jwt.verify as jest.Mock).mockReturnValue({ userId, username });
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
    const next = jest.fn();
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
    (jwt.verify as jest.Mock).mockReturnValue({ userId, username });
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
    const next = jest.fn();
    await authenticateToken(
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: userId, username });
  });
});
