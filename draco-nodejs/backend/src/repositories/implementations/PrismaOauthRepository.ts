import { Prisma, PrismaClient } from '#prisma/client';
import {
  IOauthRepository,
  OauthClient,
  OauthAuthorizationCode,
  OauthAccessToken,
  OauthRefreshToken,
  OauthConsentRequest,
  CreateClientInput,
  CreateAuthCodeInput,
  CreateAccessTokenInput,
  CreateRefreshTokenInput,
  CreateConsentRequestInput,
  RevokeRefreshChainResult,
} from '../interfaces/IOauthRepository.js';

const oauthClientSelect = {
  client_id: true,
  name: true,
  client_secret_hash: true,
  hash_version: true,
  redirect_uris: true,
  grant_types: true,
  scopes: true,
  token_endpoint_auth_method: true,
  registration_access_token_hash: true,
  registered_by_user_id: true,
  software_id: true,
  software_version: true,
  disabled_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.oauth_clientSelect;

const oauthAuthCodeSelect = {
  code_hash: true,
  hash_version: true,
  client_id: true,
  user_id: true,
  redirect_uri: true,
  scopes: true,
  code_challenge: true,
  code_challenge_method: true,
  resource: true,
  expires_at: true,
  consumed_at: true,
  created_at: true,
} satisfies Prisma.oauth_authorization_codeSelect;

const oauthAccessTokenSelect = {
  jti: true,
  client_id: true,
  user_id: true,
  scopes: true,
  audience: true,
  security_stamp: true,
  issued_at: true,
  expires_at: true,
  revoked_at: true,
  revocation_reason: true,
} satisfies Prisma.oauth_access_tokenSelect;

const oauthRefreshTokenSelect = {
  token_hash: true,
  hash_version: true,
  chain_id: true,
  parent_jti: true,
  current_access_token_jti: true,
  client_id: true,
  user_id: true,
  scopes: true,
  audience: true,
  issued_at: true,
  expires_at: true,
  revoked_at: true,
  revocation_reason: true,
} satisfies Prisma.oauth_refresh_tokenSelect;

const oauthConsentRequestSelect = {
  rid: true,
  client_id: true,
  user_id: true,
  redirect_uri: true,
  scopes: true,
  state: true,
  code_challenge: true,
  code_challenge_method: true,
  resource: true,
  expires_at: true,
  consumed_at: true,
  created_at: true,
} satisfies Prisma.oauth_consent_requestSelect;

export class PrismaOauthRepository implements IOauthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findClientById(clientId: string): Promise<OauthClient | null> {
    return this.prisma.oauth_client.findUnique({
      where: { client_id: clientId },
      select: oauthClientSelect,
    });
  }

  async createClient(input: CreateClientInput): Promise<OauthClient> {
    return this.prisma.oauth_client.create({
      data: {
        client_id: input.client_id,
        name: input.name,
        client_secret_hash: input.client_secret_hash ?? null,
        hash_version: input.hash_version ?? 1,
        redirect_uris: input.redirect_uris,
        grant_types: input.grant_types,
        scopes: input.scopes,
        token_endpoint_auth_method: input.token_endpoint_auth_method,
        registration_access_token_hash: input.registration_access_token_hash,
        registered_by_user_id: input.registered_by_user_id ?? null,
        software_id: input.software_id ?? null,
        software_version: input.software_version ?? null,
      },
      select: oauthClientSelect,
    });
  }

  async disableClient(clientId: string): Promise<void> {
    await this.prisma.oauth_client.update({
      where: { client_id: clientId },
      data: { disabled_at: new Date() },
    });
  }

  async createAuthorizationCode(input: CreateAuthCodeInput): Promise<void> {
    await this.prisma.oauth_authorization_code.create({
      data: {
        code_hash: input.code_hash,
        hash_version: input.hash_version ?? 1,
        client_id: input.client_id,
        user_id: input.user_id,
        redirect_uri: input.redirect_uri,
        scopes: input.scopes,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
        resource: input.resource ?? null,
        expires_at: input.expires_at,
      },
    });
  }

  async findAuthorizationCodeByHash(codeHash: string): Promise<OauthAuthorizationCode | null> {
    return this.prisma.oauth_authorization_code.findUnique({
      where: { code_hash: codeHash },
      select: oauthAuthCodeSelect,
    });
  }

  async consumeAuthorizationCode(codeHash: string): Promise<boolean> {
    const result = await this.prisma.oauth_authorization_code.updateMany({
      where: { code_hash: codeHash, consumed_at: null },
      data: { consumed_at: new Date() },
    });
    return result.count === 1;
  }

  async createAccessToken(input: CreateAccessTokenInput): Promise<void> {
    await this.prisma.oauth_access_token.create({
      data: {
        jti: input.jti,
        client_id: input.client_id,
        user_id: input.user_id,
        scopes: input.scopes,
        audience: input.audience,
        security_stamp: input.security_stamp ?? null,
        expires_at: input.expires_at,
      },
    });
  }

  async findAccessTokenByJti(jti: string): Promise<OauthAccessToken | null> {
    return this.prisma.oauth_access_token.findUnique({
      where: { jti },
      select: oauthAccessTokenSelect,
    });
  }

  async revokeAccessToken(jti: string, reason: string): Promise<void> {
    await this.prisma.oauth_access_token.update({
      where: { jti },
      data: { revoked_at: new Date(), revocation_reason: reason },
    });
  }

  async revokeAccessTokensByJtis(jtis: string[], reason: string): Promise<void> {
    if (jtis.length === 0) return;
    await this.prisma.oauth_access_token.updateMany({
      where: { jti: { in: jtis }, revoked_at: null },
      data: { revoked_at: new Date(), revocation_reason: reason },
    });
  }

  async findActiveAccessTokensByUser(userId: string): Promise<OauthAccessToken[]> {
    return this.prisma.oauth_access_token.findMany({
      where: { user_id: userId, revoked_at: null },
      select: oauthAccessTokenSelect,
    });
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<void> {
    await this.prisma.oauth_refresh_token.create({
      data: {
        token_hash: input.token_hash,
        hash_version: input.hash_version ?? 1,
        chain_id: input.chain_id,
        parent_jti: input.parent_jti ?? null,
        current_access_token_jti: input.current_access_token_jti ?? null,
        client_id: input.client_id,
        user_id: input.user_id,
        scopes: input.scopes,
        audience: input.audience,
        expires_at: input.expires_at,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<OauthRefreshToken | null> {
    return this.prisma.oauth_refresh_token.findUnique({
      where: { token_hash: tokenHash },
      select: oauthRefreshTokenSelect,
    });
  }

  async markRefreshTokenRevoked(tokenHash: string, reason: string): Promise<void> {
    await this.prisma.oauth_refresh_token.update({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date(), revocation_reason: reason },
    });
  }

  async revokeRefreshChain(chainId: string, reason: string): Promise<RevokeRefreshChainResult> {
    const now = new Date();

    const tokens = await this.prisma.oauth_refresh_token.findMany({
      where: { chain_id: chainId, revoked_at: null },
      select: { token_hash: true, current_access_token_jti: true },
    });

    if (tokens.length === 0) {
      return { revokedTokenHashes: [], affectedAccessTokenJtis: [] };
    }

    const tokenHashes = tokens.map((t) => t.token_hash);
    const accessTokenJtis = tokens
      .map((t) => t.current_access_token_jti)
      .filter((jti): jti is string => jti !== null);

    await this.prisma.oauth_refresh_token.updateMany({
      where: { token_hash: { in: tokenHashes } },
      data: { revoked_at: now, revocation_reason: reason },
    });

    return {
      revokedTokenHashes: tokenHashes,
      affectedAccessTokenJtis: accessTokenJtis,
    };
  }

  async rotateRefreshToken(input: {
    oldHash: string;
    newToken: CreateRefreshTokenInput;
    newAccessTokenJti: string;
  }): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.oauth_refresh_token.update({
        where: { token_hash: input.oldHash },
        data: { revoked_at: now, revocation_reason: 'rotated' },
      });

      await tx.oauth_refresh_token.create({
        data: {
          token_hash: input.newToken.token_hash,
          hash_version: input.newToken.hash_version ?? 1,
          chain_id: input.newToken.chain_id,
          parent_jti: input.newToken.parent_jti ?? null,
          current_access_token_jti: input.newAccessTokenJti,
          client_id: input.newToken.client_id,
          user_id: input.newToken.user_id,
          scopes: input.newToken.scopes,
          audience: input.newToken.audience,
          expires_at: input.newToken.expires_at,
        },
      });
    });
  }

  async createConsentRequest(input: CreateConsentRequestInput): Promise<void> {
    await this.prisma.oauth_consent_request.create({
      data: {
        rid: input.rid,
        client_id: input.client_id,
        user_id: input.user_id,
        redirect_uri: input.redirect_uri,
        scopes: input.scopes,
        state: input.state ?? null,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
        resource: input.resource ?? null,
        expires_at: input.expires_at,
      },
    });
  }

  async findConsentRequestByRid(rid: string): Promise<OauthConsentRequest | null> {
    return this.prisma.oauth_consent_request.findUnique({
      where: { rid },
      select: oauthConsentRequestSelect,
    });
  }

  async consumeConsentRequest(rid: string): Promise<boolean> {
    const result = await this.prisma.oauth_consent_request.updateMany({
      where: { rid, consumed_at: null },
      data: { consumed_at: new Date() },
    });
    return result.count === 1;
  }

  async deleteExpiredAuthorizationCodes(olderThan: Date): Promise<number> {
    const result = await this.prisma.oauth_authorization_code.deleteMany({
      where: { expires_at: { lt: olderThan } },
    });
    return result.count;
  }

  async deleteExpiredAccessTokens(olderThan: Date): Promise<number> {
    const result = await this.prisma.oauth_access_token.deleteMany({
      where: { expires_at: { lt: olderThan } },
    });
    return result.count;
  }

  async deleteExpiredRefreshTokens(olderThan: Date): Promise<number> {
    const result = await this.prisma.oauth_refresh_token.deleteMany({
      where: { expires_at: { lt: olderThan } },
    });
    return result.count;
  }

  async deleteExpiredConsentRequests(olderThan: Date): Promise<number> {
    const result = await this.prisma.oauth_consent_request.deleteMany({
      where: { expires_at: { lt: olderThan } },
    });
    return result.count;
  }
}
