import { Request, Response, NextFunction } from 'express';
import * as httpMocks from 'node-mocks-http';
import { RoleMiddleware } from '../roleMiddleware';
import { RoleService } from '../../services/roleService';
import { RoleType } from '../../types/roles';

const mockHasRole = jest.fn();
const mockHasPermission = jest.fn();
const mockGetUserRoles = jest.fn();
const mockCheckAccountOwnership = jest.fn();

const mockRoleService = {
  hasRole: mockHasRole,
  hasPermission: mockHasPermission,
  getUserRoles: mockGetUserRoles,
};

const roleMiddleware = new RoleMiddleware(mockRoleService as unknown as RoleService);

// Patch private method for enforceAccountBoundary
(
  roleMiddleware as unknown as { checkAccountOwnership: typeof mockCheckAccountOwnership }
).checkAccountOwnership = mockCheckAccountOwnership;

describe('RoleMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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
      const next = jest.fn();
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

  describe('enforceAccountBoundary', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().error).toMatch(/Authentication required/);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 if accountId is missing', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      const res = httpMocks.createResponse();
      const next = jest.fn();
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().error).toMatch(/Account ID required/);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if user is global admin', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      req.params.accountId = '123';
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockGetUserRoles.mockResolvedValue({
        globalRoles: [RoleType.ADMINISTRATOR],
        contactRoles: [],
      });
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });

    it('calls next if user has contact roles', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      req.params.accountId = '123';
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockGetUserRoles.mockResolvedValue({ globalRoles: [], contactRoles: [{}] });
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });

    it('calls next if user is account owner', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      req.params.accountId = '123';
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockGetUserRoles.mockResolvedValue({ globalRoles: [], contactRoles: [] });
      mockCheckAccountOwnership.mockResolvedValue(true);
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 if user is not allowed', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      req.params.accountId = '123';
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockGetUserRoles.mockResolvedValue({ globalRoles: [], contactRoles: [] });
      mockCheckAccountOwnership.mockResolvedValue(false);
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().error).toMatch(/Access denied/);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 on error', async () => {
      const req = httpMocks.createRequest();
      req.user = { id: 'user1', username: 'test' };
      req.params.accountId = '123';
      const res = httpMocks.createResponse();
      const next = jest.fn();
      mockGetUserRoles.mockRejectedValue(new Error('fail'));
      await roleMiddleware.enforceAccountBoundary()(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction,
      );
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().error).toMatch(/Internal server error/);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
