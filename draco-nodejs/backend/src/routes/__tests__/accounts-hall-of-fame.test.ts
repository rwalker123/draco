import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import type { Express, Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../../services/serviceFactory.js';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'user-1', username: 'tester' };
    next();
  },
  optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const createRouteProtectionMock = () => {
  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();

  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    const accountParam = req.params.accountId ? BigInt(req.params.accountId) : 1n;
    req.accountBoundary = {
      accountId: accountParam,
      contactId: 2n,
      enforced: true,
    };
    req.user = req.user ?? { id: 'user-1', username: 'tester' };
    next();
  };

  return {
    enforceAccountBoundary,
    requireAccountAdmin: passThrough,
    requirePermission: () => passThrough(),
    requirePollManagerAccess: passThrough,
    requireAccountOwner: passThrough,
    requireAuth: passThrough,
  };
};

describe('Accounts Hall of Fame routes', () => {
  let app: Express;
  const hallOfFameServiceMock = {
    listClasses: vi.fn(),
    getClass: vi.fn(),
    getRandomMember: vi.fn(),
    listEligibleContacts: vi.fn(),
    createMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
  };
  const hofNominationServiceMock = {
    submitNomination: vi.fn(),
    listNominations: vi.fn(),
    deleteNomination: vi.fn(),
  };
  const hofSetupServiceMock = {
    getSetup: vi.fn(),
    updateSetup: vi.fn(),
  };
  const turnstileServiceMock = {
    getHeaderName: vi.fn(() => 'cf-turnstile-token'),
    assertValid: vi.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-placeholder'; // pragma: allowlist secret

    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getHallOfFameService').mockReturnValue(
      hallOfFameServiceMock as never,
    );
    vi.spyOn(ServiceFactory, 'getHofNominationService').mockReturnValue(
      hofNominationServiceMock as never,
    );
    vi.spyOn(ServiceFactory, 'getHofSetupService').mockReturnValue(hofSetupServiceMock as never);
    vi.spyOn(ServiceFactory, 'getTurnstileService').mockReturnValue(turnstileServiceMock as never);

    const module = await import('../../app.js');
    app = module.default;
  });

  beforeEach(() => {
    hallOfFameServiceMock.listClasses.mockReset();
    hallOfFameServiceMock.getClass.mockReset();
    hallOfFameServiceMock.getRandomMember.mockReset();
    hallOfFameServiceMock.listEligibleContacts.mockReset();
    hallOfFameServiceMock.createMember.mockReset();
    hallOfFameServiceMock.updateMember.mockReset();
    hallOfFameServiceMock.deleteMember.mockReset();

    hofNominationServiceMock.submitNomination.mockReset();
    hofNominationServiceMock.listNominations.mockReset();
    hofNominationServiceMock.deleteNomination.mockReset();

    hofSetupServiceMock.getSetup.mockReset();
    hofSetupServiceMock.updateSetup.mockReset();

    turnstileServiceMock.assertValid.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('returns Hall of Fame classes', async () => {
    hallOfFameServiceMock.listClasses.mockResolvedValue([{ year: 2024, memberCount: 3 }]);

    const response = await request(app).get('/api/accounts/1/hall-of-fame/classes');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ year: 2024, memberCount: 3 }]);
    expect(hallOfFameServiceMock.listClasses).toHaveBeenCalledWith(1n);
  });

  it('submits a Hall of Fame nomination with Turnstile verification', async () => {
    turnstileServiceMock.assertValid.mockResolvedValue(undefined);
    hofNominationServiceMock.submitNomination.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/accounts/1/hall-of-fame/nominations')
      .set('cf-turnstile-token', 'token-123')
      .send({
        nominator: 'Alice',
        phoneNumber: '(555) 111-2222',
        email: 'alice@example.com',
        nominee: 'Bob',
        reason: 'Great ambassador',
      });

    expect(response.status).toBe(201);
    expect(turnstileServiceMock.assertValid).toHaveBeenCalledWith('token-123', expect.any(String));
    expect(hofNominationServiceMock.submitNomination).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        nominator: 'Alice',
      }),
    );
  });

  it('lists eligible contacts for administrators', async () => {
    hallOfFameServiceMock.listEligibleContacts.mockResolvedValue({
      contacts: [],
      pagination: {
        page: 2,
        limit: 5,
        hasNext: false,
        hasPrev: true,
      },
    });

    const response = await request(app)
      .get('/api/accounts/1/hall-of-fame/eligible-contacts?page=2&pageSize=5')
      .set('Authorization', 'Bearer test');

    expect(response.status).toBe(200);
    expect(hallOfFameServiceMock.listEligibleContacts).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        page: 2,
        pageSize: 5,
      }),
    );
  });
});
