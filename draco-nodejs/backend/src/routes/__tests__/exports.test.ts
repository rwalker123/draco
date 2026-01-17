import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { ROLE_IDS } from '../../config/roles.js';
import { RoleNamesType } from '../../types/roles.js';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'user-1', username: 'tester' };
    next();
  },
}));

vi.mock('../../lib/prisma.js', () => ({
  default: {
    leagueseason: {
      findFirst: vi.fn(),
    },
    season: {
      findFirst: vi.fn(),
    },
  },
}));

const createRouteProtectionMock = () => {
  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();

  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    const accountId = req.params.accountId ? BigInt(req.params.accountId as string) : 1n;
    const contactId = BigInt(contactBoundaryId);
    req.accountBoundary = {
      accountId,
      contactId,
      enforced: true,
    };
    req.user = req.user ?? { id: 'user-1', username: 'tester' };
    req.userRoles = req.userRoles ?? {
      globalRoles: [],
      contactRoles: [],
    };
    next();
  };

  const requirePermission =
    (permission: string) => (_req: Request, _res: Response, next: NextFunction) => {
      lastPermissionRequested = permission;
      if (_req.userRoles) {
        _req.userRoles.contactRoles.push({
          id: '1',
          roleId: ACCOUNT_ADMIN_ROLE_ID,
          roleName: RoleNamesType.ACCOUNT_ADMIN,
          roleData: _req.accountBoundary?.accountId?.toString() ?? '1',
          accountId: _req.accountBoundary?.accountId?.toString() ?? '1',
          contact: { id: (_req.accountBoundary?.contactId ?? 1n).toString() },
        });
      }
      next();
    };

  return {
    enforceAccountBoundary,
    requirePermission,
    enforceTeamBoundary: () => passThrough(),
    enforceLeagueBoundary: () => passThrough(),
    enforceAccountOwner: () => passThrough(),
    requireAccountAdmin: () => passThrough(),
    requireAccountPhotoAdmin: () => passThrough(),
    requireAdministrator: () => passThrough(),
    requireTeamAdmin: () => passThrough(),
    requireTeamPhotoAdmin: () => passThrough(),
    requireLeagueAdmin: () => passThrough(),
    requirePollManagerAccess: () => passThrough(),
    requireRole: () => passThrough(),
    requireAuth: () => passThrough(),
  };
};

const ACCOUNT_ADMIN_ROLE_ID = 'account-admin-role';
let contactBoundaryId = 2n;
let lastPermissionRequested: string | null = null;

const csvExportServiceMock = {
  exportTeamRoster: vi.fn(),
  exportLeagueRoster: vi.fn(),
  exportSeasonRoster: vi.fn(),
  exportLeagueManagers: vi.fn(),
  exportSeasonManagers: vi.fn(),
};

let app: Express;
let router: Router;

let prismaMock: any;

describe('Exports routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] = ACCOUNT_ADMIN_ROLE_ID;

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getCsvExportService').mockReturnValue(csvExportServiceMock as never);

    const prismaModule = await import('../../lib/prisma.js');
    prismaMock = prismaModule.default;

    const routerModule = await import('../exports.js');
    router = routerModule.default;

    app = express();
    app.use(express.json());
    app.use('/api/accounts/:accountId/seasons/:seasonId', router);
  });

  beforeEach(() => {
    contactBoundaryId = 2n;
    lastPermissionRequested = null;
    Object.values(csvExportServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    prismaMock.leagueseason.findFirst.mockReset();
    prismaMock.season.findFirst.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const runRoute = async (
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    {
      params = {},
      body = {},
      query = {},
      headers = {},
    }: {
      params?: Record<string, string>;
      body?: unknown;
      query?: Record<string, unknown>;
      headers?: Record<string, string>;
    },
  ) => {
    const layer = (router.stack as any[]).find(
      (stackLayer) =>
        stackLayer.route && stackLayer.route.path === path && stackLayer.route.methods[method],
    );

    if (!layer) {
      throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
    }

    if (!layer.route) {
      throw new Error(`Route ${method.toUpperCase()} ${path} does not have a handler`);
    }

    const handlers: Array<(req: Request, res: Response, next: NextFunction) => unknown> =
      layer.route.stack.map((stack: any) => stack.handle);

    const req = {
      method: method.toUpperCase(),
      params,
      body,
      query,
      headers,
      get(headerName: string) {
        const key = headerName.toLowerCase();
        return headers[headerName] ?? headers[key];
      },
    } as unknown as Request;

    type MockResponse = Response & {
      body: unknown;
      statusCode: number;
      headers: Record<string, unknown>;
    };

    const res = {
      statusCode: 200,
      headers: {} as Record<string, unknown>,
      body: undefined as unknown,
      status(code: number) {
        (this as MockResponse).statusCode = code;
        return this;
      },
      json(payload: unknown) {
        (this as MockResponse).body = payload;
        return this;
      },
      send(payload: unknown) {
        (this as MockResponse).body = payload;
        return this;
      },
      set(field: string, value: unknown) {
        (this as MockResponse).headers[field] = value;
        return this;
      },
      setHeader(field: string, value: unknown) {
        (this as MockResponse).headers[field] = value;
      },
    } as unknown as MockResponse;

    for (const handler of handlers) {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const next: NextFunction = (err?: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        };

        try {
          const result = handler(req, res, next);
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            (result as Promise<unknown>)
              .then(() => {
                next();
              })
              .catch((error) => {
                next(error);
              });
          }
          if (!settled) {
            queueMicrotask(() => {
              if (!settled) {
                settled = true;
                resolve();
              }
            });
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    return { req, res };
  };

  describe('GET /leagues/:leagueSeasonId/roster/export', () => {
    it('exports league roster as CSV', async () => {
      const csvBuffer = Buffer.from('Full Name,Email\nJohn Doe,john@example.com');
      prismaMock.leagueseason.findFirst.mockResolvedValue({
        id: 50n,
        league: { name: 'Spring League' },
      });
      csvExportServiceMock.exportLeagueRoster.mockResolvedValue({
        buffer: csvBuffer,
        fileName: 'spring-league-roster.csv',
      });

      const { res } = await runRoute('get', '/leagues/:leagueSeasonId/roster/export', {
        params: { accountId: '1', seasonId: '1', leagueSeasonId: '50' },
        headers: { authorization: 'Bearer token' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('spring-league-roster.csv');
      expect(res.body).toEqual(csvBuffer);
      expect(lastPermissionRequested).toBe('manage-users');
    });
  });

  describe('GET /leagues/:leagueSeasonId/managers/export', () => {
    it('exports league managers as CSV', async () => {
      const csvBuffer = Buffer.from('Full Name,Email\nJane Smith,jane@example.com');
      prismaMock.leagueseason.findFirst.mockResolvedValue({
        id: 50n,
        league: { name: 'Spring League' },
      });
      csvExportServiceMock.exportLeagueManagers.mockResolvedValue({
        buffer: csvBuffer,
        fileName: 'spring-league-managers.csv',
      });

      const { res } = await runRoute('get', '/leagues/:leagueSeasonId/managers/export', {
        params: { accountId: '1', seasonId: '1', leagueSeasonId: '50' },
        headers: { authorization: 'Bearer token' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('spring-league-managers.csv');
      expect(res.body).toEqual(csvBuffer);
      expect(lastPermissionRequested).toBe('manage-users');
    });
  });

  describe('GET /roster/export', () => {
    it('exports season roster as CSV', async () => {
      const csvBuffer = Buffer.from('Full Name,Email\nJohn Doe,john@example.com');
      prismaMock.season.findFirst.mockResolvedValue({
        id: 1n,
        name: 'Spring 2024',
      });
      csvExportServiceMock.exportSeasonRoster.mockResolvedValue({
        buffer: csvBuffer,
        fileName: 'spring-2024-roster.csv',
      });

      const { res } = await runRoute('get', '/roster/export', {
        params: { accountId: '1', seasonId: '1' },
        headers: { authorization: 'Bearer token' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('spring-2024-roster.csv');
      expect(res.body).toEqual(csvBuffer);
      expect(lastPermissionRequested).toBe('manage-users');
    });
  });

  describe('GET /managers/export', () => {
    it('exports season managers as CSV', async () => {
      const csvBuffer = Buffer.from('Full Name,Email\nJane Smith,jane@example.com');
      prismaMock.season.findFirst.mockResolvedValue({
        id: 1n,
        name: 'Spring 2024',
      });
      csvExportServiceMock.exportSeasonManagers.mockResolvedValue({
        buffer: csvBuffer,
        fileName: 'spring-2024-managers.csv',
      });

      const { res } = await runRoute('get', '/managers/export', {
        params: { accountId: '1', seasonId: '1' },
        headers: { authorization: 'Bearer token' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('spring-2024-managers.csv');
      expect(res.body).toEqual(csvBuffer);
      expect(lastPermissionRequested).toBe('manage-users');
    });
  });

  describe('authorization', () => {
    it('requires manage-users permission for league roster export', async () => {
      prismaMock.leagueseason.findFirst.mockResolvedValue({
        id: 50n,
        league: { name: 'Spring League' },
      });
      csvExportServiceMock.exportLeagueRoster.mockResolvedValue({
        buffer: Buffer.from(''),
        fileName: 'test.csv',
      });

      await runRoute('get', '/leagues/:leagueSeasonId/roster/export', {
        params: { accountId: '1', seasonId: '1', leagueSeasonId: '50' },
        headers: { authorization: 'Bearer token' },
      });

      expect(lastPermissionRequested).toBe('manage-users');
    });

    it('requires manage-users permission for league managers export', async () => {
      prismaMock.leagueseason.findFirst.mockResolvedValue({
        id: 50n,
        league: { name: 'Spring League' },
      });
      csvExportServiceMock.exportLeagueManagers.mockResolvedValue({
        buffer: Buffer.from(''),
        fileName: 'test.csv',
      });

      await runRoute('get', '/leagues/:leagueSeasonId/managers/export', {
        params: { accountId: '1', seasonId: '1', leagueSeasonId: '50' },
        headers: { authorization: 'Bearer token' },
      });

      expect(lastPermissionRequested).toBe('manage-users');
    });

    it('requires manage-users permission for season roster export', async () => {
      prismaMock.season.findFirst.mockResolvedValue({
        id: 1n,
        name: 'Spring 2024',
      });
      csvExportServiceMock.exportSeasonRoster.mockResolvedValue({
        buffer: Buffer.from(''),
        fileName: 'test.csv',
      });

      await runRoute('get', '/roster/export', {
        params: { accountId: '1', seasonId: '1' },
        headers: { authorization: 'Bearer token' },
      });

      expect(lastPermissionRequested).toBe('manage-users');
    });

    it('requires manage-users permission for season managers export', async () => {
      prismaMock.season.findFirst.mockResolvedValue({
        id: 1n,
        name: 'Spring 2024',
      });
      csvExportServiceMock.exportSeasonManagers.mockResolvedValue({
        buffer: Buffer.from(''),
        fileName: 'test.csv',
      });

      await runRoute('get', '/managers/export', {
        params: { accountId: '1', seasonId: '1' },
        headers: { authorization: 'Bearer token' },
      });

      expect(lastPermissionRequested).toBe('manage-users');
    });
  });
});
