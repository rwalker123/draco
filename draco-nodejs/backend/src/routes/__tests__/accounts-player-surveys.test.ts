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
  optionalAuth: (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      req.user = { id: 'user-1', username: 'tester' };
    }
    next();
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

const playerSurveyServiceMock = {
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  listPlayerSurveys: vi.fn(),
  getPlayerSurvey: vi.fn(),
  resolveViewerContext: vi.fn(),
  upsertAnswer: vi.fn(),
  deleteAnswer: vi.fn(),
  getAccountSpotlight: vi.fn(),
  getTeamSpotlight: vi.fn(),
};

let app: Express;
let router: Router;

describe('Accounts player surveys routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] = ACCOUNT_ADMIN_ROLE_ID;

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getPlayerSurveyService').mockReturnValue(
      playerSurveyServiceMock as never,
    );

    const routerModule = await import('../accounts-player-surveys.js');
    router = routerModule.default;

    app = express();
    app.use(express.json());
    app.use('/api/accounts', router);
  });

  beforeEach(() => {
    contactBoundaryId = 2n;
    lastPermissionRequested = null;
    Object.values(playerSurveyServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
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
    const layer = router.stack.find(
      (stackLayer: any) =>
        stackLayer.route && stackLayer.route.path === path && stackLayer.route.methods[method],
    );

    if (!layer) {
      throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
    }

    if (!layer.route) {
      throw new Error(`Route ${method.toUpperCase()} ${path} does not have a handler`);
    }

    const handlers: Array<(req: Request, res: Response, next: NextFunction) => unknown> =
      layer.route.stack.map(
        (stack: any) =>
          stack.handle as (req: Request, res: Response, next: NextFunction) => unknown,
      );

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

  it('returns survey categories for account admins', async () => {
    const categories = [
      {
        id: '1',
        accountId: '1',
        categoryName: 'Favorites',
        priority: 1,
        questions: [],
      },
    ];
    playerSurveyServiceMock.listCategories.mockResolvedValue(categories);

    const { res } = await runRoute('get', '/:accountId/surveys/categories', {
      params: { accountId: '1' },
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    expect(playerSurveyServiceMock.listCategories).toHaveBeenCalledWith(1n);
    expect(res.body).toEqual(categories);
  });

  it('returns survey categories without authentication', async () => {
    const categories = [
      {
        id: '1',
        accountId: '1',
        categoryName: 'Favorites',
        priority: 1,
        questions: [],
      },
    ];
    playerSurveyServiceMock.listCategories.mockResolvedValue(categories);

    const { res } = await runRoute('get', '/:accountId/surveys/categories', {
      params: { accountId: '1' },
    });

    expect(res.statusCode).toBe(200);
    expect(playerSurveyServiceMock.listCategories).toHaveBeenCalledWith(1n);
    expect(res.body).toEqual(categories);
  });

  it('creates a survey category when permission granted', async () => {
    const created = {
      id: '10',
      accountId: '1',
      categoryName: 'Favorites',
      priority: 0,
      questions: [],
    };
    playerSurveyServiceMock.createCategory.mockResolvedValue(created);

    const { res } = await runRoute('post', '/:accountId/surveys/categories', {
      params: { accountId: '1' },
      headers: { authorization: 'Bearer token' },
      body: { categoryName: 'Favorites', priority: 0 },
    });

    expect(lastPermissionRequested).toBe('account.player-surveys.manage');
    expect(playerSurveyServiceMock.createCategory).toHaveBeenCalledWith(1n, {
      categoryName: 'Favorites',
      priority: 0,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('lists player surveys without authentication', async () => {
    const listResponse = {
      surveys: [],
      pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    };
    playerSurveyServiceMock.listPlayerSurveys.mockResolvedValue(listResponse);

    const { res } = await runRoute('get', '/:accountId/surveys/answers', {
      params: { accountId: '1' },
    });

    expect(res.statusCode).toBe(200);
    expect(playerSurveyServiceMock.listPlayerSurveys).toHaveBeenCalledWith(1n, {
      page: 1,
      pageSize: 20,
      search: undefined,
    });
    expect(res.body).toEqual(listResponse);
  });

  it('upserts player survey answer using account boundary contact', async () => {
    const answer = {
      questionId: '10',
      categoryId: '1',
      categoryName: 'Favorites',
      question: 'Favorite food?',
      questionNumber: 1,
      answer: 'Pizza',
    };
    playerSurveyServiceMock.upsertAnswer.mockResolvedValue(answer);

    const payload = { answer: 'Pizza' };

    const { res } = await runRoute(
      'put',
      '/:accountId/surveys/answers/:playerId/questions/:questionId',
      {
        params: { accountId: '1', playerId: '2', questionId: '10' },
        headers: { authorization: 'Bearer token' },
        body: payload,
      },
    );

    expect(playerSurveyServiceMock.upsertAnswer).toHaveBeenCalledWith(1n, 2n, 10n, payload, {
      contactId: 2n,
      isAccountAdmin: false,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(answer);
  });
});
