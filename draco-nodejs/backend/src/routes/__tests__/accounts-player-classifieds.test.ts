import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { AuthorizationError } from '../../utils/customErrors.js';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'user-1', username: 'tester' };
    next();
  },
}));

vi.mock('../../middleware/rateLimitMiddleware.js', () => ({
  teamsWantedRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const VALID_ACCESS_CODE = 'abcdefghij1234567890';

type BoundaryBehavior = 'allow' | 'deny';
type PermissionBehavior = 'allow' | 'deny';

let boundaryBehavior: BoundaryBehavior = 'allow';
let permissionBehavior: PermissionBehavior = 'allow';
let lastPermissionRequested: string | null = null;

const createRouteProtectionMock = () => {
  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    if (boundaryBehavior === 'deny') {
      next(new AuthorizationError('Access denied to this account'));
      return;
    }
    const accountId = req.params.accountId ? BigInt(req.params.accountId as string) : 1n;
    req.accountBoundary = {
      accountId,
      contactId: 2n,
      enforced: true,
    };
    next();
  };

  const requirePermission =
    (permission: string) => (_req: Request, _res: Response, next: NextFunction) => {
      lastPermissionRequested = permission;
      if (permissionBehavior === 'deny') {
        next(new AuthorizationError(`Permission '${permission}' required`));
        return;
      }
      next();
    };

  return { enforceAccountBoundary, requirePermission };
};

const playerClassifiedServiceMock = {
  getTeamsWantedContactInfo: vi.fn(),
  verifyTeamsWantedAccess: vi.fn(),
  updateTeamsWanted: vi.fn(),
  deleteTeamsWanted: vi.fn(),
};

let app: Express;
let router: Router;

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
  const layer = router.stack.find((stackLayer: unknown) => {
    const l = stackLayer as { route?: { path: string; methods: Record<string, boolean> } };
    return Boolean(l.route && l.route.path === path && l.route.methods[method]);
  });

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  type MinimalRequest = {
    method: string;
    params: Record<string, string>;
    body: unknown;
    query: Record<string, unknown>;
    headers: Record<string, string>;
    get: (headerName: string) => string | undefined;
    user?: Request['user'];
    accountBoundary?: Request['accountBoundary'];
  };

  type MockResponse = {
    body: unknown;
    statusCode: number;
    headers: Record<string, unknown>;
    status(code: number): MockResponse;
    json(payload: unknown): MockResponse;
    send(payload: unknown): MockResponse;
    set(field: string, value: unknown): MockResponse;
    setHeader(field: string, value: unknown): void;
  };

  type RouteHandler = (req: MinimalRequest, res: MockResponse, next: NextFunction) => unknown;

  const layerRoute = (layer as { route: { stack: Array<{ handle: unknown }> } }).route;
  const handlers = layerRoute.stack.map((s) => s.handle as RouteHandler);

  const req: MinimalRequest = {
    method: method.toUpperCase(),
    params,
    body,
    query,
    headers,
    get(headerName: string) {
      const key = headerName.toLowerCase();
      return headers[headerName] ?? headers[key];
    },
  };

  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
    set(field: string, value: unknown) {
      this.headers[field] = value;
      return this;
    },
    setHeader(field: string, value: unknown) {
      this.headers[field] = value;
    },
  };

  let caughtError: unknown = null;

  for (const handler of handlers) {
    if (caughtError) break;

    await new Promise<void>((resolve) => {
      let settled = false;
      const next: NextFunction = (err?: unknown) => {
        if (settled) return;
        settled = true;
        if (err) caughtError = err;
        resolve();
      };

      try {
        const result = handler(req, res, next);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>)
            .then(() => {
              if (!settled) {
                settled = true;
                resolve();
              }
            })
            .catch((error) => {
              if (!settled) {
                settled = true;
                caughtError = error;
                resolve();
              }
            });
        } else if (!settled) {
          queueMicrotask(() => {
            if (!settled) {
              settled = true;
              resolve();
            }
          });
        }
      } catch (error) {
        if (!settled) {
          settled = true;
          caughtError = error;
          resolve();
        }
      }
    });
  }

  return { req, res, error: caughtError };
};

describe('Accounts player classifieds routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getPlayerClassifiedService').mockReturnValue(
      playerClassifiedServiceMock as never,
    );

    const routerModule = await import('../accounts-player-classifieds.js');
    router = routerModule.default;

    app = express();
    app.use(express.json());
    app.use('/api/accounts/:accountId/player-classifieds', router);
  });

  beforeEach(() => {
    boundaryBehavior = 'allow';
    permissionBehavior = 'allow';
    lastPermissionRequested = null;
    Object.values(playerClassifiedServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('GET /teams-wanted/:classifiedId/contact', () => {
    const path = '/teams-wanted/:classifiedId/contact';
    const params = { accountId: '1', classifiedId: '42' };
    const contactInfo = { email: 'p@example.com', phone: '555-1234' };

    it('returns contact info for an authenticated account member without manage permission', async () => {
      // Account boundary passes (member), but the manage permission would be denied.
      // The contact route must NOT require that permission.
      boundaryBehavior = 'allow';
      permissionBehavior = 'deny';
      playerClassifiedServiceMock.getTeamsWantedContactInfo.mockResolvedValue(contactInfo);

      const { res, error } = await runRoute('get', path, {
        params,
        headers: { authorization: 'Bearer token' },
      });

      expect(error).toBeNull();
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(contactInfo);
      expect(playerClassifiedServiceMock.getTeamsWantedContactInfo).toHaveBeenCalledWith(42n, 1n);
      expect(lastPermissionRequested).toBeNull();
    });

    it('returns contact info for an AccountAdmin', async () => {
      boundaryBehavior = 'allow';
      permissionBehavior = 'allow';
      playerClassifiedServiceMock.getTeamsWantedContactInfo.mockResolvedValue(contactInfo);

      const { res, error } = await runRoute('get', path, {
        params,
        headers: { authorization: 'Bearer token' },
      });

      expect(error).toBeNull();
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(contactInfo);
    });

    it('rejects an authenticated non-member without an access code', async () => {
      boundaryBehavior = 'deny';
      playerClassifiedServiceMock.getTeamsWantedContactInfo.mockResolvedValue(contactInfo);

      const { error } = await runRoute('get', path, {
        params,
        headers: { authorization: 'Bearer token' },
      });

      expect(error).toBeTruthy();
      expect(playerClassifiedServiceMock.getTeamsWantedContactInfo).not.toHaveBeenCalled();
    });

    it('requires server-side access-code verification when an authenticated non-member supplies an access code', async () => {
      boundaryBehavior = 'deny';
      playerClassifiedServiceMock.verifyTeamsWantedAccess.mockResolvedValue({});
      playerClassifiedServiceMock.getTeamsWantedContactInfo.mockResolvedValue(contactInfo);

      const { res, error } = await runRoute('get', path, {
        params,
        query: { accessCode: VALID_ACCESS_CODE },
        headers: { authorization: 'Bearer token' },
      });

      expect(error).toBeNull();
      expect(res.statusCode).toBe(200);
      expect(playerClassifiedServiceMock.verifyTeamsWantedAccess).toHaveBeenCalledWith(
        42n,
        VALID_ACCESS_CODE,
        1n,
      );
      expect(playerClassifiedServiceMock.getTeamsWantedContactInfo).toHaveBeenCalledWith(42n, 1n);
    });

    it('does not return contact info when an authenticated non-member access-code verification fails', async () => {
      boundaryBehavior = 'deny';
      let verifyCalled = false;
      playerClassifiedServiceMock.verifyTeamsWantedAccess.mockImplementation(async () => {
        verifyCalled = true;
        throw new AuthorizationError('Invalid access code');
      });

      await runRoute('get', path, {
        params,
        query: { accessCode: VALID_ACCESS_CODE },
        headers: { authorization: 'Bearer token' },
      });

      await new Promise((resolve) => setImmediate(resolve));

      expect(verifyCalled).toBe(true);
      expect(playerClassifiedServiceMock.getTeamsWantedContactInfo).not.toHaveBeenCalled();
    });

    it('returns contact info for an unauthenticated request with a valid access code', async () => {
      playerClassifiedServiceMock.verifyTeamsWantedAccess.mockResolvedValue({});
      playerClassifiedServiceMock.getTeamsWantedContactInfo.mockResolvedValue(contactInfo);

      const { res, error } = await runRoute('get', path, {
        params,
        query: { accessCode: VALID_ACCESS_CODE },
      });

      expect(error).toBeNull();
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(contactInfo);
    });

    it('rejects an unauthenticated request without an access code', async () => {
      const { error } = await runRoute('get', path, { params });

      expect(error).toBeTruthy();
      expect(playerClassifiedServiceMock.getTeamsWantedContactInfo).not.toHaveBeenCalled();
    });
  });

  describe('moderation routes still require player-classified.manage or an access code', () => {
    it('PUT /teams-wanted/:classifiedId falls back to access-code requirement when the permission is denied', async () => {
      boundaryBehavior = 'allow';
      permissionBehavior = 'deny';

      const { error } = await runRoute('put', '/teams-wanted/:classifiedId', {
        params: { accountId: '1', classifiedId: '42' },
        headers: { authorization: 'Bearer token' },
        body: {
          name: 'Test',
          experience: 'Beginner',
          positionsPlayed: 'Pitcher',
          birthDate: new Date('1995-01-01').toISOString(),
        },
      });

      expect(error).toBeTruthy();
      expect(lastPermissionRequested).toBe('player-classified.manage');
      expect(playerClassifiedServiceMock.updateTeamsWanted).not.toHaveBeenCalled();
    });

    it('DELETE /teams-wanted/:classifiedId falls back to access-code requirement when the permission is denied', async () => {
      boundaryBehavior = 'allow';
      permissionBehavior = 'deny';

      const { error } = await runRoute('delete', '/teams-wanted/:classifiedId', {
        params: { accountId: '1', classifiedId: '42' },
        headers: { authorization: 'Bearer token' },
        body: {},
      });

      expect(error).toBeTruthy();
      expect(lastPermissionRequested).toBe('player-classified.manage');
      expect(playerClassifiedServiceMock.deleteTeamsWanted).not.toHaveBeenCalled();
    });
  });
});
