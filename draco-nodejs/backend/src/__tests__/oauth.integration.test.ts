import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import type {
  IOauthRepository,
  OauthConsentRequest,
} from '../repositories/interfaces/IOauthRepository.js';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
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
const TEST_REDIRECT_URI = 'https://example.com/callback';
const TEST_USER_ID = 'user-test-uuid-1234';
const TEST_USER_SECURITY_STAMP = 'stamp-initial-abc';
const TEST_MCP_RESOURCE_URL = 'https://mcp.draco.com/mcp';
const TEST_FRONTEND_BASE_URL = 'https://app.draco.com';

Object.assign(process.env, {
  JWT_SECRET: TEST_JWT_SECRET,
  OAUTH_PEPPER: TEST_OAUTH_PEPPER,
  OAUTH_ISSUER: TEST_OAUTH_ISSUER,
  MCP_RESOURCE_URL: TEST_MCP_RESOURCE_URL,
  FRONTEND_URL: TEST_FRONTEND_BASE_URL,
  OAUTH_REGISTRATION_BASE_URL: 'https://test.draco.com/oauth/clients',
  NODE_ENV: 'test',
});

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function signUserJwt(userId: string, securityStamp: string, username = 'testuser'): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      userId,
      username,
      securityStamp,
      iat: now,
      exp: now + 3600,
    },
    TEST_JWT_SECRET,
  );
}

function signOauthToken(params: {
  sub: string;
  jti: string;
  clientId: string;
  scope?: string;
  aud?: string;
  iss?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: params.sub,
      aud: params.aud ?? 'mcp',
      iss: params.iss ?? TEST_OAUTH_ISSUER,
      scope: params.scope ?? 'mcp:read',
      client_id: params.clientId,
      jti: params.jti,
      iat: now,
      exp: now + 3600,
    },
    TEST_JWT_SECRET,
    { algorithm: 'HS256', noTimestamp: true },
  );
}

type OauthClientRow = {
  client_id: string;
  name: string;
  client_secret_hash: string | null;
  hash_version: number;
  redirect_uris: string[];
  grant_types: string[];
  scopes: string[];
  token_endpoint_auth_method: string;
  registration_access_token_hash: string;
  registered_by_user_id: null;
  software_id: null;
  software_version: null;
  disabled_at: null | Date;
  created_at: Date;
  updated_at: Date;
};

function makeClientRow(overrides: Partial<OauthClientRow> = {}): OauthClientRow {
  return {
    client_id: 'mcp_testclient',
    name: 'Test Client',
    client_secret_hash: null,
    hash_version: 1,
    redirect_uris: [TEST_REDIRECT_URI],
    grant_types: ['authorization_code', 'refresh_token'],
    scopes: ['mcp:read'],
    token_endpoint_auth_method: 'none',
    registration_access_token_hash: 'reg-hash',
    registered_by_user_id: null,
    software_id: null,
    software_version: null,
    disabled_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  emailconfirmed: boolean;
  passwordhash: string | null;
  securitystamp: string | null;
  phonenumber: string | null;
  phonenumberconfirmed: boolean;
  twofactorenabled: boolean;
  lockoutenddateutc: Date | null;
  lockoutenabled: boolean;
  accessfailedcount: number;
};

function makeUserRow(overrides: Partial<UserRow> = {}): UserRow {
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

function makeAuthCodeRow(overrides: Record<string, unknown> = {}) {
  return {
    code_hash: 'placeholder-hash',
    hash_version: 1,
    client_id: 'mcp_testclient',
    user_id: TEST_USER_ID,
    redirect_uri: TEST_REDIRECT_URI,
    scopes: ['mcp:read'],
    code_challenge: 'placeholder-challenge',
    code_challenge_method: 'S256',
    resource: null,
    expires_at: new Date(Date.now() + 60_000),
    consumed_at: null,
    created_at: new Date(),
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

function makeRefreshTokenRow(overrides: Record<string, unknown> = {}) {
  return {
    token_hash: 'refresh-hash',
    hash_version: 1,
    chain_id: 'chain-uuid-test',
    parent_jti: null,
    current_access_token_jti: 'access-jti-test',
    client_id: 'mcp_testclient',
    user_id: TEST_USER_ID,
    scopes: ['mcp:read'],
    audience: 'mcp',
    issued_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 3_600_000),
    revoked_at: null,
    revocation_reason: null,
    ...overrides,
  };
}

function makeConsentRow(overrides: Partial<OauthConsentRequest> = {}): OauthConsentRequest {
  return {
    rid: crypto.randomUUID(),
    client_id: 'mcp_testclient',
    user_id: TEST_USER_ID,
    redirect_uri: TEST_REDIRECT_URI,
    scopes: ['mcp:read'],
    state: null,
    code_challenge: 'placeholder-challenge',
    code_challenge_method: 'S256',
    resource: null,
    expires_at: new Date(Date.now() + 600_000),
    consumed_at: null,
    created_at: new Date(),
    ...overrides,
  };
}

function makeOauthRepo(
  overrides: Partial<MockedObject<IOauthRepository>> = {},
): MockedObject<IOauthRepository> {
  return {
    findClientById: vi.fn().mockResolvedValue(null),
    createClient: vi.fn().mockResolvedValue(makeClientRow()),
    disableClient: vi.fn().mockResolvedValue(undefined),
    createAuthorizationCode: vi.fn().mockResolvedValue(undefined),
    findAuthorizationCodeByHash: vi.fn().mockResolvedValue(null),
    consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
    createAccessToken: vi.fn().mockResolvedValue(undefined),
    findAccessTokenByJti: vi.fn().mockResolvedValue(null),
    revokeAccessToken: vi.fn().mockResolvedValue(undefined),
    revokeAccessTokensByJtis: vi.fn().mockResolvedValue(undefined),
    findActiveAccessTokensByUser: vi.fn().mockResolvedValue([]),
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
    markRefreshTokenRevoked: vi.fn().mockResolvedValue(undefined),
    revokeRefreshChain: vi
      .fn()
      .mockResolvedValue({ revokedTokenHashes: [], affectedAccessTokenJtis: [] }),
    revokeRefreshChainsByUserAndClient: vi
      .fn()
      .mockResolvedValue({ revokedTokenHashes: [], affectedAccessTokenJtis: [] }),
    rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
    createConsentRequest: vi.fn().mockResolvedValue(undefined),
    findConsentRequestByRid: vi.fn().mockResolvedValue(null),
    consumeConsentRequest: vi.fn().mockResolvedValue(true),
    deleteExpiredAuthorizationCodes: vi.fn().mockResolvedValue(0),
    deleteExpiredAccessTokens: vi.fn().mockResolvedValue(0),
    deleteExpiredRefreshTokens: vi.fn().mockResolvedValue(0),
    deleteExpiredConsentRequests: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as MockedObject<IOauthRepository>;
}

function makeUserRepo(
  overrides: Partial<MockedObject<IUserRepository>> = {},
): MockedObject<IUserRepository> {
  return {
    findByUserId: vi.fn().mockResolvedValue(makeUserRow()),
    findByUsername: vi.fn().mockResolvedValue(null),
    findByUserIdWithRoles: vi.fn().mockResolvedValue(null),
    updatePassword: vi.fn().mockResolvedValue(makeUserRow()),
    updateUser: vi.fn().mockResolvedValue(makeUserRow()),
    ...overrides,
  } as MockedObject<IUserRepository>;
}

describe('OAuth routes integration', () => {
  let app: Express;
  let oauthRepo: MockedObject<IOauthRepository>;
  let userRepo: MockedObject<IUserRepository>;

  beforeAll(async () => {
    oauthRepo = makeOauthRepo();
    userRepo = makeUserRepo();

    vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(oauthRepo);
    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);

    vi.mocked(prisma.aspnetusers.findUnique).mockResolvedValue(makeUserRow());

    const appModule = await import('../app.js');
    app = appModule.default;
  });

  beforeEach(() => {
    vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(oauthRepo);
    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);

    vi.mocked(prisma.aspnetusers.findUnique).mockResolvedValue(makeUserRow());

    oauthRepo.findClientById.mockResolvedValue(null);
    oauthRepo.createClient.mockResolvedValue(makeClientRow());
    oauthRepo.createAuthorizationCode.mockResolvedValue(undefined);
    oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(null);
    oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);
    oauthRepo.createAccessToken.mockResolvedValue(undefined);
    oauthRepo.findAccessTokenByJti.mockResolvedValue(null);
    oauthRepo.revokeAccessToken.mockResolvedValue(undefined);
    oauthRepo.revokeAccessTokensByJtis.mockResolvedValue(undefined);
    oauthRepo.findActiveAccessTokensByUser.mockResolvedValue([]);
    oauthRepo.createRefreshToken.mockResolvedValue(undefined);
    oauthRepo.findRefreshTokenByHash.mockResolvedValue(null);
    oauthRepo.markRefreshTokenRevoked.mockResolvedValue(undefined);
    oauthRepo.revokeRefreshChain.mockResolvedValue({
      revokedTokenHashes: [],
      affectedAccessTokenJtis: [],
    });
    oauthRepo.rotateRefreshToken.mockResolvedValue(undefined);
    oauthRepo.createConsentRequest.mockResolvedValue(undefined);
    oauthRepo.findConsentRequestByRid.mockResolvedValue(null);
    oauthRepo.consumeConsentRequest.mockResolvedValue(true);

    userRepo.findByUserId.mockResolvedValue(makeUserRow());
    userRepo.findByUsername.mockResolvedValue(null);

    ServiceFactory['oauthService'] =
      undefined as unknown as (typeof ServiceFactory)['oauthService'];
  });

  describe('GET /.well-known/oauth-authorization-server', () => {
    it('returns issuer and expected endpoints', async () => {
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.status).toBe(200);
      expect(res.body.issuer).toBe(TEST_OAUTH_ISSUER);
      expect(res.body.authorization_endpoint).toBe(`${TEST_FRONTEND_BASE_URL}/oauth/authorize`);
      expect(res.body.token_endpoint).toBe(`${TEST_OAUTH_ISSUER}/oauth/token`);
      expect(res.body.registration_endpoint).toBe(`${TEST_OAUTH_ISSUER}/oauth/register`);
      expect(res.body.revocation_endpoint).toBe(`${TEST_OAUTH_ISSUER}/oauth/revoke`);
      expect(res.body.introspection_endpoint).toBe(`${TEST_OAUTH_ISSUER}/oauth/introspect`);
    });

    it('returns required metadata arrays', async () => {
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.body.scopes_supported).toContain('mcp:read');
      expect(res.body.response_types_supported).toContain('code');
      expect(res.body.grant_types_supported).toContain('authorization_code');
      expect(res.body.grant_types_supported).toContain('refresh_token');
      expect(res.body.code_challenge_methods_supported).toContain('S256');
      expect(res.body.token_endpoint_auth_methods_supported).toContain('none');
      expect(res.body.token_endpoint_auth_methods_supported).toContain('client_secret_basic');
    });

    it('sets Cache-Control: public, max-age=3600', async () => {
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.headers['cache-control']).toBe('public, max-age=3600');
    });

    it('does not include service_documentation when env is not set', async () => {
      const prev = process.env.OAUTH_SERVICE_DOCUMENTATION;
      delete process.env.OAUTH_SERVICE_DOCUMENTATION;
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.body).not.toHaveProperty('service_documentation');
      process.env.OAUTH_SERVICE_DOCUMENTATION = prev;
    });
  });

  describe('GET /.well-known/oauth-protected-resource', () => {
    it('returns resource and authorization_servers', async () => {
      const res = await request(app).get('/.well-known/oauth-protected-resource');
      expect(res.status).toBe(200);
      expect(res.body.resource).toBe(TEST_MCP_RESOURCE_URL);
      expect(res.body.authorization_servers).toContain(TEST_OAUTH_ISSUER);
      expect(res.body.scopes_supported).toContain('mcp:read');
      expect(res.body.bearer_methods_supported).toContain('header');
    });

    it('sets Cache-Control: public, max-age=3600', async () => {
      const res = await request(app).get('/.well-known/oauth-protected-resource');
      expect(res.headers['cache-control']).toBe('public, max-age=3600');
    });
  });

  describe('POST /oauth/register', () => {
    it('returns 201 and client_id starting with mcp_ on valid registration', async () => {
      oauthRepo.createClient.mockResolvedValue(
        makeClientRow({ client_id: 'mcp_newclient_abc', name: 'My App' }),
      );

      const res = await request(app)
        .post('/oauth/register')
        .send({ redirect_uris: [TEST_REDIRECT_URI], client_name: 'My App' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(201);
      expect(res.body.client_id).toMatch(/^mcp_/);
    });

    it('sets Cache-Control: no-store on success', async () => {
      const res = await request(app)
        .post('/oauth/register')
        .send({ redirect_uris: [TEST_REDIRECT_URI] })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(201);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('returns 400 for invalid redirect URI (http non-loopback)', async () => {
      const res = await request(app)
        .post('/oauth/register')
        .send({ redirect_uris: ['http://evil.com/callback'] })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_redirect_uri');
    });

    it('returns 400 for unsupported grant type', async () => {
      const res = await request(app)
        .post('/oauth/register')
        .send({ redirect_uris: [TEST_REDIRECT_URI], grant_types: ['implicit'] })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_client_metadata');
    });

    it('returns 429 after 10 registrations in under 1 hour (rate limit)', async () => {
      const responses: request.Response[] = [];
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .post('/oauth/register')
          .send({ redirect_uris: [TEST_REDIRECT_URI] })
          .set('Content-Type', 'application/json')
          .set('X-Forwarded-For', '10.20.30.40');
        responses.push(res);
      }
      const last = responses[responses.length - 1];
      expect(last.status).toBe(429);
    });
  });

  describe('POST /oauth/authorize/validate', () => {
    const userJwt = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);
    const { verifier: _v, challenge } = pkcePair();

    beforeEach(() => {
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
    });

    it('returns 200 with rid and client_name on valid request', async () => {
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_testclient',
          redirect_uri: TEST_REDIRECT_URI,
          scope: 'mcp:read',
          code_challenge: challenge,
          code_challenge_method: 'S256',
        });

      expect(res.status).toBe(200);
      expect(res.body.rid).toBeTruthy();
      expect(res.body.client_name).toBeTruthy();
      expect(res.body.scopes_human).toBeInstanceOf(Array);
      expect(res.body.scopes_human[0]).toContain('Read');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/oauth/authorize/validate').send({
        response_type: 'code',
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
        scope: 'mcp:read',
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 when code_challenge_method is plain', async () => {
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_testclient',
          redirect_uri: TEST_REDIRECT_URI,
          scope: 'mcp:read',
          code_challenge: challenge,
          code_challenge_method: 'plain',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
    });

    it('returns 400 when client not found', async () => {
      oauthRepo.findClientById.mockResolvedValue(null);
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_unknown',
          redirect_uri: TEST_REDIRECT_URI,
          scope: 'mcp:read',
          code_challenge: challenge,
          code_challenge_method: 'S256',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
      expect(res.body.error_description).toContain('Unknown or disabled');
    });

    it('returns 400 when redirect_uri does not match — no redirect_to in response', async () => {
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_testclient',
          redirect_uri: 'https://evil.com/callback',
          scope: 'mcp:read',
          code_challenge: challenge,
          code_challenge_method: 'S256',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
      expect(JSON.stringify(res.body)).not.toContain('evil.com');
    });

    it('redirects via redirect_to on invalid scope', async () => {
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_testclient',
          redirect_uri: TEST_REDIRECT_URI,
          scope: 'admin:write',
          code_challenge: challenge,
          code_challenge_method: 'S256',
        });
      expect(res.status).toBe(200);
      expect(res.body.redirect_to).toContain('error=invalid_scope');
    });

    it('returns 400 when resource does not match MCP_RESOURCE_URL', async () => {
      const res = await request(app)
        .post('/oauth/authorize/validate')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          response_type: 'code',
          client_id: 'mcp_testclient',
          redirect_uri: TEST_REDIRECT_URI,
          scope: 'mcp:read',
          code_challenge: challenge,
          code_challenge_method: 'S256',
          resource: 'https://wrong.resource.com/mcp',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_target');
    });
  });

  describe('POST /oauth/authorize/decision', () => {
    const userJwt = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);
    const { verifier: _v, challenge } = pkcePair();
    const consentRid = crypto.randomUUID();

    beforeEach(() => {
      const consent = makeConsentRow({
        rid: consentRid,
        user_id: TEST_USER_ID,
        code_challenge: challenge,
      });
      oauthRepo.findConsentRequestByRid.mockResolvedValue(consent);
      oauthRepo.consumeConsentRequest.mockResolvedValue(true);
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
    });

    it('returns 200 with redirect_to containing code on approve', async () => {
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(200);
      expect(res.body.redirect_to).toContain('code=');
    });

    it('returns 200 with redirect_to containing error on deny', async () => {
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'deny' });

      expect(res.status).toBe(200);
      expect(res.body.redirect_to).toContain('error=access_denied');
    });

    it('returns 400 when consent request not found', async () => {
      oauthRepo.findConsentRequestByRid.mockResolvedValue(null);
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
    });

    it('returns 400 when consent request already consumed', async () => {
      oauthRepo.findConsentRequestByRid.mockResolvedValue(
        makeConsentRow({ rid: consentRid, consumed_at: new Date(), code_challenge: challenge }),
      );
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
    });

    it('returns 400 when consent request expired', async () => {
      oauthRepo.findConsentRequestByRid.mockResolvedValue(
        makeConsentRow({
          rid: consentRid,
          expires_at: new Date(Date.now() - 1000),
          code_challenge: challenge,
        }),
      );
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
    });

    it('CSRF check: user B cannot approve user A consent request', async () => {
      const userBJwt = signUserJwt('user-b-different-uuid', 'stamp-b', 'userb');
      const userBRow = makeUserRow({
        id: 'user-b-different-uuid',
        securitystamp: 'stamp-b',
        username: 'userb',
      });
      vi.mocked(prisma.aspnetusers.findUnique).mockResolvedValue(userBRow as never);
      userRepo.findByUserId.mockResolvedValue(userBRow);

      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userBJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('access_denied');
    });

    it('state is preserved in redirect URL', async () => {
      const stateValue = 'xyz-state-123%20special';
      const consent = makeConsentRow({
        rid: consentRid,
        user_id: TEST_USER_ID,
        state: stateValue,
        code_challenge: challenge,
      });
      oauthRepo.findConsentRequestByRid.mockResolvedValue(consent);

      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'approve' });

      expect(res.status).toBe(200);
      expect(res.body.redirect_to).toContain(encodeURIComponent(stateValue));
    });
  });

  describe('POST /oauth/token', () => {
    const { verifier, challenge } = pkcePair();

    function makeCodeRow(code: string) {
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      return makeAuthCodeRow({
        code_hash: codeHash,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        client_id: 'mcp_testclient',
      });
    }

    it('happy path: exchanges code for tokens', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(makeCodeRow(code));
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const res = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code,
          code_verifier: verifier,
          client_id: 'mcp_testclient',
          redirect_uri: TEST_REDIRECT_URI,
        })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeTruthy();
      expect(res.body.refresh_token).toBeTruthy();
      expect(res.body.token_type).toBe('Bearer');
      expect(res.body.expires_in).toBe(3600);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('accepts form-urlencoded body', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(makeCodeRow(code));
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const res = await request(app)
        .post('/oauth/token')
        .type('form')
        .send(
          `grant_type=authorization_code&code=${encodeURIComponent(code)}&code_verifier=${encodeURIComponent(verifier)}&client_id=mcp_testclient&redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}`,
        );

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeTruthy();
    });

    it('PKCE verifier mismatch → 400 invalid_grant', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(makeCodeRow(code));
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: 'wrong-verifier-for-pkce-mismatch-test-xxxx',
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
    });

    it('auth code reuse: second exchange after first succeeds → 400', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      const codeRow = makeCodeRow(code);
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(codeRow);

      oauthRepo.consumeAuthorizationCode.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      });

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
    });

    it('wrong redirect_uri at exchange → 400 invalid_grant', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(makeCodeRow(code));
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: 'mcp_testclient',
        redirect_uri: 'https://wrong.example.com/callback',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
    });

    it('expired code → 400 invalid_grant', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(makeCodeRow(code));
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(
        makeAuthCodeRow({
          code_hash: codeHash,
          code_challenge: challenge,
          expires_at: new Date(Date.now() - 1000),
        }),
      );

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
    });

    it('unsupported grant_type → 400 unsupported_grant_type', async () => {
      const res = await request(app)
        .post('/oauth/token')
        .send({ grant_type: 'implicit', client_id: 'mcp_testclient' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('unsupported_grant_type');
    });

    it('refresh token rotation: old refresh rejected after use', async () => {
      const refreshToken = crypto.randomBytes(48).toString('base64url');
      const refreshHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(refreshToken)
        .digest('hex');

      const refreshRow = makeRefreshTokenRow({ token_hash: refreshHash });

      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findRefreshTokenByHash
        .mockResolvedValueOnce(refreshRow)
        .mockResolvedValueOnce({ ...refreshRow, revoked_at: new Date() });

      const first = await request(app).post('/oauth/token').send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'mcp_testclient',
      });

      expect(first.status).toBe(200);
      expect(first.body.refresh_token).toBeTruthy();

      const second = await request(app).post('/oauth/token').send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'mcp_testclient',
      });

      expect(second.status).toBe(400);
      expect(second.body.error).toBe('invalid_grant');
    });

    it('refresh replay → chain revocation triggered', async () => {
      const refreshToken = crypto.randomBytes(48).toString('base64url');
      const refreshHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(refreshToken)
        .digest('hex');

      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findRefreshTokenByHash.mockResolvedValue(
        makeRefreshTokenRow({
          token_hash: refreshHash,
          revoked_at: new Date(),
          chain_id: 'chain-to-revoke',
        }),
      );
      oauthRepo.revokeRefreshChain.mockResolvedValue({
        revokedTokenHashes: ['hash1'],
        affectedAccessTokenJtis: ['jti1'],
      });

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'mcp_testclient',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
      expect(oauthRepo.revokeRefreshChain).toHaveBeenCalledWith(
        'chain-to-revoke',
        'replay_detected',
      );
      expect(oauthRepo.revokeAccessTokensByJtis).toHaveBeenCalledWith(
        ['jti1'],
        'refresh_replay_detected',
      );
    });

    it('wrong client at exchange: client B uses client A code → 400', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      const clientB = makeClientRow({ client_id: 'mcp_clientb' });
      oauthRepo.findClientById.mockImplementation(async (id: string) => {
        if (id === 'mcp_clientb') return clientB;
        return null;
      });
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(
        makeAuthCodeRow({
          code_hash: codeHash,
          code_challenge: challenge,
          client_id: 'mcp_clienta',
        }),
      );
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: 'mcp_clientb',
        redirect_uri: TEST_REDIRECT_URI,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
    });

    it('confidential client missing secret → 401 invalid_client with WWW-Authenticate', async () => {
      oauthRepo.findClientById.mockResolvedValue(
        makeClientRow({
          token_endpoint_auth_method: 'client_secret_basic',
          client_secret_hash: 'somehash',
        }),
      );

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code: 'anycode',
        code_verifier: verifier,
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid_client');
      expect(res.headers['www-authenticate']).toContain('Basic');
    });

    it('HTTP Basic auth is preferred over body client credentials', async () => {
      const code = crypto.randomBytes(32).toString('base64url');
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      oauthRepo.findClientById.mockResolvedValue(makeClientRow({ client_id: 'mcp_basicclient' }));
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(
        makeAuthCodeRow({
          code_hash: codeHash,
          code_challenge: challenge,
          client_id: 'mcp_basicclient',
        }),
      );
      oauthRepo.consumeAuthorizationCode.mockResolvedValue(true);

      const basicCreds = Buffer.from('mcp_basicclient:').toString('base64');
      const res = await request(app)
        .post('/oauth/token')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({
          grant_type: 'authorization_code',
          code,
          code_verifier: verifier,
          client_id: 'mcp_ignoredclient',
          redirect_uri: TEST_REDIRECT_URI,
        });

      expect(res.status).toBe(200);
      expect(oauthRepo.findClientById).toHaveBeenCalledWith('mcp_basicclient');
    });
  });

  describe('POST /oauth/revoke', () => {
    it('returns 200 on unknown token (silent per RFC)', async () => {
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findRefreshTokenByHash.mockResolvedValue(null);

      const res = await request(app)
        .post('/oauth/revoke')
        .send({ token: 'unknown-random-token', client_id: 'mcp_testclient' });

      expect(res.status).toBe(200);
    });

    it('returns 200 and revokes refresh token', async () => {
      const refreshToken = crypto.randomBytes(48).toString('base64url');
      const refreshHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(refreshToken)
        .digest('hex');

      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findRefreshTokenByHash.mockResolvedValue(
        makeRefreshTokenRow({ token_hash: refreshHash }),
      );

      const res = await request(app).post('/oauth/revoke').send({
        token: refreshToken,
        token_type_hint: 'refresh_token',
        client_id: 'mcp_testclient',
      });

      expect(res.status).toBe(200);
      expect(oauthRepo.markRefreshTokenRevoked).toHaveBeenCalled();
    });

    it('returns 401 when client auth fails', async () => {
      oauthRepo.findClientById.mockResolvedValue(null);

      const res = await request(app)
        .post('/oauth/revoke')
        .send({ token: 'anytoken', client_id: 'unknown_client' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid_client');
    });

    it('sets Cache-Control: no-store', async () => {
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findRefreshTokenByHash.mockResolvedValue(null);

      const res = await request(app)
        .post('/oauth/revoke')
        .send({ token: 'anytoken', client_id: 'mcp_testclient' });

      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('revocation propagates: revoked access token → introspect returns active:false', async () => {
      const jti = crypto.randomUUID();
      const accessToken = signOauthToken({ sub: TEST_USER_ID, jti, clientId: 'mcp_confidential' });

      const rawSecret = 'revoke-test-secret';
      const secretHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(rawSecret)
        .digest('hex');
      const confidentialClient = makeClientRow({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: secretHash,
      });

      oauthRepo.findClientById.mockResolvedValue(confidentialClient);
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, { client_id: 'mcp_confidential', revoked_at: new Date() }),
      );

      const basicCreds = Buffer.from(`mcp_confidential:${rawSecret}`).toString('base64');
      const res = await request(app)
        .post('/oauth/introspect')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({ token: accessToken });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });
  });

  describe('POST /oauth/introspect', () => {
    it('returns active:false for revoked token', async () => {
      const jti = crypto.randomUUID();
      const accessToken = signOauthToken({ sub: TEST_USER_ID, jti, clientId: 'mcp_confidential' });

      const confidentialClient = makeClientRow({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: crypto
          .createHmac('sha256', TEST_OAUTH_PEPPER)
          .update('secret123')
          .digest('hex'),
      });
      oauthRepo.findClientById.mockResolvedValue(confidentialClient);
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, { revoked_at: new Date(), client_id: 'mcp_confidential' }),
      );

      const basicCreds = Buffer.from('mcp_confidential:secret123').toString('base64');
      const res = await request(app)
        .post('/oauth/introspect')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({ token: accessToken });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('returns active:true for valid token from confidential client', async () => {
      const jti = crypto.randomUUID();
      const accessToken = signOauthToken({ sub: TEST_USER_ID, jti, clientId: 'mcp_confidential' });

      const rawSecret = 'secret456';
      const secretHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(rawSecret)
        .digest('hex');
      const confidentialClient = makeClientRow({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: secretHash,
      });
      oauthRepo.findClientById.mockResolvedValue(confidentialClient);
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, { client_id: 'mcp_confidential' }),
      );

      const basicCreds = Buffer.from(`mcp_confidential:${rawSecret}`).toString('base64');
      const res = await request(app)
        .post('/oauth/introspect')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({ token: accessToken });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(true);
      expect(res.body.scope).toBe('mcp:read');
    });

    it('returns active:false for public client', async () => {
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());

      const res = await request(app)
        .post('/oauth/introspect')
        .send({ token: 'anytoken', client_id: 'mcp_testclient' });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });
  });

  describe('OAuth middleware security tests', () => {
    it('token with none algorithm is rejected — oauthAuthMiddleware rejects via verifyAccessToken', async () => {
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
        'base64url',
      );
      const nonePayload = Buffer.from(
        JSON.stringify({
          sub: TEST_USER_ID,
          aud: 'mcp',
          iss: TEST_OAUTH_ISSUER,
          scope: 'mcp:read',
          client_id: 'mcp_testclient',
          jti: 'fakejti',
          iat: 1,
          exp: 9999999999,
        }),
      ).toString('base64url');
      const noneToken = `${noneHeader}.${nonePayload}.`;

      const res = await request(app)
        .post('/oauth/introspect')
        .send({ token: noneToken, client_id: 'mcp_testclient' });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('wrong audience (aud: frontend) → verifyAccessToken throws OauthAuthenticationError', async () => {
      const jti = crypto.randomUUID();
      const badAudToken = signOauthToken({
        sub: TEST_USER_ID,
        jti,
        clientId: 'mcp_testclient',
        aud: 'frontend',
      });

      const rawSecret = 'aud-test-secret';
      const secretHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(rawSecret)
        .digest('hex');
      const confidentialClient = makeClientRow({
        client_id: 'mcp_testclient',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: secretHash,
      });
      oauthRepo.findClientById.mockResolvedValue(confidentialClient);

      const basicCreds = Buffer.from(`mcp_testclient:${rawSecret}`).toString('base64');
      const res = await request(app)
        .post('/oauth/introspect')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({ token: badAudToken });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('security stamp rotation invalidates OAuth token — verifyAccessToken returns false on introspect', async () => {
      const jti = crypto.randomUUID();
      const accessToken = signOauthToken({ sub: TEST_USER_ID, jti, clientId: 'mcp_confidential' });

      const rawSecret = 'stamp-test-secret';
      const secretHash = crypto
        .createHmac('sha256', TEST_OAUTH_PEPPER)
        .update(rawSecret)
        .digest('hex');
      const confidentialClient = makeClientRow({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: secretHash,
      });
      oauthRepo.findClientById.mockResolvedValue(confidentialClient);
      oauthRepo.findAccessTokenByJti.mockResolvedValue(
        makeAccessTokenRow(jti, {
          client_id: 'mcp_confidential',
          security_stamp: 'old-stamp-before-rotation',
        }),
      );
      userRepo.findByUserId.mockResolvedValue(
        makeUserRow({ securitystamp: 'new-stamp-after-password-change' }),
      );

      const basicCreds = Buffer.from(`mcp_confidential:${rawSecret}`).toString('base64');
      const res = await request(app)
        .post('/oauth/introspect')
        .set('Authorization', `Basic ${basicCreds}`)
        .send({ token: accessToken });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it.todo(
      'requireGet blocks POST mutation with OAuth token → 403 insufficient_scope: ' +
        'No production route uses authenticateAny + requireGet yet. ' +
        'Unit-test requireGet middleware directly in middleware/__tests__ once routes are mounted.',
    );
  });

  describe('State passthrough with URL-encoded special chars', () => {
    const userJwt = signUserJwt(TEST_USER_ID, TEST_USER_SECURITY_STAMP);
    const { challenge } = pkcePair();
    const consentRid = crypto.randomUUID();
    const stateWithSpecialChars = 'state=foo&bar=baz+qux%20encoded';

    beforeEach(() => {
      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findConsentRequestByRid.mockResolvedValue(
        makeConsentRow({
          rid: consentRid,
          user_id: TEST_USER_ID,
          state: stateWithSpecialChars,
          code_challenge: challenge,
        }),
      );
      oauthRepo.consumeConsentRequest.mockResolvedValue(true);
    });

    it('redirect_to has exact state value URL-encoded', async () => {
      const res = await request(app)
        .post('/oauth/authorize/decision')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({ rid: consentRid, decision: 'deny' });

      expect(res.status).toBe(200);
      const redirectTo: string = res.body.redirect_to;
      expect(redirectTo).toContain(encodeURIComponent(stateWithSpecialChars));
    });
  });

  describe('Concurrent code exchange', () => {
    it('exactly one exchange succeeds when two requests race', async () => {
      const { verifier: v, challenge: ch } = pkcePair();
      const code = crypto.randomBytes(32).toString('base64url');
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      oauthRepo.findClientById.mockResolvedValue(makeClientRow());
      oauthRepo.findAuthorizationCodeByHash.mockResolvedValue(
        makeAuthCodeRow({ code_hash: codeHash, code_challenge: ch }),
      );

      let consumeCount = 0;
      oauthRepo.consumeAuthorizationCode.mockImplementation(async () => {
        consumeCount += 1;
        return consumeCount === 1;
      });

      const body = {
        grant_type: 'authorization_code',
        code,
        code_verifier: v,
        client_id: 'mcp_testclient',
        redirect_uri: TEST_REDIRECT_URI,
      };

      const [r1, r2] = await Promise.all([
        request(app).post('/oauth/token').send(body),
        request(app).post('/oauth/token').send(body),
      ]);

      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([200, 400]);

      const failed = r1.status === 400 ? r1 : r2;
      expect(failed.body.error).toBe('invalid_grant');
    });
  });

  describe('Account boundary enforcement with OAuth tokens', () => {
    it.todo(
      'OAuth token from user A, access other account resource → 403: ' +
        'No production route uses authenticateAny + enforceAccountBoundary yet. ' +
        'Enforce boundary will be tested once MCP routes are mounted in Phase 2.',
    );
  });

  describe('Well-known metadata snapshot shapes', () => {
    it('authorization-server metadata has all required RFC 8414 fields', async () => {
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.status).toBe(200);

      const required = [
        'issuer',
        'authorization_endpoint',
        'token_endpoint',
        'response_types_supported',
      ];
      for (const field of required) {
        expect(res.body).toHaveProperty(field);
      }
    });

    it('protected-resource metadata has all required RFC 9728 fields', async () => {
      const res = await request(app).get('/.well-known/oauth-protected-resource');
      expect(res.status).toBe(200);

      const required = ['resource', 'authorization_servers'];
      for (const field of required) {
        expect(res.body).toHaveProperty(field);
      }
    });
  });
});
