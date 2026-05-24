import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Express, Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { verifyAccessToken, AuthenticationError } from '../auth/verifyAccessToken.js';
import { requestContext } from '../auth/perRequestContext.js';
import type { RequestContext } from '../auth/perRequestContext.js';
import { registerTools } from '../tools/index.js';

function buildRateLimiters() {
  const onLimitReached = (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(429).json({
      error: 'rate_limited',
      error_description: 'Too many requests. Try again later.',
    });
  };

  const perMin = rateLimit({
    windowMs: 60 * 1000,
    max: env.MCP_RATE_LIMIT_PER_MIN,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const perHour = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: env.MCP_RATE_LIMIT_PER_HOUR,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
  });

  return [perMin, perHour];
}

export function mountMcp(app: Express): void {
  const [perMinLimit, perHourLimit] = buildRateLimiters();

  app.all('/mcp', perMinLimit, perHourLimit, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.set(
        'WWW-Authenticate',
        `Bearer realm="draco", resource_metadata="${env.OAUTH_RESOURCE_METADATA_URL}"`,
      );
      res.status(401).json({ error: 'authentication_required' });
      return;
    }

    const token = authHeader.slice(7);
    let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
    try {
      payload = await verifyAccessToken(token);
    } catch (err) {
      if (err instanceof AuthenticationError) {
        res.set(
          'WWW-Authenticate',
          `Bearer realm="draco", error="invalid_token", resource_metadata="${env.OAUTH_RESOURCE_METADATA_URL}"`,
        );
        res.status(401).json({ error: 'invalid_token' });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
      return;
    }

    const ctx: RequestContext = {
      userId: payload.userId,
      accessToken: token,
      scopes: payload.scopes,
      requestId: crypto.randomUUID(),
      cache: new Map(),
    };

    await requestContext.run(ctx, async () => {
      const server = new McpServer({ name: 'ezRecSports', version: '0.1.0' });
      registerTools(server);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
  });
}
