import { Router, Request, Response } from 'express';
import { SocialFeedItemSchema, SocialFeedQuerySchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const twitterIntegrationService = ServiceFactory.getTwitterIntegrationService();

const TweetCreateSchema = SocialFeedItemSchema.pick({ content: true });
const TweetListQuerySchema = SocialFeedQuerySchema.pick({ limit: true });

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

export default router;
