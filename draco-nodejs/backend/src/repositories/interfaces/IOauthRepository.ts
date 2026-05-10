import type { Prisma } from '#prisma/client';

export type OauthClient = Prisma.oauth_clientGetPayload<{
  select: {
    client_id: true;
    name: true;
    client_secret_hash: true;
    hash_version: true;
    redirect_uris: true;
    grant_types: true;
    scopes: true;
    token_endpoint_auth_method: true;
    registration_access_token_hash: true;
    registered_by_user_id: true;
    software_id: true;
    software_version: true;
    disabled_at: true;
    created_at: true;
    updated_at: true;
  };
}>;

export type OauthAuthorizationCode = Prisma.oauth_authorization_codeGetPayload<{
  select: {
    code_hash: true;
    hash_version: true;
    client_id: true;
    user_id: true;
    redirect_uri: true;
    scopes: true;
    code_challenge: true;
    code_challenge_method: true;
    resource: true;
    expires_at: true;
    consumed_at: true;
    created_at: true;
  };
}>;

export type OauthAccessToken = Prisma.oauth_access_tokenGetPayload<{
  select: {
    jti: true;
    client_id: true;
    user_id: true;
    scopes: true;
    audience: true;
    security_stamp: true;
    issued_at: true;
    expires_at: true;
    revoked_at: true;
    revocation_reason: true;
  };
}>;

export type OauthRefreshToken = Prisma.oauth_refresh_tokenGetPayload<{
  select: {
    token_hash: true;
    hash_version: true;
    chain_id: true;
    parent_jti: true;
    current_access_token_jti: true;
    client_id: true;
    user_id: true;
    scopes: true;
    audience: true;
    issued_at: true;
    expires_at: true;
    revoked_at: true;
    revocation_reason: true;
  };
}>;

export type OauthConsentRequest = Prisma.oauth_consent_requestGetPayload<{
  select: {
    rid: true;
    client_id: true;
    user_id: true;
    redirect_uri: true;
    scopes: true;
    state: true;
    code_challenge: true;
    code_challenge_method: true;
    resource: true;
    expires_at: true;
    consumed_at: true;
    created_at: true;
  };
}>;

export type CreateClientInput = {
  client_id: string;
  name: string;
  client_secret_hash?: string | null;
  hash_version?: number;
  redirect_uris: string[];
  grant_types: string[];
  scopes: string[];
  token_endpoint_auth_method: string;
  registration_access_token_hash: string;
  registered_by_user_id?: string | null;
  software_id?: string | null;
  software_version?: string | null;
};

export type CreateAuthCodeInput = {
  code_hash: string;
  hash_version?: number;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scopes: string[];
  code_challenge: string;
  code_challenge_method: string;
  resource?: string | null;
  expires_at: Date;
};

export type CreateAccessTokenInput = {
  jti: string;
  client_id: string;
  user_id: string;
  scopes: string[];
  audience: string;
  security_stamp?: string | null;
  expires_at: Date;
};

export type CreateRefreshTokenInput = {
  token_hash: string;
  hash_version?: number;
  chain_id: string;
  parent_jti?: string | null;
  current_access_token_jti?: string | null;
  client_id: string;
  user_id: string;
  scopes: string[];
  audience: string;
  expires_at: Date;
};

export type CreateConsentRequestInput = {
  rid: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scopes: string[];
  state?: string | null;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string | null;
  expires_at: Date;
};

export type RevokeRefreshChainResult = {
  revokedTokenHashes: string[];
  affectedAccessTokenJtis: string[];
};

export interface IOauthRepository {
  findClientById(clientId: string): Promise<OauthClient | null>;
  createClient(input: CreateClientInput): Promise<OauthClient>;
  disableClient(clientId: string): Promise<void>;

  createAuthorizationCode(input: CreateAuthCodeInput): Promise<void>;
  findAuthorizationCodeByHash(codeHash: string): Promise<OauthAuthorizationCode | null>;
  consumeAuthorizationCode(codeHash: string): Promise<boolean>;

  createAccessToken(input: CreateAccessTokenInput): Promise<void>;
  findAccessTokenByJti(jti: string): Promise<OauthAccessToken | null>;
  revokeAccessToken(jti: string, reason: string): Promise<void>;
  revokeAccessTokensByJtis(jtis: string[], reason: string): Promise<void>;
  findActiveAccessTokensByUser(userId: string): Promise<OauthAccessToken[]>;

  createRefreshToken(input: CreateRefreshTokenInput): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<OauthRefreshToken | null>;
  markRefreshTokenRevoked(tokenHash: string, reason: string): Promise<void>;
  revokeRefreshChain(chainId: string, reason: string): Promise<RevokeRefreshChainResult>;
  rotateRefreshToken(input: {
    oldHash: string;
    newToken: CreateRefreshTokenInput;
    newAccessTokenJti: string;
  }): Promise<void>;

  createConsentRequest(input: CreateConsentRequestInput): Promise<void>;
  findConsentRequestByRid(rid: string): Promise<OauthConsentRequest | null>;
  consumeConsentRequest(rid: string): Promise<boolean>;

  deleteExpiredAuthorizationCodes(olderThan: Date): Promise<number>;
  deleteExpiredAccessTokens(olderThan: Date): Promise<number>;
  deleteExpiredRefreshTokens(olderThan: Date): Promise<number>;
  deleteExpiredConsentRequests(olderThan: Date): Promise<number>;
}
