import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { AuthenticationError, AuthorizationError } from '../../utils/customErrors.js';
import { ZodError } from 'zod';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    req.user = { id: 'user-1', username: 'tester' };
    next();
  },
}));

const createRouteProtectionMock = () => {
  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    const accountId = req.params.accountId ? BigInt(req.params.accountId) : 1n;
    req.accountBoundary = {
      accountId,
      contactId: 123n,
      enforced: true,
    };
    req.user = req.user ?? { id: 'user-1', username: 'tester' };
    next();
  };

  const requirePermission = (permission: string) => {
    return (req: Request, _res: Response, next: NextFunction) => {
      lastPermissionRequested = permission;
      if (!req.headers.authorization) {
        next(new AuthenticationError('Authentication required'));
        return;
      }
      next();
    };
  };

  const requireAnyPermission = (permissions: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
      lastPermissionRequested = permissions.join(',');
      if (!req.headers.authorization) {
        next(new AuthorizationError('One of the required permissions is missing'));
        return;
      }
      next();
    };
  };

  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();

  return {
    enforceAccountBoundary,
    requirePermission,
    requireAnyPermission,
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

const welcomeMessageServiceMock = {
  listAccountMessages: vi.fn(),
  getAccountMessage: vi.fn(),
  createAccountMessage: vi.fn(),
  updateAccountMessage: vi.fn(),
  deleteAccountMessage: vi.fn(),
  listTeamMessages: vi.fn(),
  getTeamMessage: vi.fn(),
  createTeamMessage: vi.fn(),
  updateTeamMessage: vi.fn(),
  deleteTeamMessage: vi.fn(),
  resolveTeamContext: vi.fn(),
};

let accountRouter: Router;
let teamRouter: Router;
let app: Express;
let lastPermissionRequested: string | null = null;

describe('Welcome messages routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getWelcomeMessageService').mockReturnValue(
      welcomeMessageServiceMock as never,
    );

    const accountModule = await import('../accounts-welcome-messages.js');
    accountRouter = accountModule.default;
    const teamModule = await import('../team-welcome-messages.js');
    teamRouter = teamModule.default;

    app = express();
    app.use(express.json());
    app.use('/api/accounts', accountRouter);
    app.use('/api/accounts', teamRouter);
  });

  beforeEach(() => {
    lastPermissionRequested = null;
    Object.values(welcomeMessageServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    welcomeMessageServiceMock.resolveTeamContext.mockResolvedValue({ teamId: 77n, seasonId: 88n });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const runRoute = async (
    router: Router,
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    {
      params = {},
      body = {},
      headers = {},
    }: {
      params?: Record<string, string>;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ) => {
    const layer = router.stack.find(
      (stackLayer: any) =>
        stackLayer.route && stackLayer.route.path === path && stackLayer.route.methods[method],
    );

    if (!layer?.route) {
      throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
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

  it('lists account welcome messages without authentication', async () => {
    const messages = [{ id: '1', caption: 'Hello' }];
    welcomeMessageServiceMock.listAccountMessages.mockResolvedValue(messages);

    const { res } = await runRoute(accountRouter, 'get', '/:accountId/welcome-messages', {
      params: { accountId: '5' },
    });

    expect(lastPermissionRequested).toBeNull();
    expect(welcomeMessageServiceMock.listAccountMessages).toHaveBeenCalledWith(5n);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ welcomeMessages: messages });
  });

  it('gets an account welcome message without authentication', async () => {
    const message = { id: '2', caption: 'Hi' };
    welcomeMessageServiceMock.getAccountMessage.mockResolvedValue(message);

    const { res } = await runRoute(
      accountRouter,
      'get',
      '/:accountId/welcome-messages/:messageId',
      {
        params: { accountId: '9', messageId: '33' },
      },
    );

    expect(lastPermissionRequested).toBeNull();
    expect(welcomeMessageServiceMock.getAccountMessage).toHaveBeenCalledWith(9n, 33n);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(message);
  });

  it('rejects invalid account welcome message payload', async () => {
    await expect(
      runRoute(accountRouter, 'post', '/:accountId/welcome-messages', {
        params: { accountId: '1' },
        headers: { authorization: 'Bearer token' },
        body: { caption: '', order: 1, bodyHtml: '' },
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('creates an account welcome message when authorized', async () => {
    const payload = { caption: 'Hi', order: 1, bodyHtml: '<p>Welcome</p>' };
    const created = { id: '1', caption: 'Hi', bodyHtml: '<p>Welcome</p>' };
    welcomeMessageServiceMock.createAccountMessage.mockResolvedValue(created);

    const { res } = await runRoute(accountRouter, 'post', '/:accountId/welcome-messages', {
      params: { accountId: '1' },
      headers: { authorization: 'Bearer token' },
      body: payload,
    });

    expect(lastPermissionRequested).toBe('account.communications.manage');
    expect(welcomeMessageServiceMock.createAccountMessage).toHaveBeenCalledWith(1n, payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('updates an account welcome message when authorized', async () => {
    const payload = { caption: 'Updated', order: 2, bodyHtml: '<p>Updated</p>' };
    const updated = { id: '1', caption: 'Updated', bodyHtml: '<p>Updated</p>' };
    welcomeMessageServiceMock.updateAccountMessage.mockResolvedValue(updated);

    const { res } = await runRoute(
      accountRouter,
      'put',
      '/:accountId/welcome-messages/:messageId',
      {
        params: { accountId: '1', messageId: '9' },
        headers: { authorization: 'Bearer token' },
        body: payload,
      },
    );

    expect(lastPermissionRequested).toBe('account.communications.manage');
    expect(welcomeMessageServiceMock.updateAccountMessage).toHaveBeenCalledWith(1n, 9n, payload);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('deletes an account welcome message when authorized', async () => {
    welcomeMessageServiceMock.deleteAccountMessage.mockResolvedValue(undefined);

    const { res } = await runRoute(
      accountRouter,
      'delete',
      '/:accountId/welcome-messages/:messageId',
      {
        params: { accountId: '4', messageId: '12' },
        headers: { authorization: 'Bearer token' },
      },
    );

    expect(lastPermissionRequested).toBe('account.communications.manage');
    expect(welcomeMessageServiceMock.deleteAccountMessage).toHaveBeenCalledWith(4n, 12n);
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeUndefined();
  });

  it('fails account welcome message creation without authentication', async () => {
    await expect(
      runRoute(accountRouter, 'post', '/:accountId/welcome-messages', {
        params: { accountId: '1' },
        body: { caption: 'Hi', order: 1, bodyHtml: '<p>Welcome</p>' },
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('lists team welcome messages with resolved context without authentication', async () => {
    const teamMessages = [{ id: '10', caption: 'Team hello' }];
    welcomeMessageServiceMock.listTeamMessages.mockResolvedValue(teamMessages);

    const { res } = await runRoute(
      teamRouter,
      'get',
      '/:accountId/teams/:teamSeasonId/welcome-messages',
      {
        params: { accountId: '3', teamSeasonId: '42' },
      },
    );

    expect(lastPermissionRequested).toBeNull();
    expect(welcomeMessageServiceMock.resolveTeamContext).toHaveBeenCalledWith(3n, 42n);
    expect(welcomeMessageServiceMock.listTeamMessages).toHaveBeenCalledWith(3n, 42n, {
      teamId: 77n,
      seasonId: 88n,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ welcomeMessages: teamMessages });
  });

  it('gets a team welcome message without authentication', async () => {
    const teamMessage = { id: '11', caption: 'Team message' };
    welcomeMessageServiceMock.getTeamMessage.mockResolvedValue(teamMessage);

    const { res } = await runRoute(
      teamRouter,
      'get',
      '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
      {
        params: { accountId: '4', teamSeasonId: '21', messageId: '8' },
      },
    );

    expect(lastPermissionRequested).toBeNull();
    expect(welcomeMessageServiceMock.resolveTeamContext).toHaveBeenCalledWith(4n, 21n);
    expect(welcomeMessageServiceMock.getTeamMessage).toHaveBeenCalledWith(4n, 21n, 8n, {
      teamId: 77n,
      seasonId: 88n,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(teamMessage);
  });

  it('creates a team welcome message when authorized', async () => {
    const payload = { caption: 'Team', order: 3, bodyHtml: '<p>Team</p>' };
    const created = { id: '10', caption: 'Team', bodyHtml: '<p>Team</p>' };
    welcomeMessageServiceMock.createTeamMessage.mockResolvedValue(created);

    const { res } = await runRoute(
      teamRouter,
      'post',
      '/:accountId/teams/:teamSeasonId/welcome-messages',
      {
        params: { accountId: '2', teamSeasonId: '11' },
        headers: { authorization: 'Bearer token' },
        body: payload,
      },
    );

    expect(lastPermissionRequested).toBe('account.communications.manage,league.manage,team.manage');
    expect(welcomeMessageServiceMock.resolveTeamContext).toHaveBeenCalledWith(2n, 11n);
    expect(welcomeMessageServiceMock.createTeamMessage).toHaveBeenCalledWith(2n, 11n, payload, {
      teamId: 77n,
      seasonId: 88n,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('rejects team welcome message creation without authentication', async () => {
    await expect(
      runRoute(teamRouter, 'post', '/:accountId/teams/:teamSeasonId/welcome-messages', {
        params: { accountId: '2', teamSeasonId: '11' },
        headers: {},
        body: { caption: 'Team', order: 1, bodyHtml: '<p>Team</p>' },
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects team welcome message update when payload invalid', async () => {
    welcomeMessageServiceMock.updateTeamMessage.mockResolvedValue({
      id: '1',
      caption: 'Updated',
    });

    await expect(
      runRoute(teamRouter, 'put', '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId', {
        params: { accountId: '2', teamSeasonId: '11', messageId: '5' },
        headers: { authorization: 'Bearer token' },
        body: { caption: '', order: 1, bodyHtml: '' },
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('updates a team welcome message when authorized', async () => {
    const payload = { caption: 'Updated Team', order: 4, bodyHtml: '<p>Updated</p>' };
    const updated = { id: '1', caption: 'Updated Team', bodyHtml: '<p>Updated</p>' };
    welcomeMessageServiceMock.updateTeamMessage.mockResolvedValue(updated);

    const { res } = await runRoute(
      teamRouter,
      'put',
      '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
      {
        params: { accountId: '3', teamSeasonId: '15', messageId: '7' },
        headers: { authorization: 'Bearer token' },
        body: payload,
      },
    );

    expect(lastPermissionRequested).toBe('account.communications.manage,league.manage,team.manage');
    expect(welcomeMessageServiceMock.resolveTeamContext).toHaveBeenCalledWith(3n, 15n);
    expect(welcomeMessageServiceMock.updateTeamMessage).toHaveBeenCalledWith(3n, 15n, 7n, payload, {
      teamId: 77n,
      seasonId: 88n,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('deletes a team welcome message when authorized', async () => {
    welcomeMessageServiceMock.deleteTeamMessage.mockResolvedValue(undefined);

    const { res } = await runRoute(
      teamRouter,
      'delete',
      '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
      {
        params: { accountId: '5', teamSeasonId: '22', messageId: '9' },
        headers: { authorization: 'Bearer token' },
      },
    );

    expect(lastPermissionRequested).toBe('account.communications.manage,league.manage,team.manage');
    expect(welcomeMessageServiceMock.resolveTeamContext).toHaveBeenCalledWith(5n, 22n);
    expect(welcomeMessageServiceMock.deleteTeamMessage).toHaveBeenCalledWith(5n, 22n, 9n, {
      teamId: 77n,
      seasonId: 88n,
    });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeUndefined();
  });
});
