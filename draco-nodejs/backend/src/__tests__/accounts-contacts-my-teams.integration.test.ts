import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
import type { IRoleRepository } from '../repositories/interfaces/IRoleRepository.js';
import type { IOauthRepository } from '../repositories/interfaces/IOauthRepository.js';
import prisma from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => {
  const findUniqueFn = vi.fn();
  const aspnetusers = { findUnique: findUniqueFn };
  return {
    default: {
      aspnetusers,
      $disconnect: vi.fn(),
      $extends: vi.fn().mockReturnThis(),
    },
    extendedPrisma: { aspnetusers },
  };
});

vi.mock('../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: {
    getOauthRepository: vi.fn(),
    getUserRepository: vi.fn(),
    getContactRepository: vi.fn(),
    getAccountRepository: vi.fn(),
    getRoleRepository: vi.fn(),
    getScheduleRepository: vi.fn(),
    getAlertRepository: vi.fn(),
    getSocialContentRepository: vi.fn(),
    getTeamRepository: vi.fn(),
    getSeasonsRepository: vi.fn(),
    getRosterRepository: vi.fn(),
    getManagerRepository: vi.fn(),
    getBattingStatisticsRepository: vi.fn(),
    getPitchingStatisticsRepository: vi.fn(),
    getLeagueLeadersDisplayRepository: vi.fn(),
    getLeagueRepository: vi.fn(),
    getLeagueFaqRepository: vi.fn(),
    getCleanupRepository: vi.fn(),
    getPollRepository: vi.fn(),
    getPlayersWantedRepository: vi.fn(),
    getTeamsWantedRepository: vi.fn(),
    getSponsorRepository: vi.fn(),
    getFieldRepository: vi.fn(),
    getUmpireRepository: vi.fn(),
    getWorkoutRepository: vi.fn(),
    getEmailRepository: vi.fn(),
    getEmailTemplateRepository: vi.fn(),
    getEmailAttachmentRepository: vi.fn(),
    getMonitoringRepository: vi.fn(),
    getPasswordResetTokenRepository: vi.fn(),
    getHandoutRepository: vi.fn(),
    getAdminAnalyticsRepository: vi.fn(),
    getPhotoSubmissionRepository: vi.fn(),
    getPhotoGalleryAdminRepository: vi.fn(),
    getPhotoGalleryModerationRepository: vi.fn(),
    getPhotoGalleryReadRepository: vi.fn(),
    getMemberBusinessRepository: vi.fn(),
    getHallOfFameRepository: vi.fn(),
    getHofNominationRepository: vi.fn(),
    getHofNominationSetupRepository: vi.fn(),
    getStatsEntryRepository: vi.fn(),
    getAnnouncementRepository: vi.fn(),
    getPlayerSurveyRepository: vi.fn(),
    getAccountSettingsRepository: vi.fn(),
    getLiveEventRepository: vi.fn(),
    getDiscordIntegrationRepository: vi.fn(),
    getWelcomeMessageRepository: vi.fn(),
    getAccountTwitterCredentialsRepository: vi.fn(),
    getAccountFacebookCredentialsRepository: vi.fn(),
    getAccountBlueskyCredentialsRepository: vi.fn(),
    getAccountInstagramCredentialsRepository: vi.fn(),
    getInstagramIngestionRepository: vi.fn(),
    getSchedulerFieldAvailabilityRulesRepository: vi.fn(),
    getSchedulerFieldExclusionDatesRepository: vi.fn(),
    getSchedulerProblemSpecRepository: vi.fn(),
    getSchedulerSeasonConfigRepository: vi.fn(),
    getSchedulerSeasonLeagueSelectionsRepository: vi.fn(),
    getSchedulerSeasonExclusionsRepository: vi.fn(),
    getSchedulerTeamSeasonExclusionsRepository: vi.fn(),
    getSchedulerUmpireExclusionsRepository: vi.fn(),
    getGolfCourseRepository: vi.fn(),
    getGolferRepository: vi.fn(),
    getGolfScoreRepository: vi.fn(),
    getGolfClosestToPinRepository: vi.fn(),
    getGolfFlightRepository: vi.fn(),
    getGolfLeagueRepository: vi.fn(),
    getGolfMatchRepository: vi.fn(),
    getGolfRosterRepository: vi.fn(),
    getGolfTeamRepository: vi.fn(),
    getGolfTeeRepository: vi.fn(),
    getBaseballLiveScoringRepository: vi.fn(),
    getIndividualLiveScoringRepository: vi.fn(),
    getLiveScoringRepository: vi.fn(),
  },
}));

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
const TEST_OAUTH_PEPPER = 'test-pepper-at-least-32-characters-long-abcdef';
const TEST_OAUTH_ISSUER = 'https://test.draco.com';
const TEST_MCP_RESOURCE_URL = 'https://mcp.draco.com/mcp';
const TEST_FRONTEND_BASE_URL = 'https://app.draco.com';

const TEST_USER_ID = 'user-test-uuid-1234';
const TEST_USER_SECURITY_STAMP = 'stamp-initial-abc';
const TEST_ACCOUNT_ID = '42';
const TEST_SEASON_ID = '7';

Object.assign(process.env, {
  JWT_SECRET: TEST_JWT_SECRET,
  OAUTH_PEPPER: TEST_OAUTH_PEPPER,
  OAUTH_ISSUER: TEST_OAUTH_ISSUER,
  MCP_RESOURCE_URL: TEST_MCP_RESOURCE_URL,
  FRONTEND_BASE_URL: TEST_FRONTEND_BASE_URL,
  OAUTH_REGISTRATION_BASE_URL: 'https://test.draco.com/oauth/clients',
  NODE_ENV: 'test',
});

function signUserJwt(userId: string, securityStamp: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      userId,
      username: 'testuser',
      securityStamp,
      iat: now,
      exp: now + 3600,
    },
    TEST_JWT_SECRET,
  );
}

function signOauthToken(
  overrides: Partial<{
    sub: string;
    jti: string;
    clientId: string;
    aud: string;
    iss: string;
  }> = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: overrides.sub ?? TEST_USER_ID,
      aud: overrides.aud ?? 'mcp',
      iss: overrides.iss ?? TEST_OAUTH_ISSUER,
      scope: 'mcp:read',
      client_id: overrides.clientId ?? 'mcp_testclient',
      jti: overrides.jti ?? 'test-jti-1234',
      iat: now,
      exp: now + 3600,
    },
    TEST_JWT_SECRET,
    { algorithm: 'HS256', noTimestamp: true },
  );
}

function makeUserRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_USER_ID,
    email: null,
    username: 'testuser',
    emailconfirmed: false,
    passwordhash: null,
    securitystamp: TEST_USER_SECURITY_STAMP,
    phonenumber: null,
    phonenumberconfirmed: false,
    twofactorenabled: false,
    lockoutenddateutc: null,
    lockoutenabled: false,
    accessfailedcount: 0,
    ...overrides,
  };
}

function makeAccessTokenRow(jti: string, overrides: Record<string, unknown> = {}) {
  return {
    jti,
    client_id: 'mcp_testclient',
    user_id: TEST_USER_ID,
    scopes: ['mcp:read'],
    audience: 'mcp',
    security_stamp: TEST_USER_SECURITY_STAMP,
    issued_at: new Date(),
    expires_at: new Date(Date.now() + 3_600_000),
    revoked_at: null,
    revocation_reason: null,
    ...overrides,
  };
}

function makeMembership(overrides: Record<string, unknown> = {}) {
  return {
    teamSeasonId: 1001n,
    teamName: 'Red Sox',
    leagueSeasonId: 2001n,
    leagueName: 'Summer League',
    divisionSeasonId: 501n,
    divisionName: 'Division A',
    jerseyNumber: '7',
    ...overrides,
  };
}

const ENDPOINT = `/api/accounts/${TEST_ACCOUNT_ID}/seasons/${TEST_SEASON_ID}/contacts/me/teams`;

describe('GET /api/accounts/:accountId/seasons/:seasonId/contacts/me/teams', () => {
  let app: Express;
  let contactRepo: MockedObject<IContactRepository>;
  let userRepo: MockedObject<IUserRepository>;
  let roleRepo: MockedObject<IRoleRepository>;
  let oauthRepo: MockedObject<IOauthRepository>;

  beforeAll(async () => {
    userRepo = {
      findByUserId: vi.fn().mockResolvedValue(makeUserRow()),
      findByUsername: vi.fn().mockResolvedValue(null),
      findByUserIdWithRoles: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      updatePassword: vi.fn(),
      updateUser: vi.fn(),
    } as never as MockedObject<IUserRepository>;

    roleRepo = {
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findAllRoles: vi.fn().mockResolvedValue([]),
      findGlobalRoles: vi.fn().mockResolvedValue([]),
      findRoleId: vi.fn(),
      findRoleName: vi.fn(),
      removeContactRole: vi.fn(),
      findRole: vi.fn(),
      getUsersWithRole: vi.fn().mockResolvedValue([]),
      findAccountIdsForUserRoles: vi.fn().mockResolvedValue([BigInt(TEST_ACCOUNT_ID)]),
    } as MockedObject<IRoleRepository>;

    oauthRepo = {
      findClientById: vi.fn().mockResolvedValue(null),
      createClient: vi.fn(),
      disableClient: vi.fn(),
      createAuthorizationCode: vi.fn(),
      findAuthorizationCodeByHash: vi.fn().mockResolvedValue(null),
      consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      createAccessToken: vi.fn(),
      findAccessTokenByJti: vi.fn().mockResolvedValue(null),
      revokeAccessToken: vi.fn(),
      revokeAccessTokensByJtis: vi.fn(),
      findActiveAccessTokensByUser: vi.fn().mockResolvedValue([]),
      createRefreshToken: vi.fn(),
      findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
      markRefreshTokenRevoked: vi.fn(),
      revokeRefreshChain: vi
        .fn()
        .mockResolvedValue({ revokedTokenHashes: [], affectedAccessTokenJtis: [] }),
      rotateRefreshToken: vi.fn(),
      createConsentRequest: vi.fn(),
      findConsentRequestByRid: vi.fn().mockResolvedValue(null),
      consumeConsentRequest: vi.fn().mockResolvedValue(true),
      deleteExpiredAuthorizationCodes: vi.fn().mockResolvedValue(0),
      deleteExpiredAccessTokens: vi.fn().mockResolvedValue(0),
      deleteExpiredRefreshTokens: vi.fn().mockResolvedValue(0),
      deleteExpiredConsentRequests: vi.fn().mockResolvedValue(0),
    } as MockedObject<IOauthRepository>;

    contactRepo = {
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findRosterByContactId: vi.fn(),
      findContactInAccount: vi.fn().mockResolvedValue(null),
      findAccountOwner: vi.fn().mockResolvedValue(null),
      isAccountOwner: vi.fn().mockResolvedValue(false),
      findByUserId: vi.fn(),
      findContactsByUserIds: vi.fn().mockResolvedValue([]),
      findContactsWithRolesByAccountId: vi.fn().mockResolvedValue([]),
      findActiveSeasonRosterContacts: vi.fn().mockResolvedValue([]),
      searchContactsWithRoles: vi.fn().mockResolvedValue([]),
      searchContactsByName: vi.fn().mockResolvedValue({ contacts: [], total: 0 }),
      findAvailableContacts: vi.fn().mockResolvedValue([]),
      findContactsForExport: vi.fn().mockResolvedValue([]),
      findCurrentSeasonTeamsForContact: vi.fn().mockResolvedValue([]),
      hasCareerStatistics: vi.fn().mockResolvedValue(false),
      findMyTeamSeasons: vi.fn(),
    } as MockedObject<IContactRepository>;

    vi.mocked(RepositoryFactory.getContactRepository).mockReturnValue(contactRepo);
    vi.mocked(RepositoryFactory.getRoleRepository).mockReturnValue(roleRepo);
    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);
    vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(oauthRepo);
    vi.mocked(RepositoryFactory.getSeasonsRepository).mockReturnValue({
      findCurrentSeason: vi.fn().mockResolvedValue(null),
      findSeasonById: vi.fn().mockResolvedValue(null),
    } as never);
    vi.mocked(RepositoryFactory.getTeamRepository).mockReturnValue({
      findTeamsManager: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(RepositoryFactory.getLeagueRepository).mockReturnValue({} as never);
    vi.mocked(RepositoryFactory.getAccountRepository).mockReturnValue({
      findAccountWithRelationsById: vi.fn().mockResolvedValue({
        id: BigInt(TEST_ACCOUNT_ID),
        name: 'Test Account',
        owneruserid: 'owner-user-id',
        timezoneid: 'America/New_York',
        firstyear: 2000,
        accounttypeid: 1n,
        affiliationid: 1n,
        youtubeuserid: null,
        facebookfanpage: null,
        defaultvideo: '',
        autoplayvideo: false,
        accounttypes: { id: 1n, name: 'Baseball' },
        accountsurl: [],
        accountsettings: [],
        currentseason: null,
      }),
      findAffiliationsByIds: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    } as never);
    vi.mocked(prisma.aspnetusers.findUnique).mockResolvedValue(makeUserRow());

    const appModule = await import('../app.js');
    app = appModule.default;
  });

  beforeEach(() => {
    vi.mocked(RepositoryFactory.getContactRepository).mockReturnValue(contactRepo);
    vi.mocked(RepositoryFactory.getRoleRepository).mockReturnValue(roleRepo);
    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);
    vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(oauthRepo);
    vi.mocked(RepositoryFactory.getSeasonsRepository).mockReturnValue({
      findCurrentSeason: vi.fn().mockResolvedValue(null),
    } as never);

    contactRepo.findMyTeamSeasons.mockResolvedValue([makeMembership()]);
    contactRepo.findByUserId.mockResolvedValue({
      id: 999n,
      userid: TEST_USER_ID,
      creatoraccountid: BigInt(TEST_ACCOUNT_ID),
      firstname: 'Test',
      lastname: 'User',
      middlename: '',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date('1990-01-01'),
      email_bounced_at: null,
    } as never);

    roleRepo.getUsersWithRole.mockResolvedValue([]);
    roleRepo.findGlobalRoles.mockResolvedValue([]);
    roleRepo.findAccountIdsForUserRoles.mockResolvedValue([BigInt(TEST_ACCOUNT_ID)]);

    userRepo.findByUserId.mockResolvedValue(makeUserRow());
    oauthRepo.findAccessTokenByJti.mockResolvedValue(null);
    vi.mocked(prisma.aspnetusers.findUnique).mockResolvedValue(makeUserRow());
  });

  describe('with user JWT', () => {
    it('returns 200 with team membership array', async () => {
      const token = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);

      const res = await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('calls contactService with correct userId, accountId, seasonId', async () => {
      contactRepo.findMyTeamSeasons.mockResolvedValue([]);
      const token = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);

      await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(contactRepo.findMyTeamSeasons).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          accountId: BigInt(TEST_ACCOUNT_ID),
          seasonId: BigInt(TEST_SEASON_ID),
        }),
      );
    });

    it('returns 401 when no auth header is provided', async () => {
      const res = await request(app).get(ENDPOINT);
      expect(res.status).toBe(401);
    });

    it('returns empty array when user has no team memberships', async () => {
      contactRepo.findMyTeamSeasons.mockResolvedValue([]);
      const token = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);

      const res = await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('with OAuth bearer token', () => {
    it('returns 200 when OAuth token is valid', async () => {
      const jti = 'valid-jti-oauth';
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, { security_stamp: TEST_USER_SECURITY_STAMP }),
      );

      const token = signOauthToken({ jti });

      const res = await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 when OAuth token jti is revoked', async () => {
      const jti = 'revoked-jti';
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, { revoked_at: new Date() }),
      );

      const token = signOauthToken({ jti });

      const res = await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 when OAuth token has wrong audience', async () => {
      const token = signOauthToken({ aud: 'wrong-audience' });

      const res = await request(app).get(ENDPOINT).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });
});
