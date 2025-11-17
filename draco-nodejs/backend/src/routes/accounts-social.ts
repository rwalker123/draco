import { Router, Request, Response } from 'express';
import {
  CommunityMessageQuerySchema,
  CommunityChannelQuerySchema,
  LiveEventCreateSchema,
  LiveEventQuerySchema,
  LiveEventUpdateSchema,
  SocialFeedQuerySchema,
  SocialVideoQuerySchema,
} from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractSeasonParams, extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const socialHubService = ServiceFactory.getSocialHubService();

router.get(
  '/:accountId/seasons/:seasonId/social/feed',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const query = SocialFeedQuerySchema.parse(req.query);
    const feed = await socialHubService.listFeedItems(accountId, seasonId, query);
    res.json({ feed });
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/social/videos',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractSeasonParams(req.params);
    const query = SocialVideoQuerySchema.parse(req.query);
    const videos = await socialHubService.listVideos(accountId, query);
    res.json({ videos });
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/social/community-messages',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const query = CommunityMessageQuerySchema.parse(req.query);
    const messages = await socialHubService.listCommunityMessages(accountId, seasonId, query);
    res.json({ messages });
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/social/community-channels',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const query = CommunityChannelQuerySchema.parse(req.query);
    const channels = await socialHubService.listCommunityChannels(accountId, seasonId, query);
    res.json({ channels });
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/social/live-events',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const query = LiveEventQuerySchema.parse(req.query);
    const events = await socialHubService.listLiveEvents(accountId, seasonId, query);
    res.json({ events });
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/social/live-events/:liveEventId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const { liveEventId } = extractBigIntParams(req.params, 'liveEventId');
    const event = await socialHubService.getLiveEvent(accountId, seasonId, liveEventId);
    res.json(event);
  }),
);

router.post(
  '/:accountId/seasons/:seasonId/social/live-events',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const payload = LiveEventCreateSchema.parse(req.body);
    const event = await socialHubService.createLiveEvent(accountId, seasonId, payload);
    res.status(201).json(event);
  }),
);

router.patch(
  '/:accountId/seasons/:seasonId/social/live-events/:liveEventId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const { liveEventId } = extractBigIntParams(req.params, 'liveEventId');
    const payload = LiveEventUpdateSchema.parse(req.body);
    const event = await socialHubService.updateLiveEvent(accountId, seasonId, liveEventId, payload);
    res.json(event);
  }),
);

router.delete(
  '/:accountId/seasons/:seasonId/social/live-events/:liveEventId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const { liveEventId } = extractBigIntParams(req.params, 'liveEventId');
    await socialHubService.deleteLiveEvent(accountId, seasonId, liveEventId);
    res.status(204).send();
  }),
);

export default router;
