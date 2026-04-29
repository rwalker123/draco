import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { ValidationError, AuthorizationError } from '../../utils/customErrors.js';

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

const teamServiceMock = {
  validateTeamSeasonBasic: vi.fn(),
  getTeamSeasonDetails: vi.fn(),
};

const scheduleServiceMock = {
  listSeasonGames: vi.fn(),
};

const roleServiceMock = {
  hasPermission: vi.fn(),
};

const seasonServiceMock = {
  isScheduleHiddenForCurrentSeason: vi.fn(),
};

const teamStatsServiceMock = {
  getTeamGames: vi.fn(),
  getTeamBattingStats: vi.fn(),
  getTeamPitchingStats: vi.fn(),
};

const ACCOUNT_ID = '10';
const SEASON_ID = '25';
const TEAM_SEASON_ID = '50';

const defaultGamesResponse = {
  games: [{ id: '1', homeTeam: 'A', awayTeam: 'B' }],
  pagination: { total: 1, page: 1, limit: 20 },
};

let app: Express;
let router: Router;

describe('GET /:teamSeasonId/schedule - visibility guard', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getTeamService').mockReturnValue(teamServiceMock as never);
    vi.spyOn(ServiceFactory, 'getScheduleService').mockReturnValue(scheduleServiceMock as never);
    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(roleServiceMock as never);
    vi.spyOn(ServiceFactory, 'getSeasonService').mockReturnValue(seasonServiceMock as never);
    vi.spyOn(ServiceFactory, 'getTeamStatsService').mockReturnValue(teamStatsServiceMock as never);

    const routerModule = await import('../team-stats.js');
    router = routerModule.default;

    app = express();
    app.use(express.json());
    app.use(`/api/accounts/:accountId/seasons/:seasonId/teams`, router);

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof AuthorizationError) {
        res.status(403).json({ message: err.message });
        return;
      }
      if (err instanceof ValidationError) {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    teamServiceMock.validateTeamSeasonBasic.mockResolvedValue(undefined);
    scheduleServiceMock.listSeasonGames.mockResolvedValue(defaultGamesResponse);
    roleServiceMock.hasPermission.mockResolvedValue(false);
    seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(false);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const runScheduleRoute = async (
    options: {
      userId?: string;
      hasManagePermission?: boolean;
      isHiddenCurrentSeason?: boolean;
    } = {},
  ) => {
    const {
      userId = 'user-1',
      hasManagePermission = false,
      isHiddenCurrentSeason = false,
    } = options;

    roleServiceMock.hasPermission.mockResolvedValue(hasManagePermission);
    seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(isHiddenCurrentSeason);

    const layer = (
      router.stack as Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
          stack: Array<{ handle: (req: Request, res: Response, next: NextFunction) => unknown }>;
        };
      }>
    ).find(
      (stackLayer) =>
        stackLayer.route &&
        stackLayer.route.path === '/:teamSeasonId/schedule' &&
        stackLayer.route.methods['get'],
    );

    if (!layer?.route) {
      throw new Error('Route GET /:teamSeasonId/schedule not found');
    }

    const handlers = layer.route.stack.map((s) => s.handle);

    const reqPartial: Partial<Request> = {
      method: 'GET',
      params: {
        accountId: ACCOUNT_ID,
        seasonId: SEASON_ID,
        teamSeasonId: TEAM_SEASON_ID,
      },
      query: {},
      headers: { authorization: 'Bearer token', 'x-user-id': userId },
      get: ((headerName: string) => {
        const headers: Record<string, string> = {
          authorization: 'Bearer token',
          'x-user-id': userId,
        };
        return headers[headerName.toLowerCase()];
      }) as Request['get'],
    };
    const req = reqPartial as Request;
    req.user = { id: userId, username: 'tester' };

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

  it('returns empty schedule when season is hidden, season is current, and caller lacks manage permission', async () => {
    const { res } = await runScheduleRoute({
      hasManagePermission: false,
      isHiddenCurrentSeason: true,
    });

    expect(res.body).toEqual({
      games: [],
      pagination: { total: 0, page: 1, limit: 50 },
    });
    expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
  });

  it('returns full schedule when season is hidden, season is current, but caller has account.games.manage', async () => {
    const { res } = await runScheduleRoute({
      hasManagePermission: true,
      isHiddenCurrentSeason: true,
    });

    expect(res.body).toEqual(defaultGamesResponse);
    expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
    expect(roleServiceMock.hasPermission).toHaveBeenCalledWith('user-1', 'account.games.manage', {
      accountId: BigInt(ACCOUNT_ID),
    });
  });

  it('returns full schedule when season is hidden but season is NOT current (historical access)', async () => {
    const { res } = await runScheduleRoute({
      hasManagePermission: false,
      isHiddenCurrentSeason: false,
    });

    expect(res.body).toEqual(defaultGamesResponse);
    expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
  });

  it('returns full schedule when season is visible and is current for non-admin user', async () => {
    seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(false);

    const { res } = await runScheduleRoute({
      hasManagePermission: false,
      isHiddenCurrentSeason: false,
    });

    expect(res.body).toEqual(defaultGamesResponse);
    expect(scheduleServiceMock.listSeasonGames).toHaveBeenCalled();
  });

  it('skips visibility check entirely when caller has account.games.manage', async () => {
    const { res } = await runScheduleRoute({
      hasManagePermission: true,
      isHiddenCurrentSeason: true,
    });

    expect(seasonServiceMock.isScheduleHiddenForCurrentSeason).not.toHaveBeenCalled();
    expect(res.body).toEqual(defaultGamesResponse);
  });

  it('treats unauthenticated caller as non-admin and applies visibility guard', async () => {
    roleServiceMock.hasPermission.mockResolvedValue(false);
    seasonServiceMock.isScheduleHiddenForCurrentSeason.mockResolvedValue(true);

    const layer = (
      router.stack as Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
          stack: Array<{ handle: (req: Request, res: Response, next: NextFunction) => unknown }>;
        };
      }>
    ).find(
      (stackLayer) =>
        stackLayer.route &&
        stackLayer.route.path === '/:teamSeasonId/schedule' &&
        stackLayer.route.methods['get'],
    );

    if (!layer?.route) {
      throw new Error('Route GET /:teamSeasonId/schedule not found');
    }

    const handlers = layer.route.stack.map((s) => s.handle);

    const reqPartial: Partial<Request> = {
      method: 'GET',
      params: {
        accountId: ACCOUNT_ID,
        seasonId: SEASON_ID,
        teamSeasonId: TEAM_SEASON_ID,
      },
      query: {},
      headers: {},
      get: ((_headerName: string) => undefined) as Request['get'],
    };
    const req = reqPartial as Request;

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

    expect(res.body).toEqual({
      games: [],
      pagination: { total: 0, page: 1, limit: 50 },
    });
    expect(scheduleServiceMock.listSeasonGames).not.toHaveBeenCalled();
  });

  it('returns empty response with correct pagination shape when schedule is hidden', async () => {
    const { res } = await runScheduleRoute({
      hasManagePermission: false,
      isHiddenCurrentSeason: true,
    });

    const body = res.body as { games: unknown[]; pagination: { total: number } };
    expect(body).toHaveProperty('games');
    expect(body).toHaveProperty('pagination');
    expect(Array.isArray(body.games)).toBe(true);
    expect(body.games).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });
});
