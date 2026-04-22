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
}));

const createRouteProtectionMock = () => {
  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();

  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    const accountId = req.params.accountId ? BigInt(req.params.accountId as string) : 1n;
    req.accountBoundary = { accountId, contactId: 1n, enforced: true };
    req.user = req.user ?? { id: 'user-1', username: 'tester' };
    next();
  };

  const enforceTeamBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers['x-deny-team-boundary']) {
      next(new AuthorizationError('Not a member of this team'));
      return;
    }
    next();
  };

  const requirePermission =
    (permission: string) => (req: Request, _res: Response, next: NextFunction) => {
      lastPermissionRequested = permission;
      if (!req.headers.authorization) {
        next(new AuthorizationError('Access denied'));
        return;
      }
      next();
    };

  return {
    enforceAccountBoundary,
    enforceTeamBoundary,
    requirePermission,
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
    requireAnyPermission: () => passThrough(),
  };
};

const emailServiceMock = {
  composeAndSendEmailFromUser: vi.fn(),
  getGroupContacts: vi.fn(),
  listTeamEmails: vi.fn(),
  getTeamEmail: vi.fn(),
};

const roleServiceMock = {
  hasPermission: vi.fn(),
};

let app: Express;
let router: Router;
let lastPermissionRequested: string | null = null;

const TEAM_A_ID = '10';
const TEAM_B_ID = '20';
const ACCOUNT_ID = '1';
const SEASON_ID = '5';

const baseComposeBody = {
  subject: 'Team Update',
  body: '<p>Hello team</p>',
  recipients: {
    seasonSelection: {
      teams: [TEAM_A_ID],
    },
  },
};

describe('Team emails routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getEmailService').mockReturnValue(emailServiceMock as never);
    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(roleServiceMock as never);

    const routerModule = await import('../team-emails.js');
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
    lastPermissionRequested = null;
    Object.values(emailServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    Object.values(roleServiceMock).forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    roleServiceMock.hasPermission.mockResolvedValue(true);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const runRoute = async (
    method: 'get' | 'post',
    path: string,
    {
      params = {},
      body = {},
      query = {},
      headers = {},
    }: {
      params?: Record<string, string>;
      body?: unknown;
      query?: Record<string, string>;
      headers?: Record<string, string>;
    },
  ) => {
    const layer = (router.stack as any[]).find(
      (stackLayer) =>
        stackLayer.route && stackLayer.route.path === path && stackLayer.route.methods[method],
    );

    if (!layer?.route) {
      throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
    }

    const handlers: Array<(req: Request, res: Response, next: NextFunction) => unknown> =
      layer.route.stack.map((stack: any) => stack.handle);

    const req = {
      method: method.toUpperCase(),
      params: {
        accountId: ACCOUNT_ID,
        seasonId: SEASON_ID,
        ...params,
      },
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
    } as unknown as MockResponse;

    let lastError: unknown = null;

    for (const handler of handlers) {
      await new Promise<void>((resolve) => {
        let settled = false;

        const settle = (err?: unknown) => {
          if (settled) return;
          settled = true;
          if (err) {
            lastError = err;
          }
          resolve();
        };

        const next: NextFunction = (err?: unknown) => settle(err);

        const originalJson = res.json.bind(res);
        (res as any).json = (payload: unknown) => {
          const r = originalJson(payload);
          settle();
          return r;
        };

        const originalSend = res.send.bind(res);
        (res as any).send = (payload: unknown) => {
          const r = originalSend(payload);
          settle();
          return r;
        };

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

  describe('POST /:teamSeasonId/emails/compose', () => {
    it('happy path: team admin for team A can compose an email targeting team A', async () => {
      emailServiceMock.composeAndSendEmailFromUser.mockResolvedValue(99n);

      const { res } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
        body: baseComposeBody,
      });

      expect(lastPermissionRequested).toBe('team.communications.send');
      expect(roleServiceMock.hasPermission).toHaveBeenCalledWith(
        expect.any(String),
        'team.communications.send',
        expect.objectContaining({ teamId: BigInt(TEAM_A_ID) }),
      );
      expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledWith(
        BigInt(ACCOUNT_ID),
        expect.any(String),
        expect.any(Object),
        { teamSeasonId: BigInt(TEAM_A_ID) },
      );
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ emailId: '99', status: 'sending' });
    });

    it('cross-team rejection: team admin for team A cannot compose against team B URL', async () => {
      roleServiceMock.hasPermission.mockResolvedValue(false);

      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_B_ID },
        headers: { authorization: 'Bearer token' },
        body: { ...baseComposeBody, recipients: { seasonSelection: { teams: [TEAM_B_ID] } } },
      });

      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('rejects compose when no authorization header is present', async () => {
      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: {},
        body: baseComposeBody,
      });

      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('rejects attachments in team emails', async () => {
      emailServiceMock.composeAndSendEmailFromUser.mockResolvedValue(1n);

      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
        body: {
          ...baseComposeBody,
          attachments: ['file-id-1'],
        },
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('Attachments are not supported');
    });

    it('rejects workoutRecipients in team emails', async () => {
      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
        body: {
          subject: 'Team Update',
          body: '<p>Hello</p>',
          recipients: {
            workoutRecipients: [{ workoutId: 'w1' }],
          },
        },
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('Workout recipients');
    });

    it('rejects seasonSelection with wrong team ID', async () => {
      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
        body: {
          subject: 'Test',
          body: '<p>Hello</p>',
          recipients: {
            seasonSelection: {
              teams: [TEAM_B_ID],
            },
          },
        },
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('does not match the route team');
    });

    it('rejects managersOnly in team emails', async () => {
      const { error } = await runRoute('post', '/:teamSeasonId/emails/compose', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
        body: {
          subject: 'Test',
          body: '<p>Hello</p>',
          recipients: {
            seasonSelection: {
              teams: [TEAM_A_ID],
              managersOnly: true,
            },
          },
        },
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('managersOnly');
    });
  });

  describe('GET /:teamSeasonId/emails/roster-contacts', () => {
    it('returns team roster contacts for authorized team member', async () => {
      const contacts = [{ id: '1', email: 'player@example.com' }];
      emailServiceMock.getGroupContacts.mockResolvedValue(contacts);

      const { res } = await runRoute('get', '/:teamSeasonId/emails/roster-contacts', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
      });

      expect(emailServiceMock.getGroupContacts).toHaveBeenCalledWith(
        BigInt(ACCOUNT_ID),
        BigInt(SEASON_ID),
        'team',
        TEAM_A_ID,
        false,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(contacts);
    });

    it('rejects roster-contacts request when no authorization header', async () => {
      const { error } = await runRoute('get', '/:teamSeasonId/emails/roster-contacts', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: {},
      });

      expect(error).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('GET /:teamSeasonId/emails/history', () => {
    it('returns only team A emails when requesting team A history', async () => {
      const teamAEmails = {
        items: [{ id: '100', teamSeasonId: TEAM_A_ID }],
        pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false },
      };
      emailServiceMock.listTeamEmails.mockResolvedValue(teamAEmails);

      const { res } = await runRoute('get', '/:teamSeasonId/emails/history', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: { authorization: 'Bearer token' },
      });

      expect(emailServiceMock.listTeamEmails).toHaveBeenCalledWith(
        BigInt(ACCOUNT_ID),
        BigInt(TEAM_A_ID),
        expect.objectContaining({ page: expect.any(Number), limit: expect.any(Number) }),
        undefined,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(teamAEmails);
    });

    it('rejects history request when no authorization header', async () => {
      const { error } = await runRoute('get', '/:teamSeasonId/emails/history', {
        params: { teamSeasonId: TEAM_A_ID },
        headers: {},
      });

      expect(error).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('GET /:teamSeasonId/emails/history/:emailId', () => {
    it('returns email detail for the correct team', async () => {
      const emailDetail = { id: '100', subject: 'Team Update', teamSeasonId: TEAM_A_ID };
      emailServiceMock.getTeamEmail.mockResolvedValue(emailDetail);

      const { res } = await runRoute('get', '/:teamSeasonId/emails/history/:emailId', {
        params: { teamSeasonId: TEAM_A_ID, emailId: '100' },
        headers: { authorization: 'Bearer token' },
      });

      expect(emailServiceMock.getTeamEmail).toHaveBeenCalledWith(
        BigInt(ACCOUNT_ID),
        BigInt(TEAM_A_ID),
        100n,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(emailDetail);
    });

    it('cross-team rejection: team A history endpoint called with team B email throws', async () => {
      const { NotFoundError } = await import('../../utils/customErrors.js');
      emailServiceMock.getTeamEmail.mockRejectedValue(new NotFoundError('Email not found'));

      const { error } = await runRoute('get', '/:teamSeasonId/emails/history/:emailId', {
        params: { teamSeasonId: TEAM_A_ID, emailId: '200' },
        headers: { authorization: 'Bearer token' },
      });

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('rejects history detail request when no authorization header', async () => {
      const { error } = await runRoute('get', '/:teamSeasonId/emails/history/:emailId', {
        params: { teamSeasonId: TEAM_A_ID, emailId: '100' },
        headers: {},
      });

      expect(error).toBeInstanceOf(AuthorizationError);
    });
  });
});
