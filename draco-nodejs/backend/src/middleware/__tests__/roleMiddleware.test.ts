import { Request, Response, NextFunction } from 'express';
import * as httpMocks from 'node-mocks-http';
import { RoleMiddleware } from '../roleMiddleware';
import { IRoleMiddleware } from '../../interfaces/roleInterfaces';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Note: MOCK_ROLE_IDS removed as they're no longer needed after removing enforceAccountBoundary tests

const mockHasRole = vi.fn();
const mockHasPermission = vi.fn();
const mockGetUserRoles = vi.fn();
// Note: mockCheckAccountOwnership removed as enforceAccountBoundary is now in RouteProtection

const mockRoleService = {
  hasRole: mockHasRole,
  hasPermission: mockHasPermission,
  getUserRoles: mockGetUserRoles,
  getGlobalRoles: vi.fn(),
  getContactRoles: vi.fn(),
  getUsersWithRole: vi.fn(),
  getRoleName: vi.fn(),
  getRoleId: vi.fn(),
  hasRoleOrHigher: vi.fn(),
} as unknown as IRoleMiddleware;

// Note: mockPrisma removed as it's no longer needed after removing enforceAccountBoundary tests

const roleMiddleware = new RoleMiddleware(mockRoleService);

// Note: RoleMiddleware class now focuses on core role checking functionality
// with duplicated methods consolidated in RouteProtection class

describe('RoleMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = vi.fn();
      await roleMiddleware.requireRole('SomeRole')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().error).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if user does not have required role', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasRole.mockResolvedValue({ hasRole: false });
      await roleMiddleware.requireRole('SomeRole')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().error).toMatch(/Insufficient permissions/);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if user has required role', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasRole.mockResolvedValue({ hasRole: true });
      mockGetUserRoles.mockResolvedValue({ globalRoles: ['SomeRole'], contactRoles: [] });
      await roleMiddleware.requireRole('SomeRole')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });

    it('returns 500 on error', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasRole.mockRejectedValue(new Error('fail'));
      await roleMiddleware.requireRole('SomeRole')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().error).toMatch(/Internal server error/);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = vi.fn();
      await roleMiddleware.requirePermission('perm')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().error).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if user does not have required permission', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasPermission.mockResolvedValue(false);
      await roleMiddleware.requirePermission('perm')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().error).toMatch(/Insufficient permissions/);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if user has required permission', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasPermission.mockResolvedValue(true);
      mockGetUserRoles.mockResolvedValue({ globalRoles: ['SomeRole'], contactRoles: [] });
      await roleMiddleware.requirePermission('perm')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });

    it('returns 500 on error', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = vi.fn();
      mockHasPermission.mockRejectedValue(new Error('fail'));
      await roleMiddleware.requirePermission('perm')(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().error).toMatch(/Internal server error/);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Note: enforceAccountBoundary tests have been moved to routeProtection.test.ts
  // to avoid duplication as the functionality is now consolidated there
});
