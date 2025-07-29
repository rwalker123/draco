import { Request, Response, NextFunction } from 'express';
import * as httpMocks from 'node-mocks-http';
import { RouteProtection } from '../routeProtection';
import { RoleService } from '../../services/roleService';
import { PrismaClient } from '@prisma/client';

// Mock role IDs for testing
const MOCK_ROLE_IDS = {
  Administrator: 'admin-role-id',
  AccountAdmin: 'account-admin-role-id',
  LeagueAdmin: 'league-admin-role-id',
  TeamAdmin: 'team-admin-role-id',
};

const mockHasRole = jest.fn();
const mockHasPermission = jest.fn();
const mockGetUserRoles = jest.fn();
const mockCheckAccountOwnership = jest.fn();

const mockRoleService = {
  hasRole: mockHasRole,
  hasPermission: mockHasPermission,
  getUserRoles: mockGetUserRoles,
};

const mockPrisma = {};

const routeProtection = new RouteProtection(
  mockRoleService as unknown as RoleService,
  mockPrisma as unknown as PrismaClient,
);

describe('RouteProtection middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(
        routeProtection as unknown as {
          checkAccountOwnership: (userId: string, accountId: bigint) => Promise<boolean>;
        },
        'checkAccountOwnership',
      )
      .mockImplementation(mockCheckAccountOwnership);
  });

  describe('requireAuth', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await routeProtection.requireAuth()(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });
    it('calls next if user is authenticated', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await routeProtection.requireAuth()(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await routeProtection.requireRole('AccountAdmin')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });
    it('returns 403 if user does not have required role', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockHasRole.mockResolvedValue({ hasRole: false });
      await routeProtection.requireRole('AccountAdmin')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toMatch(/Role 'AccountAdmin' required/);
      expect(next).not.toHaveBeenCalled();
    });
    it('calls next if user has required role', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockHasRole.mockResolvedValue({ hasRole: true });
      mockGetUserRoles.mockResolvedValue({
        globalRoles: [MOCK_ROLE_IDS.AccountAdmin],
        contactRoles: [],
      });
      await routeProtection.requireRole('AccountAdmin')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await routeProtection.requirePermission('account.manage')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });
    it('returns 403 if user does not have required permission', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockHasPermission.mockResolvedValue(false);
      await routeProtection.requirePermission('account.manage')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toMatch(/Permission 'account.manage' required/);
      expect(next).not.toHaveBeenCalled();
    });
    it('calls next if user has required permission', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockHasPermission.mockResolvedValue(true);
      mockGetUserRoles.mockResolvedValue({
        globalRoles: [MOCK_ROLE_IDS.AccountAdmin],
        contactRoles: [],
      });
      await routeProtection.requirePermission('account.manage')(
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });
  });
});
