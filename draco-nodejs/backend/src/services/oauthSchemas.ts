import { z } from 'zod';

export const DCRRequestSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  client_name: z.string().optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  scope: z.string().optional(),
  token_endpoint_auth_method: z.string().optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
});

export type DCRRequest = z.infer<typeof DCRRequestSchema>;

export type DCRResponse = {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at: number;
  registration_access_token: string;
  registration_client_uri: string;
  redirect_uris: string[];
  client_name?: string;
  scope: string;
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export type IntrospectionResponse =
  | {
      active: true;
      scope: string;
      client_id: string;
      username?: string;
      sub: string;
      aud: string;
      iss: string;
      exp: number;
      iat: number;
      jti: string;
    }
  | { active: false };

export type OauthAccessTokenPayload = {
  sub: string;
  aud: string;
  iss: string;
  scope: string;
  client_id: string;
  jti: string;
  iat: number;
  exp: number;
};

export type CreateAuthorizationCodeInput = {
  userId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  resource?: string;
};

export type ExchangeCodeInput = {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  clientSecret?: string;
};

export type RefreshInput = {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
};

export type RevokeInput = {
  token: string;
  tokenTypeHint?: string;
  clientId: string;
  clientSecret?: string;
};

export type IntrospectInput = {
  token: string;
  clientId: string;
  clientSecret?: string;
};
