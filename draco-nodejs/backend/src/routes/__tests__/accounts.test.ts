import * as request from 'supertest';
import * as express from 'express';
import accountsRouter from '../accounts';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    accounts: {
      findMany: jest.fn(),
    },
    affiliations: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const mockPrisma = (PrismaClient as jest.Mock).mock.results[0].value;
const mockFindManyAccounts = mockPrisma.accounts.findMany;
const mockFindManyAffiliations = mockPrisma.affiliations.findMany;

describe('/accounts/search route', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/accounts', accountsRouter);
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
