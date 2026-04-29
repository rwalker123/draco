import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../utils/customErrors.js';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      next(new AuthorizationError('Access denied'));
      return;
    }
    req.user = { id: (req.headers['x-user-id'] as string) ?? 'user-1', username: 'tester' };
    next();
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      req.user = { id: (req.headers['x-user-id'] as string) ?? 'user-1', username: 'tester' };
    }
    next();
  },
}));

const createRouteProtectionMock = () => {
  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();
  return {
    enforceAccountBoundary: passThrough,
    enforceTeamBoundary: passThrough,
    requirePermission: () => passThrough(),
    enforceLeagueBoundary: passThrough,
    enforceAccountOwner: passThrough,
  };
};

const scheduleServiceMock = {
  listSeasonGames: vi.fn(),
  updateGameResults: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
  getGameRecap: vi.fn(),
  upsertGameRecap: vi.fn(),
};

const roleServiceMock = {
  hasPermission: vi.fn(),
};

const seasonServiceMock = {
  findSeasonById: vi.fn(),
  isScheduleHiddenForCurrentSeason: vi.fn(),
};

const defaultSeason = {
  id: '25',
  name: 'Test Season',
  accountId: '10',
  scheduleVisible: true,
};

const ACCOUNT_ID = '10';
const SEASON_ID = '25';

const defaultGamesResponse = {
  games: [{ id: '1', homeTeam: 'A', awayTeam: 'B' }],
  pagination: { total: 1, page: 1, limit: 20 },
};

describe('games visibility', () => {
  let app: Express;
  let router: Router;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getScheduleService').mockReturnValue(scheduleServiceMock as never);
    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(roleServiceMock as never);
    vi.spyOn(ServiceFactory, 'getSeasonService').mockReturnValue(seasonServiceMock as never);

    const routerModule = await import('../games.js');
    router = routerModule.default;

    app = express();
    app.use(express.json());
    app.use(`/api/accounts/:accountId/seasons/:seasonId/games`, router);

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof AuthorizationError) {
        res.status(403).json({ message: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err instanceof ValidationError) {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message });
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  type RouteLayer = {
    route?: {
      path: string;
      methods: Record<string, boolean>;
      stack: Array<{ handle: (req: Request, res: Response, next: NextFunction) => unknown }>;
    };
  };

  const runGamesRoute = async (
    options: {
      userId?: string;
      hasManagePermission?: boolean;
      isHiddenCurrentSeason?: boolean;
      withAuth?: boolean;
      routePath?: string;
    } = {},
  ) => {
    const {
      userId = 'user-1',
      hasManagePermission = false,
      isHiddenCurrentSeason = false,
      withAuth = true,
      routePath = '/',
    } = options;

    roleServiceMock.hasPermission.mockResolvedValue(hasManagePermission);
    seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(isHiddenCurrentSeason);

    const layer = (router.stack as RouteLayer[]).find(
      (stackLayer) =>
        stackLayer.route && stackLayer.route.path === routePath && stackLayer.route.methods['get'],
    );

    if (!layer?.route) {
      throw new Error(`Route GET ${routePath} not found`);
    }

    const handlers = layer.route.stack.map((s) => s.handle);

    const headers: Record<string, string> = withAuth
      ? { authorization: 'Bearer token', 'x-user-id': userId }
      : {};

    const reqPartial: Partial<Request> = {
      method: 'GET',
      params: {
        accountId: ACCOUNT_ID,
        seasonId: SEASON_ID,
      },
      query: {},
      headers,
      get: ((headerName: string) => headers[headerName.toLowerCase()]) as Request['get'],
    };
    const req = reqPartial as Request;

    if (withAuth) {
      req.user = { id: userId, username: 'tester' };
    }

    interface MockResponseExtras {
      body?: unknown;
    }
    type MockResponse = Response & MockResponseExtras;

    const resPartial: Partial<Response> & MockResponseExtras = {
      statusCode: 200,
      body: undefined,
      status(code: number) {
        resPartial.statusCode = code;
        return res;
      },
      json(payload: unknown) {
        resPartial.body = payload;
        return res;
      },
      send(payload: unknown) {
        resPartial.body = payload;
        return res;
      },
    };
    const res = resPartial as MockResponse;

    let lastError: unknown = null;

    for (const handler of handlers) {
      await new Promise<void>((resolve) => {
        let settled = false;

        const settle = (err?: unknown) => {
          if (settled) return;
          settled = true;
          if (err) lastError = err;
          resolve();
        };

        const next: NextFunction = (err?: unknown) => settle(err);

        const originalJson = res.json.bind(res);
        res.json = ((payload: unknown) => {
          const r = originalJson(payload);
          settle();
          return r;
        }) as Response['json'];

        try {
          const ret = handler(req, res, next);
          if (ret && typeof (ret as Promise<unknown>).then === 'function') {
            (ret as Promise<unknown>).catch((err) => settle(err));
          }
        } catch (err) {
          settle(err);
        }
      });

      if (lastError) break;
    }

    return { req, res, error: lastError };
  };

  describe('GET / (public season games)', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      scheduleServiceMock.listSeasonGames.mockResolvedValue(defaultGamesResponse);
      roleServiceMock.hasPermission.mockResolvedValue(false);
      seasonServiceMock.findSeasonById.mockResolvedValue(defaultSeason);
      seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(false);
    });

    it('returns games when season is visible and caller is unauthenticated', async () => {
      const { res } = await runGamesRoute({
        withAuth: false,
        isHiddenCurrentSeason: false,
      });

      expect(res.body).toEqual(defaultGamesResponse);
      expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
    });

    it('returns empty games when current season is hidden and caller is unauthenticated', async () => {
      const { res } = await runGamesRoute({
        withAuth: false,
        isHiddenCurrentSeason: true,
      });

      expect(res.body).toEqual({
        games: [],
        pagination: { total: 0, page: 1, limit: 50 },
      });
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
    });

    it('returns games when season is hidden but season is NOT current (historical access)', async () => {
      const { res } = await runGamesRoute({
        withAuth: false,
        isHiddenCurrentSeason: false,
      });

      expect(res.body).toEqual(defaultGamesResponse);
      expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
    });

    it('returns empty games when current season is hidden, even for an authenticated AccountAdmin', async () => {
      const { res } = await runGamesRoute({
        withAuth: true,
        hasManagePermission: true,
        isHiddenCurrentSeason: true,
      });

      expect(res.body).toEqual({
        games: [],
        pagination: { total: 0, page: 1, limit: 50 },
      });
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
    });

    it('does not consult roleService.hasPermission on the public route', async () => {
      await runGamesRoute({
        withAuth: true,
        hasManagePermission: true,
        isHiddenCurrentSeason: false,
      });

      expect(roleServiceMock.hasPermission).not.toHaveBeenCalled();
    });

    it('returns games when season is visible and authenticated caller hits the public route', async () => {
      const { res } = await runGamesRoute({
        withAuth: true,
        isHiddenCurrentSeason: false,
      });

      expect(res.body).toEqual(defaultGamesResponse);
      expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
    });

    it('returns 404 when seasonId does not belong to accountId', async () => {
      seasonServiceMock.findSeasonById.mockResolvedValue(null);

      const { res, error } = await runGamesRoute({
        withAuth: true,
        isHiddenCurrentSeason: false,
      });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
      expect(res.body).toBeUndefined();
    });

    it('returns 404 for unauthenticated callers when seasonId belongs to another account', async () => {
      seasonServiceMock.findSeasonById.mockResolvedValue(null);

      const { error } = await runGamesRoute({
        withAuth: false,
      });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(seasonServiceMock.isScheduleHiddenForCurrentSeason).not.toHaveBeenCalled();
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
    });
  });

  describe('GET /manage (season games for management)', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      scheduleServiceMock.listSeasonGames.mockResolvedValue(defaultGamesResponse);
      roleServiceMock.hasPermission.mockResolvedValue(true);
      seasonServiceMock.findSeasonById.mockResolvedValue(defaultSeason);
      seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(false);
    });

    it('returns games when current season is visible', async () => {
      const { res } = await runGamesRoute({
        routePath: '/manage',
        withAuth: true,
        hasManagePermission: true,
        isHiddenCurrentSeason: false,
      });

      expect(res.body).toEqual(defaultGamesResponse);
      expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
    });

    it('returns games when current season is hidden (visibility toggle does not gate management)', async () => {
      const { res } = await runGamesRoute({
        routePath: '/manage',
        withAuth: true,
        hasManagePermission: true,
        isHiddenCurrentSeason: true,
      });

      expect(res.body).toEqual(defaultGamesResponse);
      expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
      expect(seasonServiceMock.isScheduleHiddenForCurrentSeason).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated requests via authenticateToken', async () => {
      const { error } = await runGamesRoute({
        routePath: '/manage',
        withAuth: false,
      });

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
    });

    it('returns 404 when seasonId does not belong to accountId', async () => {
      seasonServiceMock.findSeasonById.mockResolvedValue(null);

      const { error } = await runGamesRoute({
        routePath: '/manage',
        withAuth: true,
        hasManagePermission: true,
      });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
    });
  });
});
