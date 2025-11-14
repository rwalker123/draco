import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import type { AccountContext } from '../types/requestContext.js';

/**
 * Domain routing middleware
 * Looks up the host in the accountsurl table and redirects to the appropriate account
 */
export const domainRouting = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const host = req.get('host');

    if (!host) {
      next();
      return;
    }

    // Look up the host in the accountsurl table with more precise matching
    const accountUrl = await prisma.accountsurl.findFirst({
      where: {
        OR: [
          { url: host.toLowerCase() },
          { url: `www.${host.toLowerCase()}` },
          { url: host.toLowerCase().replace('www.', '') },
        ],
      },
      include: {
        accounts: {
          include: {
            accounttypes: true,
          },
        },
      },
    });

    if (!accountUrl) {
      // No matching domain found, continue with normal routing
      next();
      return;
    }

    const account = accountUrl.accounts as AccountContext;
    const accountId = account.id.toString();

    // Check if this is a request for common pages that should not be redirected
    const commonPaths = [
      '/api/auth',
      '/api/accounts/search',
      '/api/accounts/public',
      '/api/accounts/by-domain',
      '/health',
      '/favicon.ico',
      '/static',
      '/assets',
    ];

    const isCommonPath = commonPaths.some((path) => req.path.startsWith(path));

    if (isCommonPath) {
      next();
      return;
    }

    // For API requests, add account context to the request
    if (req.path.startsWith('/api/')) {
      req.accountId = accountId;
      req.account = account;
      next();
      return;
    }

    // For frontend requests, redirect to the account home page
    // This will be handled by the frontend routing
    res.redirect(`/account/${accountId}/home`);
  } catch (error) {
    console.error('Error in domain routing:', error);
    next();
  }
};
