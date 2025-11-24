import { Router, Request, Response } from 'express';
import { SocialFeedItemSchema, SocialFeedQuerySchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const blueskyIntegrationService = ServiceFactory.getBlueskyIntegrationService();

const BlueskyPostCreateSchema = SocialFeedItemSchema.pick({ content: true });
const BlueskyListQuerySchema = SocialFeedQuerySchema.pick({ limit: true });

router.get(
  '/:accountId/bluesky/recent',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = BlueskyListQuerySchema.parse(req.query);
    const feed = await blueskyIntegrationService.listRecentPosts(accountId, query.limit);
    res.json({ feed });
  }),
);

router.post(
  '/:accountId/bluesky/posts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = BlueskyPostCreateSchema.parse(req.body);
    const post = await blueskyIntegrationService.postUpdate(accountId, payload.content);
    res.status(201).json(post);
  }),
);

export default router;
