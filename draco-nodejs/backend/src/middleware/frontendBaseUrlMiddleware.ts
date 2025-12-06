import type { NextFunction, Request, Response } from 'express';
import { AccountBaseUrlResolver } from '../services/utils/accountBaseUrlResolver.js';
import { OriginAllowList } from '../utils/originAllowList.js';
import { runWithFrontendBaseUrl } from '../utils/frontendBaseUrlContext.js';

type FrontendBaseUrlMiddlewareDeps = {
  originAllowList?: OriginAllowList;
};

const isProductionEnv = (): boolean => process.env.NODE_ENV === 'production';

const extractBaseUrlHeader = (req: Request): string | null => {
  const headerValue = req.headers['x-frontend-base-url'] ?? req.headers.origin ?? null;
  if (!headerValue) {
    return null;
  }

  return Array.isArray(headerValue) ? (headerValue[0] ?? null) : headerValue;
};

const logRejection = (
  reason: string,
  status: number,
  baseUrl: string | null,
  path: string,
): void => {
  console.warn('[frontendBaseUrlMiddleware] rejecting request', {
    reason,
    status,
    baseUrl,
    path,
  });
};

export const createFrontendBaseUrlMiddleware =
  ({ originAllowList = new OriginAllowList() }: FrontendBaseUrlMiddlewareDeps = {}) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }

    const headerBaseUrl = extractBaseUrlHeader(req);
    const normalized = AccountBaseUrlResolver.normalizeBaseUrl(headerBaseUrl);

    const runWithContext = (baseUrl: string | null) => {
      if (baseUrl) {
        req.frontendBaseUrl = baseUrl;
      }
      runWithFrontendBaseUrl(baseUrl, next);
    };

    if (!normalized) {
      runWithContext(null);
      return;
    }

    try {
      const parsed = new URL(normalized);
      if (isProductionEnv() && parsed.protocol !== 'https:') {
        logRejection('non-https frontend base URL in production', 400, normalized, req.path);
        res.status(400).json({ message: 'Frontend base URL must use https in production' });
        return;
      }
    } catch {
      logRejection('invalid frontend base URL', 400, normalized, req.path);
      res.status(400).json({ message: 'Invalid frontend base URL' });
      return;
    }

    const isAllowed = await originAllowList.isAllowed(normalized);

    if (!isAllowed && isProductionEnv()) {
      logRejection('frontend base URL not allowed', 403, normalized, req.path);
      res.status(403).json({ message: 'Frontend base URL not allowed' });
      return;
    }

    runWithContext(normalized);
  };
