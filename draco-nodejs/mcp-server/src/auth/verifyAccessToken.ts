/*
 * Local OAuth bearer verifier. Uses shared JWT_SECRET — no DB round-trip.
 * Trade-off: backend revocations (via POST /oauth/revoke) are not visible until
 * the access token expires (1h max). The backend's oauthAuthMiddleware does a
 * DB jti lookup on every request; the MCP server accepts the higher risk for
 * lower latency and no DB dependency. Revisit if strict revocation is required.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

interface AccessTokenPayload {
  sub: string;
  aud: string;
  iss: string;
  scope: string;
  client_id: string;
  jti: string;
  iat: number;
  exp: number;
}

export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  scopes: string[];
  jti: string;
  clientId: string;
  expiresAt: number;
}> {
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: env.MCP_AUDIENCE,
      issuer: env.OAUTH_ISSUER,
    }) as AccessTokenPayload;
  } catch (err) {
    throw new AuthenticationError(err instanceof Error ? err.message : 'Token verification failed');
  }

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new AuthenticationError('Token missing subject');
  }

  if (typeof payload.scope !== 'string') {
    throw new AuthenticationError('Token missing scope');
  }

  return {
    userId: payload.sub,
    scopes: payload.scope.split(' ').filter(Boolean),
    jti: payload.jti,
    clientId: payload.client_id,
    expiresAt: payload.exp * 1000,
  };
}
