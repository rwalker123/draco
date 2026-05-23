import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import crypto from 'crypto';

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: {
    getOauthRepository: vi.fn(),
    getUserRepository: vi.fn(),
  },
}));

import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { IOauthRepository } from '../../repositories/interfaces/IOauthRepository.js';
import type { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';

const TEST_ENV = {
  JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
  OAUTH_PEPPER: 'test-pepper-at-least-32-characters-long-abcdef',
  OAUTH_ISSUER: 'https://test.draco.com',
};

function setEnv(): void {
  Object.assign(process.env, TEST_ENV);
}

function clearTestEnv(): void {
  delete process.env.JWT_SECRET;
  delete process.env.OAUTH_PEPPER;
  delete process.env.OAUTH_ISSUER;
}

function makeRepo(
  overrides: Partial<MockedObject<IOauthRepository>> = {},
): MockedObject<IOauthRepository> {
  return {
    findClientById: vi.fn().mockResolvedValue(null),
    createClient: vi.fn().mockResolvedValue({
      client_id: 'mcp_test',
      name: 'test',
      client_secret_hash: null,
      hash_version: 1,
      redirect_uris: [],
      grant_types: ['authorization_code'],
      scopes: ['mcp:read'],
      token_endpoint_auth_method: 'none',
      registration_access_token_hash: 'hash',
      registered_by_user_id: null,
      software_id: null,
      software_version: null,
      disabled_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    }),
    createAuthorizationCode: vi.fn().mockResolvedValue(undefined),
    findAuthorizationCodeByHash: vi.fn().mockResolvedValue(null),
    consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
    createAccessToken: vi.fn().mockResolvedValue(undefined),
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    findAccessTokenByJti: vi.fn().mockResolvedValue(null),
    revokeAccessToken: vi.fn().mockResolvedValue(undefined),
    revokeAccessTokensByJtis: vi.fn().mockResolvedValue(undefined),
    findActiveAccessTokensByUser: vi.fn().mockResolvedValue([]),
    findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
    markRefreshTokenRevoked: vi.fn().mockResolvedValue(undefined),
    revokeRefreshChain: vi
      .fn()
      .mockResolvedValue({ revokedTokenHashes: [], affectedAccessTokenJtis: [] }),
    revokeRefreshChainsByUserAndClient: vi
      .fn()
      .mockResolvedValue({ revokedTokenHashes: [], affectedAccessTokenJtis: [] }),
    rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
    disableClient: vi.fn().mockResolvedValue(undefined),
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
    findByUserId: vi.fn().mockResolvedValue({
      id: 'user-123',
      username: 'testuser',
      securitystamp: 'stamp-abc',
      lockoutenabled: false,
      lockoutenddateutc: null,
      passwordhash: null,
      accessfailedcount: 0,
    }),
    ...overrides,
  } as MockedObject<IUserRepository>;
}

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    client_id: 'mcp_testclient',
    name: 'Test Client',
    client_secret_hash: null,
    hash_version: 1,
    redirect_uris: ['https://example.com/callback'],
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

function makeAuthCode(overrides: Record<string, unknown> = {}) {
  return {
    code_hash: 'codehash',
    hash_version: 1,
    client_id: 'mcp_testclient',
    user_id: 'user-123',
    redirect_uri: 'https://example.com/callback',
    scopes: ['mcp:read'],
    code_challenge: '',
    code_challenge_method: 'S256',
    resource: null,
    expires_at: new Date(Date.now() + 60000),
    consumed_at: null,
    created_at: new Date(),
    ...overrides,
  };
}

async function buildService() {
  vi.resetModules();
  const { OauthService } = await import('../../services/oauthService.js');
  return new OauthService();
}

describe('OauthService', () => {
  let repo: MockedObject<IOauthRepository>;
  let userRepo: MockedObject<IUserRepository>;

  beforeEach(() => {
    repo = makeRepo();
    userRepo = makeUserRepo();
    vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);
    vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);
    setEnv();
  });

  describe('registerClient', () => {
    it('returns client_id starting with mcp_', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
      });
      expect(result.client_id).toMatch(/^mcp_/);
    });

    it('returns registration_access_token on registration', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
      });
      expect(result.registration_access_token).toBeTruthy();
      expect(typeof result.registration_access_token).toBe('string');
    });

    it('generates client_secret for confidential clients', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
        token_endpoint_auth_method: 'client_secret_basic',
      });
      expect(result.client_secret).toBeTruthy();
    });

    it('does not return client_secret for public clients', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
        token_endpoint_auth_method: 'none',
      });
      expect(result.client_secret).toBeUndefined();
    });

    it('defaults grant_types to [authorization_code]', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
      });
      expect(result.grant_types).toContain('authorization_code');
    });

    it('rejects unsupported grant_type', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['https://example.com/callback'],
          grant_types: ['implicit'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_client_metadata' });
    });

    it('rejects unsupported response_type', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['https://example.com/callback'],
          response_types: ['token'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_client_metadata' });
    });

    it('rejects unsupported scope', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['https://example.com/callback'],
          scope: 'admin:write',
        }),
      ).rejects.toMatchObject({ error: 'invalid_client_metadata' });
    });

    it('rejects http non-loopback redirect URI', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['http://evil.com/callback'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_redirect_uri' });
    });

    it('accepts http localhost redirect URI', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['http://localhost:8080/callback'],
      });
      expect(result.redirect_uris[0]).toContain('localhost');
    });

    it('accepts http 127.0.0.1 redirect URI', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['http://127.0.0.1:8080/callback'],
      });
      expect(result.redirect_uris[0]).toContain('127.0.0.1');
    });

    it('accepts custom scheme redirect URI', async () => {
      const svc = await buildService();
      const result = await svc.registerClient({
        redirect_uris: ['claudeai://oauth/callback'],
      });
      expect(result.redirect_uris[0]).toBe('claudeai://oauth/callback');
    });

    it('rejects javascript: scheme', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['javascript:alert(1)'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_redirect_uri' });
    });

    it('rejects redirect URI with fragment', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['https://example.com/callback#fragment'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_redirect_uri' });
    });

    it('rejects redirect URI with userinfo', async () => {
      const svc = await buildService();
      await expect(
        svc.registerClient({
          redirect_uris: ['https://user:pass@example.com/callback'],
        }),
      ).rejects.toMatchObject({ error: 'invalid_redirect_uri' });
    });

    it('persists to repository', async () => {
      const svc = await buildService();
      await svc.registerClient({
        redirect_uris: ['https://example.com/callback'],
      });
      expect(repo.createClient).toHaveBeenCalledOnce();
    });
  });

  describe('createAuthorizationCode', () => {
    it('returns a code of 43 base64url characters (256 bits)', async () => {
      const svc = await buildService();
      const { code } = await svc.createAuthorizationCode({
        userId: 'user-123',
        clientId: 'mcp_client',
        redirectUri: 'https://example.com/callback',
        scopes: ['mcp:read'],
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });
      expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('persists code to repository with correct expiry (~60s)', async () => {
      const svc = await buildService();
      const before = Date.now();
      await svc.createAuthorizationCode({
        userId: 'user-123',
        clientId: 'mcp_client',
        redirectUri: 'https://example.com/callback',
        scopes: ['mcp:read'],
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });
      const after = Date.now();
      expect(repo.createAuthorizationCode).toHaveBeenCalledOnce();
      const call = vi.mocked(repo.createAuthorizationCode).mock.calls[0][0];
      const expMs = call.expires_at.getTime();
      expect(expMs).toBeGreaterThanOrEqual(before + 59000);
      expect(expMs).toBeLessThanOrEqual(after + 61000);
    });

    it('stores the sha256 hash of the code, not the code itself', async () => {
      const svc = await buildService();
      const { code } = await svc.createAuthorizationCode({
        userId: 'user-123',
        clientId: 'mcp_client',
        redirectUri: 'https://example.com/callback',
        scopes: ['mcp:read'],
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });
      const call = vi.mocked(repo.createAuthorizationCode).mock.calls[0][0];
      const expectedHash = crypto.createHash('sha256').update(code).digest('hex');
      expect(call.code_hash).toBe(expectedHash);
    });
  });

  describe('exchangeCode', () => {
    function buildCodeExchange(codeVerifier: string) {
      const challenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      return { codeVerifier, challenge };
    }

    it('happy path returns access_token and refresh_token', async () => {
      const { codeVerifier, challenge } = buildCodeExchange('myverifier12345678901234567890123');
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(
          makeAuthCode({
            code_hash: codeHash,
            code_challenge: challenge,
            code_challenge_method: 'S256',
          }),
        ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.exchangeCode({
        code: rawCode,
        codeVerifier,
        clientId: 'mcp_testclient',
        redirectUri: 'https://example.com/callback',
      });

      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
      expect(result.token_type).toBe('Bearer');
      expect(result.expires_in).toBe(3600);
    });

    it('throws invalid_grant when code not found', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: 'notexist',
          codeVerifier: 'verifier',
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant when code already consumed (reuse)', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi
          .fn()
          .mockResolvedValue(makeAuthCode({ code_hash: codeHash })),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(false),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier: 'verifier',
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('calls revokeAccessTokensByJtis on code reuse', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

      const revokeAccessByJtis = vi.fn().mockResolvedValue(undefined);
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi
          .fn()
          .mockResolvedValue(makeAuthCode({ code_hash: codeHash })),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(false),
        findActiveAccessTokensByUser: vi
          .fn()
          .mockResolvedValue([{ jti: 'jti-1', client_id: 'mcp_testclient', revoked_at: null }]),
        revokeAccessTokensByJtis: revokeAccessByJtis,
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier: 'verifier',
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });

      expect(revokeAccessByJtis).toHaveBeenCalled();
    });

    it('revokes refresh chains for user+client on code reuse', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

      const revokeChainsByUserAndClient = vi
        .fn()
        .mockResolvedValue({ revokedTokenHashes: ['h1'], affectedAccessTokenJtis: ['jti-rt'] });
      const revokeByJtis = vi.fn().mockResolvedValue(undefined);

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi
          .fn()
          .mockResolvedValue(
            makeAuthCode({ code_hash: codeHash, user_id: 'user-xyz', client_id: 'mcp_testclient' }),
          ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(false),
        revokeRefreshChainsByUserAndClient: revokeChainsByUserAndClient,
        revokeAccessTokensByJtis: revokeByJtis,
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier: 'verifier',
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });

      expect(revokeChainsByUserAndClient).toHaveBeenCalledWith(
        'user-xyz',
        'mcp_testclient',
        'code_replay_detected',
      );
      expect(revokeByJtis).toHaveBeenCalledWith(['jti-rt'], 'code_replay_detected');
    });

    it('throws invalid_grant when code expired', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
      const { codeVerifier, challenge } = buildCodeExchange('myverifier12345678901234567890123');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(
          makeAuthCode({
            code_hash: codeHash,
            expires_at: new Date(Date.now() - 1000),
            code_challenge: challenge,
          }),
        ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier,
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant on client_id mismatch', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
      const { codeVerifier, challenge } = buildCodeExchange('myverifier12345678901234567890123');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient({ client_id: 'mcp_other' })),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(
          makeAuthCode({
            code_hash: codeHash,
            code_challenge: challenge,
            client_id: 'mcp_different',
          }),
        ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier,
          clientId: 'mcp_other',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant on redirect_uri mismatch', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
      const { codeVerifier, challenge } = buildCodeExchange('myverifier12345678901234567890123');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(
          makeAuthCode({
            code_hash: codeHash,
            code_challenge: challenge,
          }),
        ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier,
          clientId: 'mcp_testclient',
          redirectUri: 'https://different.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant on PKCE mismatch', async () => {
      const rawCode = 'testcode123456789012345678901234567890123';
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findAuthorizationCodeByHash: vi.fn().mockResolvedValue(
          makeAuthCode({
            code_hash: codeHash,
            code_challenge: 'correct_challenge_hash_different_from_verifier',
          }),
        ),
        consumeAuthorizationCode: vi.fn().mockResolvedValue(true),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.exchangeCode({
          code: rawCode,
          codeVerifier: 'wrong_verifier',
          clientId: 'mcp_testclient',
          redirectUri: 'https://example.com/callback',
        }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_client (401) on client auth failure', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const err = await svc
        .exchangeCode({
          code: 'somecode',
          codeVerifier: 'verifier',
          clientId: 'unknown_client',
          redirectUri: 'https://example.com/callback',
        })
        .catch((e) => e);

      expect(err.error).toBe('invalid_client');
      expect(err.httpStatus).toBe(401);
    });
  });

  describe('refresh', () => {
    function makeRefreshToken(overrides: Record<string, unknown> = {}) {
      return {
        token_hash: 'refreshhash',
        hash_version: 1,
        chain_id: 'chain-uuid',
        parent_jti: null,
        current_access_token_jti: 'access-jti',
        client_id: 'mcp_testclient',
        user_id: 'user-123',
        scopes: ['mcp:read'],
        audience: 'mcp',
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 3600000),
        revoked_at: null,
        revocation_reason: null,
        ...overrides,
      };
    }

    it('happy path returns new access_token and refresh_token', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi.fn().mockResolvedValue(makeRefreshToken()),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.refresh({
        refreshToken: 'rawtoken',
        clientId: 'mcp_testclient',
      });

      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
    });

    it('throws invalid_grant when refresh token not found', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.refresh({ refreshToken: 'notexist', clientId: 'mcp_testclient' }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant when refresh token expired', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi
          .fn()
          .mockResolvedValue(makeRefreshToken({ expires_at: new Date(Date.now() - 1000) })),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.refresh({ refreshToken: 'expired', clientId: 'mcp_testclient' }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    it('throws invalid_grant and revokes chain on replay (revoked token reuse)', async () => {
      const revokeChain = vi
        .fn()
        .mockResolvedValue({ revokedTokenHashes: ['h'], affectedAccessTokenJtis: ['jti'] });
      const revokeByJtis = vi.fn().mockResolvedValue(undefined);

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi
          .fn()
          .mockResolvedValue(makeRefreshToken({ revoked_at: new Date(Date.now() - 5000) })),
        revokeRefreshChain: revokeChain,
        revokeAccessTokensByJtis: revokeByJtis,
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.refresh({ refreshToken: 'replayed', clientId: 'mcp_testclient' }),
      ).rejects.toMatchObject({ error: 'invalid_grant' });

      expect(revokeChain).toHaveBeenCalledWith('chain-uuid', 'replay_detected');
      expect(revokeByJtis).toHaveBeenCalledWith(['jti'], 'refresh_replay_detected');
    });

    it('throws invalid_scope when requesting scope not in grant', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi.fn().mockResolvedValue(makeRefreshToken()),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.refresh({
          refreshToken: 'token',
          clientId: 'mcp_testclient',
          scope: 'admin:write',
        }),
      ).rejects.toMatchObject({ error: 'invalid_scope' });
    });

    it('accepts scope narrowing (subset of granted scopes)', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi
          .fn()
          .mockResolvedValue(makeRefreshToken({ scopes: ['mcp:read', 'mcp:write'] })),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.refresh({
        refreshToken: 'token',
        clientId: 'mcp_testclient',
        scope: 'mcp:read',
      });
      expect(result.access_token).toBeTruthy();
    });
  });

  describe('revoke', () => {
    it('silently succeeds when token not found (access hint)', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.revoke({
          token: 'notavalidjwt',
          tokenTypeHint: 'access_token',
          clientId: 'mcp_testclient',
        }),
      ).resolves.toBeUndefined();
    });

    it('silently succeeds when refresh token not found', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(
        svc.revoke({
          token: 'whatever',
          tokenTypeHint: 'refresh_token',
          clientId: 'mcp_testclient',
        }),
      ).resolves.toBeUndefined();
    });

    it('throws invalid_client when client auth fails', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.revoke({ token: 'anytoken', clientId: 'unknown' })).rejects.toMatchObject({
        error: 'invalid_client',
      });
    });

    it('revokes refresh token when found and client matches', async () => {
      const markRevoked = vi.fn().mockResolvedValue(undefined);
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: vi.fn().mockResolvedValue({
          token_hash: 'hash',
          client_id: 'mcp_testclient',
          revoked_at: null,
          current_access_token_jti: 'jti-access',
          chain_id: 'chain',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          expires_at: new Date(Date.now() + 1000000),
          issued_at: new Date(),
          hash_version: 1,
          parent_jti: null,
          revocation_reason: null,
        }),
        markRefreshTokenRevoked: markRevoked,
        revokeAccessToken: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await svc.revoke({
        token: 'rawrefresh',
        tokenTypeHint: 'refresh_token',
        clientId: 'mcp_testclient',
      });

      expect(markRevoked).toHaveBeenCalled();
    });

    it('tries refresh then access when no hint given', async () => {
      const findRefresh = vi.fn().mockResolvedValue(null);
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
        findRefreshTokenByHash: findRefresh,
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await svc.revoke({ token: 'anytoken', clientId: 'mcp_testclient' });
      expect(findRefresh).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    async function issueRealToken(jti: string) {
      const { default: jwt } = await import('jsonwebtoken');
      const payload = {
        sub: 'user-123',
        aud: 'mcp',
        iss: TEST_ENV.OAUTH_ISSUER,
        scope: 'mcp:read',
        client_id: 'mcp_testclient',
        jti,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      return jwt.sign(payload, TEST_ENV.JWT_SECRET, { algorithm: 'HS256', noTimestamp: true });
    }

    it('happy path returns userId, scopes, jti, clientId', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      repo = makeRepo({
        findAccessTokenByJti: vi.fn().mockResolvedValue({
          jti,
          client_id: 'mcp_testclient',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          security_stamp: 'stamp-abc',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          revoked_at: null,
          revocation_reason: null,
        }),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.verifyAccessToken(token);

      expect(result.userId).toBe('user-123');
      expect(result.scopes).toContain('mcp:read');
      expect(result.jti).toBe(jti);
    });

    it('throws on malformed JWT', async () => {
      const svc = await buildService();
      await expect(svc.verifyAccessToken('not.a.jwt')).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
      });
    });

    it('throws on wrong audience', async () => {
      const { default: jwt } = await import('jsonwebtoken');
      const token = jwt.sign(
        { sub: 'user-123', aud: 'frontend', scope: 'mcp:read', client_id: 'c', jti: 'j' },
        TEST_ENV.JWT_SECRET,
        { algorithm: 'HS256' },
      );
      const svc = await buildService();
      await expect(svc.verifyAccessToken(token)).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
      });
    });

    it('throws on wrong issuer', async () => {
      const { default: jwt } = await import('jsonwebtoken');
      const token = jwt.sign(
        { sub: 'user-123', aud: 'mcp', iss: 'wrong', scope: 'mcp:read', client_id: 'c', jti: 'j' },
        TEST_ENV.JWT_SECRET,
        { algorithm: 'HS256', noTimestamp: true },
      );
      const svc = await buildService();
      await expect(svc.verifyAccessToken(token)).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
      });
    });

    it('throws when token not in repository', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      repo = makeRepo({
        findAccessTokenByJti: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.verifyAccessToken(token)).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
        message: 'Token unknown',
      });
    });

    it('throws when token is revoked', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      repo = makeRepo({
        findAccessTokenByJti: vi.fn().mockResolvedValue({
          jti,
          client_id: 'mcp_testclient',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          security_stamp: 'stamp-abc',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          revoked_at: new Date(),
          revocation_reason: 'client_revoked',
        }),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.verifyAccessToken(token)).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
        message: 'Token revoked',
      });
    });

    it('throws on security stamp mismatch', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      repo = makeRepo({
        findAccessTokenByJti: vi.fn().mockResolvedValue({
          jti,
          client_id: 'mcp_testclient',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          security_stamp: 'old-stamp',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          revoked_at: null,
          revocation_reason: null,
        }),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      userRepo = makeUserRepo({
        findByUserId: vi.fn().mockResolvedValue({
          id: 'user-123',
          username: 'testuser',
          securitystamp: 'new-stamp-different',
        }),
      });
      vi.mocked(RepositoryFactory.getUserRepository).mockReturnValue(userRepo);

      const svc = await buildService();
      await expect(svc.verifyAccessToken(token)).rejects.toMatchObject({
        name: 'OauthAuthenticationError',
        message: 'Security stamp invalidated',
      });
    });
  });

  describe('introspect', () => {
    const RAW_SECRET = 'introspect-test-secret';
    const REAL_SECRET_HASH = crypto
      .createHmac('sha256', TEST_ENV.OAUTH_PEPPER)
      .update(RAW_SECRET)
      .digest('hex');

    async function issueRealToken(jti: string) {
      const { default: jwt } = await import('jsonwebtoken');
      return jwt.sign(
        {
          sub: 'user-123',
          aud: 'mcp',
          iss: TEST_ENV.OAUTH_ISSUER,
          scope: 'mcp:read',
          client_id: 'mcp_confidential',
          jti,
        },
        TEST_ENV.JWT_SECRET,
        { algorithm: 'HS256' },
      );
    }

    it('returns active:true for valid token from confidential client', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      const confidentialClient = makeClient({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: REAL_SECRET_HASH,
      });

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(confidentialClient),
        findAccessTokenByJti: vi.fn().mockResolvedValue({
          jti,
          client_id: 'mcp_confidential',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          security_stamp: 'stamp-abc',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          revoked_at: null,
          revocation_reason: null,
        }),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.introspect({
        token,
        clientId: 'mcp_confidential',
        clientSecret: RAW_SECRET,
      });

      expect(result).toMatchObject({ active: true });
    });

    it('returns active:false for public client', async () => {
      repo = makeRepo({
        findClientById: vi
          .fn()
          .mockResolvedValue(makeClient({ token_endpoint_auth_method: 'none' })),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.introspect({
        token: 'anytoken',
        clientId: 'mcp_testclient',
      });

      expect(result).toMatchObject({ active: false });
    });

    it('returns active:false for revoked token', async () => {
      const jti = crypto.randomUUID();
      const token = await issueRealToken(jti);

      const confidentialClient = makeClient({
        client_id: 'mcp_confidential',
        token_endpoint_auth_method: 'client_secret_basic',
        client_secret_hash: REAL_SECRET_HASH,
      });

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(confidentialClient),
        findAccessTokenByJti: vi.fn().mockResolvedValue({
          jti,
          client_id: 'mcp_confidential',
          user_id: 'user-123',
          scopes: ['mcp:read'],
          audience: 'mcp',
          security_stamp: 'stamp-abc',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          revoked_at: new Date(),
          revocation_reason: 'client_revoked',
        }),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const result = await svc.introspect({
        token,
        clientId: 'mcp_confidential',
        clientSecret: RAW_SECRET,
      });

      expect(result).toMatchObject({ active: false });
    });
  });

  describe('authenticateClient', () => {
    it('accepts public client with no secret', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const client = await svc.authenticateClient('mcp_testclient', undefined);
      expect(client.client_id).toBe('mcp_testclient');
    });

    it('rejects public client that provides a secret', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient()),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.authenticateClient('mcp_testclient', 'somesecret')).rejects.toMatchObject({
        error: 'invalid_client',
      });
    });

    it('rejects disabled client', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(makeClient({ disabled_at: new Date() })),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.authenticateClient('mcp_testclient')).rejects.toMatchObject({
        error: 'invalid_client',
      });
    });

    it('accepts confidential client with correct secret', async () => {
      const helperSvc = await buildService();
      const rawSecret = 'mysecret';
      const secretHash = helperSvc.hmacSha256(TEST_ENV.OAUTH_PEPPER, rawSecret);

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(
          makeClient({
            token_endpoint_auth_method: 'client_secret_basic',
            client_secret_hash: secretHash,
          }),
        ),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      const client = await svc.authenticateClient('mcp_testclient', rawSecret);
      expect(client.client_id).toBe('mcp_testclient');
    });

    it('rejects confidential client with wrong secret', async () => {
      const helperSvc = await buildService();
      const secretHash = helperSvc.hmacSha256(TEST_ENV.OAUTH_PEPPER, 'correctsecret');

      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(
          makeClient({
            token_endpoint_auth_method: 'client_secret_basic',
            client_secret_hash: secretHash,
          }),
        ),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.authenticateClient('mcp_testclient', 'wrongsecret')).rejects.toMatchObject({
        error: 'invalid_client',
        httpStatus: 401,
      });
    });

    it('rejects unknown client_id (timing equalized)', async () => {
      repo = makeRepo({
        findClientById: vi.fn().mockResolvedValue(null),
      });
      vi.mocked(RepositoryFactory.getOauthRepository).mockReturnValue(repo);

      const svc = await buildService();
      await expect(svc.authenticateClient('unknown_client')).rejects.toMatchObject({
        error: 'invalid_client',
        httpStatus: 401,
      });
    });
  });

  describe('env cleanup', () => {
    it('cleans up after tests', () => {
      clearTestEnv();
      expect(true).toBe(true);
    });
  });
});
