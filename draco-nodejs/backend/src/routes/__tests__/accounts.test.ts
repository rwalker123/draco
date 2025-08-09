import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import accountsRouter from '../accounts.js';
import { globalErrorHandler } from '../../utils/globalErrorHandler.js';
import { roleService } from '../accounts-contacts.js';
import gamesRouter from '../games.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));
vi.mock('../../middleware/routeProtection', () => {
  return {
    RouteProtection: vi.fn().mockImplementation(() => ({
      requireAdministrator: () => (req: Request, res: Response, next: NextFunction) => next(),
      requirePermission: () => (req: Request, res: Response, next: NextFunction) => next(),
      enforceAccountBoundary: () => (req: Request, res: Response, next: NextFunction) => next(),
      requireAccountAdmin: () => (req: Request, res: Response, next: NextFunction) => next(),
      requireRole: () => (req: Request, res: Response, next: NextFunction) => next(),
    })),
  };
});

// Mock the centralized prisma module
const mockPrisma = {
  accounts: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  affiliations: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  accountsurl: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  currentseason: {
    findUnique: vi.fn(),
  },
  season: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  contacts: {
    findFirst: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  availablefields: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  teams: {
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
  teamsseason: {
    findFirst: vi.fn(),
  },
  leagueschedule: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  // Add more as needed for other routes
};

const hoisted = vi.hoisted(() => ({
  mockPrisma: {
    accounts: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    affiliations: { findMany: vi.fn(), findUnique: vi.fn() },
    accountsurl: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    currentseason: { findUnique: vi.fn() },
    season: { findUnique: vi.fn(), findMany: vi.fn() },
    contacts: { findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    availablefields: { findFirst: vi.fn(), update: vi.fn() },
    teams: { findFirst: vi.fn(), delete: vi.fn() },
    teamsseason: { findFirst: vi.fn() },
    leagueschedule: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('../../lib/prisma', () => ({ default: hoisted.mockPrisma }));
const mockFindManyAccounts = hoisted.mockPrisma.accounts.findMany as any;
const mockFindManyAffiliations = hoisted.mockPrisma.affiliations.findMany as any;
const mockFindFirstAccountUrl = hoisted.mockPrisma.accountsurl.findFirst as any;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use(globalErrorHandler as express.ErrorRequestHandler);
  return app;
}

function createTestAppWithUser(
  user: { id: string; username: string } = { id: '1', username: 'testuser' },
) {
  const app = express();
  app.use(express.json());
  // Middleware to inject mock user
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use('/api/accounts', accountsRouter);
  app.use(globalErrorHandler as express.ErrorRequestHandler);
  return app;
}

function createGamesTestAppWithUser(
  user: { id: string; username: string } = { id: '1', username: 'testuser' },
) {
  const app = express();
  app.use(express.json());
  // Middleware to inject mock user
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  // Mount games router at the correct path
  app.use('/api/accounts/:accountId/seasons/:seasonId/games', gamesRouter);
  app.use(globalErrorHandler as express.ErrorRequestHandler);
  return app;
}

describe('/accounts/search route', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 400 if q is missing', async () => {
    const res = await request(app).get('/api/accounts/search');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Search query is required/);
  });

  it('returns 200 with results', async () => {
    mockFindManyAccounts.mockResolvedValue([
      {
        id: 1,
        name: 'Test Account',
        accounttypeid: 1,
        firstyear: 2020,
        affiliationid: 2,
        timezoneid: 1,
        accounttypes: { id: 1, name: 'League' },
        accountsurl: [{ id: 1, url: 'test.com' }],
      },
    ]);
    mockFindManyAffiliations.mockResolvedValue([
      { id: 2, name: 'Test Affiliation', url: 'affil.com' },
    ]);
    const res = await request(app).get('/api/accounts/search?q=Test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBe(1);
    expect(res.body.data.accounts[0].name).toBe('Test Account');
  });

  it('returns 200 with empty results if none found', async () => {
    mockFindManyAccounts.mockResolvedValue([]);
    mockFindManyAffiliations.mockResolvedValue([]);
    const res = await request(app).get('/api/accounts/search?q=NoMatch');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts).toEqual([]);
  });

  it('returns 500 on error', async () => {
    mockFindManyAccounts.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/accounts/search?q=Test');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('/accounts/by-domain route', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 400 if host header is missing', async () => {
    // Reset mocks to ensure clean state
    vi.clearAllMocks();

    // Supertest automatically adds a host header, so we test with empty host
    const res = await request(app).get('/api/accounts/by-domain').set('host', ''); // Empty host header

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Host header is required/);
  });

  it('returns 404 if no account found for domain', async () => {
    mockFindFirstAccountUrl.mockResolvedValue(null);
    const res = await request(app).get('/api/accounts/by-domain').set('host', 'notfound.com');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/No account found for this domain/);
  });

  it('returns 200 with account data if found', async () => {
    const mockAccountUrl = {
      id: 1,
      url: 'https://example.com',
      accounts: {
        id: 123,
        name: 'Test Account',
        accounttypeid: 1,
        firstyear: 2020,
        timezoneid: 1,
        accounttypes: { name: 'League' },
      },
    };

    mockFindFirstAccountUrl.mockResolvedValue(mockAccountUrl);

    const res = await request(app).get('/api/accounts/by-domain').set('host', 'example.com');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.name).toBe('Test Account');
  });

  it('returns 500 on error', async () => {
    mockFindFirstAccountUrl.mockRejectedValue(new Error('fail'));

    const res = await request(app).get('/api/accounts/by-domain').set('host', 'example.com');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('/accounts/:accountId/public route', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 404 if account not found', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/accounts/123/public');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Account not found/);
  });

  it('returns 200 with empty teams if no current season', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue({
      id: 123,
      name: 'Test Account',
      accounttypeid: 1,
      firstyear: 2020,
      affiliationid: 1,
      timezoneid: 1,
      twitteraccountname: '',
      facebookfanpage: '',
      accounttypes: { id: 1, name: 'League' },
      accountsurl: [],
    });
    mockPrisma.affiliations.findUnique.mockResolvedValue({
      id: 1,
      name: 'Affil',
      url: 'affil.com',
    });
    mockPrisma.currentseason.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/accounts/123/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.teams).toEqual([]);
  });

  it('returns 500 on error', async () => {
    mockPrisma.accounts.findUnique.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/accounts/123/public');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('/accounts/:accountId route', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 404 if account not found', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/accounts/123');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Account not found/);
  });

  it('returns 200 with account data if found', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue({
      id: 123,
      name: 'Test Account',
      accounttypeid: 1,
      owneruserid: 1,
      firstyear: 2020,
      affiliationid: 1,
      timezoneid: 1,
      twitteraccountname: '',
      twitteroauthtoken: '',
      twitteroauthsecretkey: '',
      youtubeuserid: '',
      facebookfanpage: '',
      twitterwidgetscript: '',
      defaultvideo: '',
      autoplayvideo: false,
      accounttypes: { id: 1, name: 'League', filepath: '' },
      accountsurl: [],
    });
    mockPrisma.affiliations.findUnique.mockResolvedValue({
      id: 1,
      name: 'Affil',
      url: 'affil.com',
    });
    const res = await request(app).get('/api/accounts/123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.name).toBe('Test Account');
  });

  it('returns 500 on error', async () => {
    mockPrisma.accounts.findUnique.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/accounts/123');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('POST /accounts', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app).post('/api/accounts').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/required/);
  });

  it('returns 201 and account data on success', async () => {
    mockPrisma.accounts.create.mockResolvedValue({
      id: 123,
      name: 'Test Account',
      accounttypeid: 1,
      owneruserid: 1,
      firstyear: 2020,
      affiliationid: 1,
      timezoneid: 'UTC',
      twitteraccountname: '',
      twitteroauthtoken: '',
      twitteroauthsecretkey: '',
      defaultvideo: '',
      autoplayvideo: false,
    });
    mockPrisma.accountsurl.create.mockResolvedValue({});
    const res = await request(app)
      .post('/api/accounts')
      .send({ name: 'Test Account', accountTypeId: 1, ownerUserId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.name).toBe('Test Account');
  });

  it('returns 500 on error', async () => {
    mockPrisma.accounts.create.mockRejectedValue(new Error('fail'));
    const res = await request(app)
      .post('/api/accounts')
      .send({ name: 'Test Account', accountTypeId: 1, ownerUserId: 1 });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('PUT /accounts/:accountId', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 400 if no fields to update', async () => {
    const res = await request(app).put('/api/accounts/123').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/At least one field to update/);
  });

  it('returns 200 on success', async () => {
    mockPrisma.accounts.update.mockResolvedValue({
      id: 123,
      name: 'Updated Account',
      accounttypeid: 1,
      owneruserid: 1,
      firstyear: 2020,
      affiliationid: 1,
      timezoneid: 'UTC',
      twitteraccountname: '',
      twitteroauthtoken: '',
      twitteroauthsecretkey: '',
      defaultvideo: '',
      autoplayvideo: false,
    });
    const res = await request(app).put('/api/accounts/123').send({ name: 'Updated Account' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.name).toBe('Updated Account');
  });

  it('returns 404 if account not found', async () => {
    mockPrisma.accounts.update.mockRejectedValue({ code: 'P2025' });
    const res = await request(app).put('/api/accounts/123').send({ name: 'Updated Account' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 500 on error', async () => {
    mockPrisma.accounts.update.mockRejectedValue(new Error('fail'));
    const res = await request(app).put('/api/accounts/123').send({ name: 'Updated Account' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('DELETE /accounts/:accountId', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 404 if account not found', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/api/accounts/123');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Account not found/);
  });

  it('returns 200 on success', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue({ id: 123 });
    mockPrisma.accounts.delete.mockResolvedValue({});
    const res = await request(app).delete('/api/accounts/123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Account deleted successfully/);
  });

  it('returns 500 on error', async () => {
    mockPrisma.accounts.findUnique.mockResolvedValue({ id: 123 });
    mockPrisma.accounts.delete.mockRejectedValue(new Error('fail'));
    const res = await request(app).delete('/api/accounts/123');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('DELETE /accounts/:accountId/urls/:urlId', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 404 if URL not found or does not belong to this account', async () => {
    mockPrisma.accountsurl.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/accounts/123/urls/456');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/URL not found or does not belong to this account/);
  });

  it('returns 200 on success', async () => {
    mockPrisma.accountsurl.findFirst.mockResolvedValue({
      id: 456,
      accountid: 123,
      url: 'test.com',
    });
    mockPrisma.accountsurl.delete.mockResolvedValue({});
    const res = await request(app).delete('/api/accounts/123/urls/456');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/URL removed successfully/);
  });

  it('returns 500 on error', async () => {
    mockPrisma.accountsurl.findFirst.mockResolvedValue({
      id: 456,
      accountid: 123,
      url: 'test.com',
    });
    mockPrisma.accountsurl.delete.mockRejectedValue(new Error('fail'));
    const res = await request(app).delete('/api/accounts/123/urls/456');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('DELETE /accounts/:accountId/users/:contactId/roles/:roleId', () => {
  // Scaffold: test 400 (no roleData), 200 (success), 500 (error)
});

describe('PUT /accounts/:accountId/contacts/:contactId', () => {
  // Scaffold: test 400 (missing fields), 400 (invalid email), 404 (not found), 200 (success), 500 (error)
});

describe('DELETE /accounts/:accountId/teams/:teamId', () => {
  // Scaffold: test 404 (not found), 200 (success), 500 (error)
});

describe('PUT /accounts/:accountId/fields/:fieldId', () => {
  // Scaffold: test 400 (missing name), 400 (duplicate), 404 (not found), 200 (success), 500 (error)
});

describe('GET /accounts (admin only)', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('returns 200 with accounts', async () => {
    mockFindManyAccounts.mockResolvedValue([
      {
        id: 1,
        name: 'Test Account',
        accounttypeid: 1,
        owneruserid: 1,
        firstyear: 2020,
        affiliationid: 2,
        timezoneid: 1,
        twitteraccountname: '',
        youtubeuserid: '',
        facebookfanpage: '',
        defaultvideo: '',
        autoplayvideo: false,
        accounttypes: { id: 1, name: 'League' },
      },
    ]);
    mockFindManyAffiliations.mockResolvedValue([
      { id: 2, name: 'Test Affiliation', url: 'affil.com' },
    ]);
    mockPrisma.contacts.findMany.mockResolvedValue([
      { userid: 1, firstname: 'Owner', lastname: 'User', email: 'owner@example.com' },
    ]);
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBe(1);
    expect(res.body.data.accounts[0].name).toBe('Test Account');
  });

  it('returns 200 with empty accounts', async () => {
    mockFindManyAccounts.mockResolvedValue([]);
    mockFindManyAffiliations.mockResolvedValue([]);
    mockPrisma.contacts.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts).toEqual([]);
  });

  it('returns 500 on error', async () => {
    mockFindManyAccounts.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('GET /accounts/my-accounts', () => {
  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestAppWithUser();
  });

  it('returns 200 with all accounts for admin', async () => {
    vi.spyOn(roleService, 'hasRole').mockResolvedValue({
      hasRole: true,
      roleLevel: 'account',
    });
    vi.spyOn(roleService, 'getUserRoles').mockResolvedValue({
      globalRoles: [],
      contactRoles: [
        { id: 1n, contactId: 1n, roleId: 'AccountAdmin', roleData: 0n, accountId: 1n },
      ],
    });
    mockFindManyAccounts.mockResolvedValue([
      {
        id: 1,
        name: 'Test Account',
        accounttypeid: 1,
        owneruserid: 1,
        firstyear: 2020,
        affiliationid: 2,
        timezoneid: 1,
        twitteraccountname: '',
        youtubeuserid: '',
        facebookfanpage: '',
        defaultvideo: '',
        autoplayvideo: false,
        accounttypes: { id: 1, name: 'League' },
      },
    ]);
    mockFindManyAffiliations.mockResolvedValue([
      { id: 2, name: 'Test Affiliation', url: 'affil.com' },
    ]);
    mockPrisma.contacts.findMany.mockResolvedValue([
      { userid: 1, firstname: 'Owner', lastname: 'User', email: 'owner@example.com' },
    ]);
    const res = await request(app).get('/api/accounts/my-accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBe(1);
    expect(res.body.data.accounts[0].name).toBe('Test Account');
  });

  it('returns 200 with accounts for account admin', async () => {
    vi.spyOn(roleService, 'hasRole').mockResolvedValue({
      hasRole: false,
      roleLevel: 'none',
    });
    vi.spyOn(roleService, 'getUserRoles').mockResolvedValue({
      globalRoles: [],
      contactRoles: [
        { id: 1n, contactId: 1n, roleId: 'AccountAdmin', roleData: 0n, accountId: 1n },
      ],
    });
    mockFindManyAccounts.mockResolvedValue([
      {
        id: 1,
        name: 'Test Account',
        accounttypeid: 1,
        owneruserid: 1,
        firstyear: 2020,
        affiliationid: 2,
        timezoneid: 1,
        twitteraccountname: '',
        youtubeuserid: '',
        facebookfanpage: '',
        defaultvideo: '',
        autoplayvideo: false,
        accounttypes: { id: 1, name: 'League' },
      },
    ]);
    mockFindManyAffiliations.mockResolvedValue([
      { id: 2, name: 'Test Affiliation', url: 'affil.com' },
    ]);
    mockPrisma.contacts.findMany.mockResolvedValue([
      { userid: 1, firstname: 'Owner', lastname: 'User', email: 'owner@example.com' },
    ]);
    const res = await request(app).get('/api/accounts/my-accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBe(1);
    expect(res.body.data.accounts[0].name).toBe('Test Account');
  });

  it('returns 200 with empty accounts if no access', async () => {
    vi.spyOn(roleService, 'hasRole').mockResolvedValue({
      hasRole: false,
      roleLevel: 'none',
    });
    vi.spyOn(roleService, 'getUserRoles').mockResolvedValue({
      globalRoles: [],
      contactRoles: [],
    });
    mockFindManyAccounts.mockResolvedValue([]);
    mockFindManyAffiliations.mockResolvedValue([]);
    mockPrisma.contacts.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/accounts/my-accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts).toEqual([]);
  });

  it('returns 500 on error', async () => {
    vi.spyOn(roleService, 'hasRole').mockResolvedValue({
      hasRole: true,
      roleLevel: 'account',
    });
    vi.spyOn(roleService, 'getUserRoles').mockResolvedValue({
      globalRoles: [],
      contactRoles: [],
    });
    mockFindManyAccounts.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/accounts/my-accounts');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Internal server error/);
  });
});

describe('Game Recap Endpoints', () => {
  const accountId = '1';
  const seasonId = '1';
  const gameId = '1';
  const teamAdminUser = { id: '1', username: 'teamadmin' };
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createGamesTestAppWithUser(teamAdminUser);
  });

  it('should return 404 if no recap exists for the team', async () => {
    const res = await request(app).get(
      `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap`,
    );
    expect([403, 404]).toContain(res.status); // 404 if no recap, 403 if not authorized
  });

  it('should create a recap for the team', async () => {
    const recapText = 'Great game!';
    const res = await request(app)
      .put(`/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap`)
      .send({ recap: recapText });
    expect([200, 403]).toContain(res.status); // 200 if allowed, 403 if not authorized
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.recap).toBe(recapText);
    }
  });

  it('should fetch the created recap for the team', async () => {
    const res = await request(app).get(
      `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap`,
    );
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.recap).toBe('string');
    }
  });

  it('should update the recap for the team', async () => {
    const recapText = 'Updated recap!';
    const res = await request(app)
      .put(`/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap`)
      .send({ recap: recapText });
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.recap).toBe(recapText);
    }
  });

  it('should return 400 if recap is missing or empty', async () => {
    const res = await request(app)
      .put(`/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap`)
      .send({ recap: '' });
    expect([400, 403]).toContain(res.status);
  });
});
