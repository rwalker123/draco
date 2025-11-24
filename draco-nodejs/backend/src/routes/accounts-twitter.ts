import { Router, Request, Response } from 'express';
import {
  AccountTwitterOAuthStartSchema,
  SocialFeedItemSchema,
  SocialFeedQuerySchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const twitterIntegrationService = ServiceFactory.getTwitterIntegrationService();

const TweetCreateSchema = SocialFeedItemSchema.pick({ content: true });
const TweetListQuerySchema = SocialFeedQuerySchema.pick({ limit: true });
const TwitterOAuthStartSchema = AccountTwitterOAuthStartSchema.partial();

router.post(
  '/:accountId/twitter/oauth/url',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = TwitterOAuthStartSchema.parse(req.body ?? {});
    const authorizationUrl = await twitterIntegrationService.createAuthorizationUrl(
      accountId,
      body.returnUrl,
    );
    res.json({ authorizationUrl });
  }),
);

router.get(
  '/:accountId/twitter/recent',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = TweetListQuerySchema.parse(req.query);
    const feed = await twitterIntegrationService.listRecentTweets(accountId, query.limit);
    res.json({ feed });
  }),
);

router.post(
  '/:accountId/twitter/tweets',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = TweetCreateSchema.parse(req.body);
    const tweet = await twitterIntegrationService.postTweet(accountId, payload.content);
    res.status(201).json(tweet);
  }),
);

router.get(
  '/twitter/oauth/callback',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const error = req.query.error ? String(req.query.error) : null;
    const errorDescription = req.query.error_description ? String(req.query.error_description) : '';

    if (error || !code || !state) {
      const redirect = twitterIntegrationService.buildRedirectFromState(
        state,
        'error',
        errorDescription || error || 'Unable to complete Twitter authorization.',
      );
      res.redirect(redirect);
      return;
    }

    try {
      const result = await twitterIntegrationService.completeOAuthCallback(code, state);
      res.redirect(result.redirectUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to complete Twitter authorization.';
      const redirect = twitterIntegrationService.buildRedirectFromState(state, 'error', message);
      res.redirect(redirect);
    }
  }),
);

export default router;
