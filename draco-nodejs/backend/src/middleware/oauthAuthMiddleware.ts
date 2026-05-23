import type { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { OauthAuthenticationError } from '../services/oauthErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';

const RESOURCE_METADATA_URL =
  process.env.OAUTH_RESOURCE_METADATA_URL ??
  'http://localhost:3001/.well-known/oauth-protected-resource';

export async function verifyOauthBearer(rawToken: string, req: Request): Promise<void> {
  const oauthService = ServiceFactory.getOauthService();

  const { userId, scopes, jti, clientId } = await oauthService.verifyAccessToken(rawToken);

  const userRepository = RepositoryFactory.getUserRepository();
  const user = await userRepository.findByUserId(userId);

  req.user = {
    id: userId,
    username: user?.username ?? '',
  };
  req.isOauth = true;
  req.oauthScopes = scopes;
  req.oauthJti = jti;
  req.oauthClientId = clientId;
}

export function buildWwwAuthenticate(errorCode?: string, errorDescription?: string): string {
  let header = `Bearer realm="draco"`;
  if (errorCode) {
    header += `, error="${errorCode}"`;
  }
  if (errorDescription) {
    header += `, error_description="${errorDescription.replace(/"/g, '\\"')}"`;
  }
  header += `, resource_metadata="${RESOURCE_METADATA_URL}"`;
  return header;
}

export async function oauthAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).set('WWW-Authenticate', buildWwwAuthenticate()).json({
      error: 'invalid_token',
      error_description: 'Bearer token required',
    });
    return;
  }

  const rawToken = authHeader.slice('Bearer '.length).trim();
  if (!rawToken) {
    res.status(401).set('WWW-Authenticate', buildWwwAuthenticate()).json({
      error: 'invalid_token',
      error_description: 'Bearer token required',
    });
    return;
  }

  try {
    await verifyOauthBearer(rawToken, req);
    next();
  } catch (err) {
    if (err instanceof OauthAuthenticationError) {
      res
        .status(401)
        .set('WWW-Authenticate', buildWwwAuthenticate('invalid_token', err.message))
        .json({
          error: 'invalid_token',
          error_description: err.message,
        });
      return;
    }
    next(err);
  }
}
