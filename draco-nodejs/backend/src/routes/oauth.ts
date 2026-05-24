import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ipKeyGenerator } from 'express-rate-limit';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { createRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { OauthError } from '../services/oauthErrors.js';

const router = Router();

const authorizeBodySchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal('S256'),
  resource: z.string().url().optional(),
});

const decisionBodySchema = z.object({
  rid: z.string().uuid(),
  decision: z.enum(['approve', 'deny']),
});

const dcrRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts, please try again later.',
});

const dcrDayRateLimit = createRateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  message: 'Daily registration limit exceeded.',
});

const authorizeValidateRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authorization requests.',
  keyGenerator: (req) =>
    req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? '')}`,
});

const authorizeDecisionRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authorization decisions.',
  keyGenerator: (req) =>
    req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? '')}`,
});

const tokenRateLimitByIp = createRateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many token requests.',
});

const tokenRateLimitByClient = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many token requests from this client.',
  keyGenerator: (req) => {
    const bodyClientId =
      typeof req.body === 'object' && req.body !== null ? req.body.client_id : undefined;
    if (typeof bodyClientId === 'string' && bodyClientId) {
      return `client:${bodyClientId}`;
    }
    return `ip:${ipKeyGenerator(req.ip ?? '')}`;
  },
});

const revokeRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many revocation requests.',
  keyGenerator: (req) => {
    const bodyClientId =
      typeof req.body === 'object' && req.body !== null ? req.body.client_id : undefined;
    if (typeof bodyClientId === 'string' && bodyClientId) {
      return `client:${bodyClientId}`;
    }
    return `ip:${ipKeyGenerator(req.ip ?? '')}`;
  },
});

const introspectRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 600,
  message: 'Too many introspection requests.',
  keyGenerator: (req) => {
    const bodyClientId =
      typeof req.body === 'object' && req.body !== null ? req.body.client_id : undefined;
    if (typeof bodyClientId === 'string' && bodyClientId) {
      return `client:${bodyClientId}`;
    }
    return `ip:${ipKeyGenerator(req.ip ?? '')}`;
  },
});

function sendOauthError(res: Response, err: OauthError): Response {
  const body: Record<string, string> = { error: err.error };
  if (err.errorDescription) {
    body.error_description = err.errorDescription;
  }
  if (err.includeBasicChallenge) {
    res.setHeader('WWW-Authenticate', 'Basic realm="oauth"');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  return res.status(err.httpStatus).json(body);
}

function parseBasicAuth(
  authHeader: string | undefined,
): { clientId: string; clientSecret: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }
  const encoded = authHeader.slice('Basic '.length);
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const colonIndex = decoded.indexOf(':');
  if (colonIndex < 0) {
    return null;
  }
  return {
    clientId: decoded.slice(0, colonIndex),
    clientSecret: decoded.slice(colonIndex + 1),
  };
}

function extractClientCredentials(req: Request): { clientId: string; clientSecret?: string } {
  const basic = parseBasicAuth(req.headers['authorization']);
  if (basic) {
    return { clientId: basic.clientId, clientSecret: basic.clientSecret || undefined };
  }
  const body = req.body as Record<string, unknown>;
  const clientId = typeof body.client_id === 'string' ? body.client_id : '';
  const clientSecret = typeof body.client_secret === 'string' ? body.client_secret : undefined;
  return { clientId, clientSecret };
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'mcp:read': 'Read your account data, teams, schedule, and stats.',
};

function humanizeScopes(scopes: string[]): string[] {
  return scopes.map((s) => SCOPE_DESCRIPTIONS[s] ?? s);
}

router.get(
  '/.well-known/oauth-authorization-server',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const issuer = process.env.OAUTH_ISSUER ?? '';
    const frontendBaseUrl = (process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');
    const serviceDocumentation = process.env.OAUTH_SERVICE_DOCUMENTATION;

    const metadata: Record<string, unknown> = {
      issuer,
      authorization_endpoint: `${frontendBaseUrl}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      introspection_endpoint: `${issuer}/oauth/introspect`,
      scopes_supported: ['mcp:read'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
      code_challenge_methods_supported: ['S256'],
      revocation_endpoint_auth_methods_supported: [
        'none',
        'client_secret_basic',
        'client_secret_post',
      ],
      introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    };

    if (serviceDocumentation) {
      metadata.service_documentation = serviceDocumentation;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(metadata);
  }),
);

router.get(
  '/.well-known/oauth-protected-resource',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const issuer = process.env.OAUTH_ISSUER ?? '';
    const resource = process.env.MCP_RESOURCE_URL ?? '';
    const resourceDocumentation = process.env.OAUTH_RESOURCE_DOCUMENTATION;

    const metadata: Record<string, unknown> = {
      resource,
      authorization_servers: [issuer],
      scopes_supported: ['mcp:read'],
      bearer_methods_supported: ['header'],
    };

    if (resourceDocumentation) {
      metadata.resource_documentation = resourceDocumentation;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(metadata);
  }),
);

router.post(
  '/oauth/register',
  dcrRateLimit,
  dcrDayRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const oauthService = ServiceFactory.getOauthService();
    try {
      const result = await oauthService.registerClient(req.body);
      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof OauthError) {
        sendOauthError(res, err);
        return;
      }
      throw err;
    }
  }),
);

router.post(
  '/oauth/authorize/validate',
  authenticateToken,
  authorizeValidateRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = authorizeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: parsed.error.message,
      });
      return;
    }

    const {
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method,
      resource,
    } = parsed.data;

    const oauthService = ServiceFactory.getOauthService();
    const client = await oauthService.getPublicClient(client_id);

    if (!client || client.disabled) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'Unknown or disabled client.',
      });
      return;
    }

    const redirectUriMatch = client.redirect_uris.some((uri) => uri === redirect_uri);
    if (!redirectUriMatch) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'redirect_uri does not match any registered URI.',
      });
      return;
    }

    const scopes = scope.split(' ').filter(Boolean);
    const allowedScopes = new Set(['mcp:read']);
    const invalidScope = scopes.some((s) => !allowedScopes.has(s));
    if (invalidScope) {
      const redirectUrl = buildRedirectUrl(redirect_uri, {
        error: 'invalid_scope',
        ...(state ? { state } : {}),
      });
      res.status(200).json({ redirect_to: redirectUrl });
      return;
    }

    if (resource !== undefined && resource !== process.env.MCP_RESOURCE_URL) {
      res.status(400).json({ error: 'invalid_target' });
      return;
    }

    const rid = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await oauthService.createConsentRequest({
      rid,
      userId: req.user!.id,
      clientId: client_id,
      redirectUri: redirect_uri,
      scopes,
      state: state ?? null,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      resource: resource ?? null,
      expiresAt,
    });

    res.status(200).json({
      rid,
      client_name: client.name,
      scopes_human: humanizeScopes(scopes),
    });
  }),
);

router.post(
  '/oauth/authorize/decision',
  authenticateToken,
  authorizeDecisionRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = decisionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: parsed.error.message,
      });
      return;
    }

    const { rid, decision } = parsed.data;
    const oauthService = ServiceFactory.getOauthService();
    const consent = await oauthService.consumeConsentRequest(rid);

    if (!consent) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'Consent request expired or already used.',
      });
      return;
    }

    if (consent.user_id !== req.user!.id) {
      res.status(403).json({ error: 'access_denied' });
      return;
    }

    if (decision === 'deny') {
      const redirectUrl = buildRedirectUrl(consent.redirect_uri, {
        error: 'access_denied',
        ...(consent.state ? { state: consent.state } : {}),
      });
      res.status(200).json({ redirect_to: redirectUrl });
      return;
    }

    const { code } = await oauthService.createAuthorizationCode({
      userId: req.user!.id,
      clientId: consent.client_id,
      redirectUri: consent.redirect_uri,
      scopes: consent.scopes,
      codeChallenge: consent.code_challenge,
      codeChallengeMethod: 'S256',
      resource: consent.resource ?? undefined,
    });

    const redirectUrl = buildRedirectUrl(consent.redirect_uri, {
      code,
      ...(consent.state ? { state: consent.state } : {}),
    });

    res.status(200).json({ redirect_to: redirectUrl });
  }),
);

router.post(
  '/oauth/token',
  tokenRateLimitByIp,
  tokenRateLimitByClient,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const body = req.body as Record<string, unknown>;
    const { clientId, clientSecret } = extractClientCredentials(req);
    const grantType = typeof body.grant_type === 'string' ? body.grant_type : '';

    const oauthService = ServiceFactory.getOauthService();

    try {
      if (grantType === 'authorization_code') {
        const code = typeof body.code === 'string' ? body.code : '';
        const codeVerifier = typeof body.code_verifier === 'string' ? body.code_verifier : '';
        const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : '';
        const effectiveClientId =
          clientId || (typeof body.client_id === 'string' ? body.client_id : '');

        const result = await oauthService.exchangeCode({
          code,
          codeVerifier,
          clientId: effectiveClientId,
          redirectUri,
          clientSecret,
        });
        res.json(result);
        return;
      }

      if (grantType === 'refresh_token') {
        const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
        const scope = typeof body.scope === 'string' ? body.scope : undefined;
        const effectiveClientId =
          clientId || (typeof body.client_id === 'string' ? body.client_id : '');

        const result = await oauthService.refresh({
          refreshToken,
          clientId: effectiveClientId,
          clientSecret,
          scope,
        });
        res.json(result);
        return;
      }

      res.status(400).json({ error: 'unsupported_grant_type' });
    } catch (err) {
      if (err instanceof OauthError) {
        sendOauthError(res, err);
        return;
      }
      throw err;
    }
  }),
);

router.post(
  '/oauth/revoke',
  revokeRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const body = req.body as Record<string, unknown>;
    const { clientId, clientSecret } = extractClientCredentials(req);
    const token = typeof body.token === 'string' ? body.token : '';
    const tokenTypeHint =
      typeof body.token_type_hint === 'string' ? body.token_type_hint : undefined;

    const oauthService = ServiceFactory.getOauthService();

    try {
      await oauthService.revoke({ token, tokenTypeHint, clientId, clientSecret });
      res.status(200).send();
    } catch (err) {
      if (err instanceof OauthError) {
        sendOauthError(res, err);
        return;
      }
      throw err;
    }
  }),
);

router.post(
  '/oauth/introspect',
  introspectRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const body = req.body as Record<string, unknown>;
    const { clientId, clientSecret } = extractClientCredentials(req);
    const token = typeof body.token === 'string' ? body.token : '';

    const oauthService = ServiceFactory.getOauthService();

    try {
      const result = await oauthService.introspect({ token, clientId, clientSecret });
      res.json(result);
    } catch (err) {
      if (err instanceof OauthError) {
        sendOauthError(res, err);
        return;
      }
      throw err;
    }
  }),
);

function buildRedirectUrl(baseUri: string, params: Record<string, string>): string {
  const hasQuery = baseUri.includes('?');
  const separator = hasQuery ? '&' : '?';
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${baseUri}${separator}${queryString}`;
}

export default router;
