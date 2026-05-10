import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IOauthRepository, OauthClient } from '../repositories/interfaces/IOauthRepository.js';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
import { OauthError, OauthAuthenticationError } from './oauthErrors.js';
import type {
  DCRRequest,
  DCRResponse,
  TokenResponse,
  IntrospectionResponse,
  OauthAccessTokenPayload,
  CreateAuthorizationCodeInput,
  ExchangeCodeInput,
  RefreshInput,
  RevokeInput,
  IntrospectInput,
} from './oauthSchemas.js';
import { DCRRequestSchema } from './oauthSchemas.js';
import type {
  OauthConsentRequest,
  CreateConsentRequestInput,
} from '../repositories/interfaces/IOauthRepository.js';

const SUPPORTED_SCOPES = new Set(['mcp:read']);
const SUPPORTED_GRANT_TYPES = new Set(['authorization_code', 'refresh_token']);
const SUPPORTED_RESPONSE_TYPES = new Set(['code']);
const ACCESS_TOKEN_TTL_SECONDS = 3600;
const REFRESH_TOKEN_TTL_DAYS = 30;
const AUTH_CODE_TTL_SECONDS = 60;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function isValidRedirectUri(uri: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    const customSchemeMatch = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(uri);
    if (customSchemeMatch) {
      return true;
    }
    return false;
  }

  if (parsed.hash) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  const scheme = parsed.protocol.replace(/:$/, '');

  if (['data', 'javascript', 'file'].includes(scheme)) {
    return false;
  }

  if (scheme === 'https') {
    return true;
  }

  if (scheme === 'http') {
    const host = parsed.hostname;
    return LOOPBACK_HOSTS.has(host);
  }

  return true;
}

function normalizeRedirectUri(uri: string): string {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return uri;
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.protocol = parsed.protocol.toLowerCase();

  const defaultPorts: Record<string, string> = { 'https:': '443', 'http:': '80' };
  const defaultPort = defaultPorts[parsed.protocol];
  if (defaultPort && parsed.port === defaultPort) {
    parsed.port = '';
  }

  return parsed.toString();
}

export class OauthService {
  private readonly jwtSecret: string;
  private readonly pepper: string;
  private readonly issuer: string;
  private readonly registrationBaseUrl: string;

  private readonly repository: IOauthRepository;
  private readonly userRepository: IUserRepository;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const pepper = process.env.OAUTH_PEPPER;
    if (!pepper || pepper.length < 32) {
      throw new Error('OAUTH_PEPPER environment variable must be set with at least 32 characters');
    }

    const issuer = process.env.OAUTH_ISSUER;
    if (!issuer) {
      throw new Error('OAUTH_ISSUER environment variable is required');
    }

    this.jwtSecret = jwtSecret;
    this.pepper = pepper;
    this.issuer = issuer;
    this.registrationBaseUrl =
      process.env.OAUTH_REGISTRATION_BASE_URL ?? 'http://localhost:3001/oauth/clients';

    this.repository = RepositoryFactory.getOauthRepository();
    this.userRepository = RepositoryFactory.getUserRepository();
  }

  async registerClient(input: DCRRequest): Promise<DCRResponse> {
    const parsed = DCRRequestSchema.safeParse(input);
    if (!parsed.success) {
      throw new OauthError('invalid_client_metadata', parsed.error.message);
    }

    const data = parsed.data;

    const normalizedUris = data.redirect_uris.map((uri) => {
      if (!isValidRedirectUri(uri)) {
        throw new OauthError('invalid_redirect_uri', `Redirect URI not allowed: ${uri}`);
      }
      return normalizeRedirectUri(uri);
    });

    const grantTypes = data.grant_types ?? ['authorization_code'];
    for (const gt of grantTypes) {
      if (!SUPPORTED_GRANT_TYPES.has(gt)) {
        throw new OauthError('invalid_client_metadata', `Unsupported grant_type: ${gt}`);
      }
    }

    const responseTypes = data.response_types ?? ['code'];
    for (const rt of responseTypes) {
      if (!SUPPORTED_RESPONSE_TYPES.has(rt)) {
        throw new OauthError('invalid_client_metadata', `Unsupported response_type: ${rt}`);
      }
    }

    const scopeString = data.scope ?? 'mcp:read';
    const requestedScopes = scopeString.split(' ').filter(Boolean);
    for (const s of requestedScopes) {
      if (!SUPPORTED_SCOPES.has(s)) {
        throw new OauthError('invalid_client_metadata', `Unsupported scope: ${s}`);
      }
    }

    const tokenEndpointAuthMethod = data.token_endpoint_auth_method ?? 'none';

    const clientId = `mcp_${base64url(crypto.randomBytes(32))}`;

    let rawSecret: string | undefined;
    let secretHash: string | undefined;
    if (tokenEndpointAuthMethod !== 'none') {
      const secretBytes = crypto.randomBytes(48);
      rawSecret = base64url(secretBytes);
      secretHash = this.hmacSha256(this.pepper, rawSecret);
    }

    const rawRegToken = base64url(crypto.randomBytes(48));
    const regTokenHash = this.hmacSha256(this.pepper, rawRegToken);

    await this.repository.createClient({
      client_id: clientId,
      name: data.client_name ?? clientId,
      client_secret_hash: secretHash ?? null,
      redirect_uris: normalizedUris,
      grant_types: grantTypes,
      scopes: requestedScopes,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      registration_access_token_hash: regTokenHash,
      software_id: data.software_id ?? null,
      software_version: data.software_version ?? null,
    });

    const now = Math.floor(Date.now() / 1000);

    return {
      client_id: clientId,
      ...(rawSecret !== undefined ? { client_secret: rawSecret } : {}),
      client_id_issued_at: now,
      client_secret_expires_at: 0,
      registration_access_token: rawRegToken,
      registration_client_uri: `${this.registrationBaseUrl}/${clientId}`,
      redirect_uris: normalizedUris,
      client_name: data.client_name,
      scope: scopeString,
      grant_types: grantTypes,
      response_types: responseTypes,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
    };
  }

  async createAuthorizationCode(input: CreateAuthorizationCodeInput): Promise<{ code: string }> {
    const code = base64url(crypto.randomBytes(32));
    const codeHash = this.sha256(code);

    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000);

    await this.repository.createAuthorizationCode({
      code_hash: codeHash,
      client_id: input.clientId,
      user_id: input.userId,
      redirect_uri: input.redirectUri,
      scopes: input.scopes,
      code_challenge: input.codeChallenge,
      code_challenge_method: input.codeChallengeMethod,
      resource: input.resource ?? null,
      expires_at: expiresAt,
    });

    return { code };
  }

  async exchangeCode(input: ExchangeCodeInput): Promise<TokenResponse> {
    const client = await this.authenticateClient(input.clientId, input.clientSecret);

    const codeHash = this.sha256(input.code);
    const codeRow = await this.repository.findAuthorizationCodeByHash(codeHash);

    if (!codeRow) {
      throw new OauthError('invalid_grant', 'Authorization code not found');
    }

    const consumed = await this.repository.consumeAuthorizationCode(codeHash);

    if (!consumed) {
      const chainResult = await this.repository.revokeRefreshChain(
        `${codeRow.client_id}:${codeRow.user_id}`,
        'code_replay_detected',
      );
      await this.repository.revokeAccessTokensByJtis(
        chainResult.affectedAccessTokenJtis,
        'code_replay_detected',
      );

      const activeTokens = await this.repository.findActiveAccessTokensByUser(codeRow.user_id);
      const clientActiveJtis = activeTokens
        .filter((t) => t.client_id === codeRow.client_id)
        .map((t) => t.jti);
      if (clientActiveJtis.length > 0) {
        await this.repository.revokeAccessTokensByJtis(clientActiveJtis, 'code_replay_detected');
      }

      throw new OauthError('invalid_grant', 'Authorization code already used');
    }

    if (codeRow.expires_at < new Date()) {
      throw new OauthError('invalid_grant', 'Authorization code expired');
    }

    if (!this.constantTimeStringEqual(codeRow.client_id, input.clientId)) {
      throw new OauthError('invalid_grant', 'Client mismatch');
    }

    if (codeRow.redirect_uri !== input.redirectUri) {
      throw new OauthError('invalid_grant', 'Redirect URI mismatch');
    }

    const expectedChallenge = base64url(Buffer.from(this.sha256Hex(input.codeVerifier), 'hex'));
    if (!this.constantTimeStringEqual(expectedChallenge, codeRow.code_challenge)) {
      throw new OauthError('invalid_grant', 'PKCE verification failed');
    }

    return this.issueTokenPair({
      userId: codeRow.user_id,
      clientId: client.client_id,
      scopes: codeRow.scopes,
    });
  }

  async refresh(input: RefreshInput): Promise<TokenResponse> {
    const client = await this.authenticateClient(input.clientId, input.clientSecret);

    const tokenHash = this.hmacSha256(this.pepper, input.refreshToken);
    const tokenRow = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!tokenRow) {
      throw new OauthError('invalid_grant', 'Refresh token not found');
    }

    if (!this.constantTimeStringEqual(tokenRow.client_id, input.clientId)) {
      throw new OauthError('invalid_grant', 'Client mismatch');
    }

    if (tokenRow.revoked_at !== null) {
      console.error(
        JSON.stringify({
          event: 'refresh_replay_detected',
          user_id: tokenRow.user_id,
          client_id: tokenRow.client_id,
          chain_id: tokenRow.chain_id,
        }),
      );

      const chainResult = await this.repository.revokeRefreshChain(
        tokenRow.chain_id,
        'replay_detected',
      );
      await this.repository.revokeAccessTokensByJtis(
        chainResult.affectedAccessTokenJtis,
        'refresh_replay_detected',
      );

      throw new OauthError('invalid_grant', 'Refresh token has been revoked');
    }

    if (tokenRow.expires_at < new Date()) {
      throw new OauthError('invalid_grant', 'Refresh token expired');
    }

    const effectiveScopes = tokenRow.scopes;
    if (input.scope) {
      const requested = input.scope.split(' ').filter(Boolean);
      for (const s of requested) {
        if (!effectiveScopes.includes(s)) {
          throw new OauthError('invalid_scope', `Scope not granted: ${s}`);
        }
      }
    }

    const user = await this.userRepository.findByUserId(tokenRow.user_id);
    const securityStamp = user?.securitystamp ?? null;

    const newAccessJti = crypto.randomUUID();
    const nowMs = Date.now();
    const accessExpiresAt = new Date(nowMs + ACCESS_TOKEN_TTL_SECONDS * 1000);

    const accessPayload: OauthAccessTokenPayload = {
      sub: tokenRow.user_id,
      aud: 'mcp',
      iss: this.issuer,
      scope: effectiveScopes.join(' '),
      client_id: client.client_id,
      jti: newAccessJti,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(accessExpiresAt.getTime() / 1000),
    };

    const newAccessToken = this.signAccessJwt(accessPayload);

    const newRefreshRaw = base64url(crypto.randomBytes(48));
    const newRefreshHash = this.hmacSha256(this.pepper, newRefreshRaw);
    const refreshExpiresAt = new Date(nowMs + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);

    await this.repository.createAccessToken({
      jti: newAccessJti,
      client_id: client.client_id,
      user_id: tokenRow.user_id,
      scopes: effectiveScopes,
      audience: 'mcp',
      security_stamp: securityStamp,
      expires_at: accessExpiresAt,
    });

    await this.repository.rotateRefreshToken({
      oldHash: tokenHash,
      newToken: {
        token_hash: newRefreshHash,
        chain_id: tokenRow.chain_id,
        parent_jti: tokenRow.current_access_token_jti ?? undefined,
        current_access_token_jti: newAccessJti,
        client_id: client.client_id,
        user_id: tokenRow.user_id,
        scopes: effectiveScopes,
        audience: 'mcp',
        expires_at: refreshExpiresAt,
      },
      newAccessTokenJti: newAccessJti,
    });

    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: newRefreshRaw,
      scope: effectiveScopes.join(' '),
    };
  }

  async revoke(input: RevokeInput): Promise<void> {
    await this.authenticateClient(input.clientId, input.clientSecret);

    const tryRevokeRefresh = async (): Promise<boolean> => {
      const hash = this.hmacSha256(this.pepper, input.token);
      const row = await this.repository.findRefreshTokenByHash(hash);
      if (!row || !this.constantTimeStringEqual(row.client_id, input.clientId)) {
        return false;
      }
      if (row.revoked_at === null) {
        await this.repository.markRefreshTokenRevoked(hash, 'client_revoked');
        if (row.current_access_token_jti) {
          await this.repository.revokeAccessToken(row.current_access_token_jti, 'client_revoked');
        }
      }
      return true;
    };

    const tryRevokeAccess = async (): Promise<boolean> => {
      try {
        const payload = jwt.verify(input.token, this.jwtSecret, {
          algorithms: ['HS256'],
          audience: 'mcp',
          issuer: this.issuer,
        }) as OauthAccessTokenPayload;

        if (!this.constantTimeStringEqual(payload.client_id, input.clientId)) {
          return false;
        }

        const row = await this.repository.findAccessTokenByJti(payload.jti);
        if (row && row.revoked_at === null) {
          await this.repository.revokeAccessToken(payload.jti, 'client_revoked');
        }
        return true;
      } catch {
        return false;
      }
    };

    const hint = input.tokenTypeHint;

    if (hint === 'access_token') {
      await tryRevokeAccess();
      return;
    }

    if (hint === 'refresh_token') {
      await tryRevokeRefresh();
      return;
    }

    const revokedAsRefresh = await tryRevokeRefresh();
    if (!revokedAsRefresh) {
      await tryRevokeAccess();
    }
  }

  async verifyAccessToken(rawToken: string): Promise<{
    userId: string;
    scopes: string[];
    jti: string;
    clientId: string;
    expiresAt: number;
  }> {
    let payload: OauthAccessTokenPayload;
    try {
      payload = jwt.verify(rawToken, this.jwtSecret, {
        algorithms: ['HS256'],
        audience: 'mcp',
        issuer: this.issuer,
      }) as OauthAccessTokenPayload;
    } catch (err) {
      throw new OauthAuthenticationError(
        err instanceof Error ? err.message : 'Token verification failed',
      );
    }

    const tokenRow = await this.repository.findAccessTokenByJti(payload.jti);
    if (!tokenRow) {
      throw new OauthAuthenticationError('Token unknown');
    }

    if (tokenRow.revoked_at !== null) {
      throw new OauthAuthenticationError('Token revoked');
    }

    if (tokenRow.expires_at < new Date()) {
      throw new OauthAuthenticationError('Token expired');
    }

    const user = await this.userRepository.findByUserId(payload.sub);
    if (!user) {
      throw new OauthAuthenticationError('User not found');
    }

    if (tokenRow.security_stamp !== null && tokenRow.security_stamp !== user.securitystamp) {
      throw new OauthAuthenticationError('Security stamp invalidated');
    }

    return {
      userId: payload.sub,
      scopes: payload.scope.split(' ').filter(Boolean),
      jti: payload.jti,
      clientId: payload.client_id,
      expiresAt: payload.exp * 1000,
    };
  }

  async introspect(input: IntrospectInput): Promise<IntrospectionResponse> {
    const client = await this.authenticateClient(input.clientId, input.clientSecret).catch(
      () => null,
    );

    if (!client) {
      return { active: false };
    }

    if (client.token_endpoint_auth_method === 'none') {
      return { active: false };
    }

    try {
      const payload = jwt.verify(input.token, this.jwtSecret, {
        algorithms: ['HS256'],
        audience: 'mcp',
        issuer: this.issuer,
      }) as OauthAccessTokenPayload;

      if (!this.constantTimeStringEqual(payload.client_id, input.clientId)) {
        return { active: false };
      }

      const tokenRow = await this.repository.findAccessTokenByJti(payload.jti);
      if (!tokenRow || tokenRow.revoked_at !== null || tokenRow.expires_at < new Date()) {
        return { active: false };
      }

      const user = await this.userRepository.findByUserId(payload.sub);
      if (!user) {
        return { active: false };
      }

      if (tokenRow.security_stamp !== null && tokenRow.security_stamp !== user.securitystamp) {
        return { active: false };
      }

      return {
        active: true,
        scope: payload.scope,
        client_id: payload.client_id,
        username: user.username ?? undefined,
        sub: payload.sub,
        aud: 'mcp',
        iss: this.issuer,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
      };
    } catch {
      return { active: false };
    }
  }

  async getPublicClient(clientId: string): Promise<{
    client_id: string;
    name: string;
    scopes: string[];
    redirect_uris: string[];
    disabled: boolean;
  } | null> {
    const client = await this.repository.findClientById(clientId);
    if (!client) {
      return null;
    }
    return {
      client_id: client.client_id,
      name: client.name,
      scopes: client.scopes,
      redirect_uris: client.redirect_uris,
      disabled: client.disabled_at !== null,
    };
  }

  async createConsentRequest(input: {
    rid: string;
    userId: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    state?: string | null;
    codeChallenge: string;
    codeChallengeMethod: string;
    resource?: string | null;
    expiresAt: Date;
  }): Promise<void> {
    const repoInput: CreateConsentRequestInput = {
      rid: input.rid,
      client_id: input.clientId,
      user_id: input.userId,
      redirect_uri: input.redirectUri,
      scopes: input.scopes,
      state: input.state ?? null,
      code_challenge: input.codeChallenge,
      code_challenge_method: input.codeChallengeMethod,
      resource: input.resource ?? null,
      expires_at: input.expiresAt,
    };
    await this.repository.createConsentRequest(repoInput);
  }

  async consumeConsentRequest(rid: string): Promise<OauthConsentRequest | null> {
    const row = await this.repository.findConsentRequestByRid(rid);
    if (!row || row.consumed_at !== null || row.expires_at < new Date()) {
      return null;
    }
    const consumed = await this.repository.consumeConsentRequest(rid);
    return consumed ? row : null;
  }

  async authenticateClient(clientId: string, clientSecret?: string): Promise<OauthClient> {
    const client = await this.repository.findClientById(clientId);

    if (!client) {
      this.dummyHmac();
      throw new OauthError('invalid_client', 'Client authentication failed', {
        httpStatus: 401,
        includeBasicChallenge: true,
      });
    }

    if (client.disabled_at !== null) {
      throw new OauthError('invalid_client', 'Client is disabled', {
        httpStatus: 401,
        includeBasicChallenge: true,
      });
    }

    if (client.token_endpoint_auth_method === 'none') {
      if (clientSecret !== undefined && clientSecret !== '') {
        throw new OauthError('invalid_client', 'Public clients must not provide a client secret', {
          httpStatus: 401,
          includeBasicChallenge: true,
        });
      }
      return client;
    }

    if (!clientSecret) {
      throw new OauthError('invalid_client', 'Client authentication failed', {
        httpStatus: 401,
        includeBasicChallenge: true,
      });
    }

    const providedHash = this.hmacSha256(this.pepper, clientSecret);

    if (!client.client_secret_hash) {
      throw new OauthError('invalid_client', 'Client authentication failed', {
        httpStatus: 401,
        includeBasicChallenge: true,
      });
    }

    if (!this.constantTimeStringEqual(providedHash, client.client_secret_hash)) {
      throw new OauthError('invalid_client', 'Client authentication failed', {
        httpStatus: 401,
        includeBasicChallenge: true,
      });
    }

    return client;
  }

  private async issueTokenPair(params: {
    userId: string;
    clientId: string;
    scopes: string[];
  }): Promise<TokenResponse> {
    const user = await this.userRepository.findByUserId(params.userId);
    const securityStamp = user?.securitystamp ?? null;

    const chainId = crypto.randomUUID();
    const accessJti = crypto.randomUUID();
    const nowMs = Date.now();
    const accessExpiresAt = new Date(nowMs + ACCESS_TOKEN_TTL_SECONDS * 1000);

    const accessPayload: OauthAccessTokenPayload = {
      sub: params.userId,
      aud: 'mcp',
      iss: this.issuer,
      scope: params.scopes.join(' '),
      client_id: params.clientId,
      jti: accessJti,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(accessExpiresAt.getTime() / 1000),
    };

    const accessToken = this.signAccessJwt(accessPayload);

    const refreshRaw = base64url(crypto.randomBytes(48));
    const refreshHash = this.hmacSha256(this.pepper, refreshRaw);
    const refreshExpiresAt = new Date(nowMs + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);

    await this.repository.createAccessToken({
      jti: accessJti,
      client_id: params.clientId,
      user_id: params.userId,
      scopes: params.scopes,
      audience: 'mcp',
      security_stamp: securityStamp,
      expires_at: accessExpiresAt,
    });

    await this.repository.createRefreshToken({
      token_hash: refreshHash,
      chain_id: chainId,
      parent_jti: null,
      current_access_token_jti: accessJti,
      client_id: params.clientId,
      user_id: params.userId,
      scopes: params.scopes,
      audience: 'mcp',
      expires_at: refreshExpiresAt,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshRaw,
      scope: params.scopes.join(' '),
    };
  }

  private signAccessJwt(payload: OauthAccessTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256', noTimestamp: true });
  }

  hmacSha256(key: string, value: string): string {
    return crypto.createHmac('sha256', key).update(value).digest('hex');
  }

  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private sha256Hex(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  constantTimeStringEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  }

  private dummyHmac(): void {
    crypto.createHmac('sha256', this.pepper).update('dummy').digest('hex');
  }
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}
