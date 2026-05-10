import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyOauthBearer } from './oauthAuthMiddleware.js';
import { OauthAuthenticationError } from '../services/oauthErrors.js';
import { authenticateToken } from './authMiddleware.js';

export async function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const rawToken = authHeader.slice('Bearer '.length).trim();
  if (!rawToken) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  let aud: unknown;
  try {
    const decoded = jwt.decode(rawToken);
    if (decoded && typeof decoded === 'object') {
      aud = decoded.aud;
    }
  } catch {
    // Fall through to standard path
  }

  if (aud === 'mcp') {
    try {
      await verifyOauthBearer(rawToken, req);
      next();
    } catch (err) {
      if (err instanceof OauthAuthenticationError) {
        res.status(401).json({ success: false, message: err.message });
        return;
      }
      next(err);
    }
    return;
  }

  await authenticateToken(req, res, next);
}

export function requireGet(req: Request, res: Response, next: NextFunction): void {
  if (req.isOauth === true && req.method !== 'GET') {
    res.status(403).json({
      error: 'insufficient_scope',
      error_description: 'OAuth tokens are read-only',
    });
    return;
  }
  next();
}
