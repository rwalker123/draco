import { Router, Request, Response } from 'express';
import { UpsertAnnouncementSchema } from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const announcementService = ServiceFactory.getAnnouncementService();
const MAX_SUMMARY_LIMIT = 25;
const DEFAULT_SUMMARY_LIMIT = 10;

const parseSummaryOptions = (query: Request['query']) => {
  const limitValue = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const includeSpecialOnlyValue = Array.isArray(query.includeSpecialOnly)
    ? query.includeSpecialOnly[0]
    : query.includeSpecialOnly;

  let limit: number | undefined;
  if (typeof limitValue === 'string' && limitValue.trim().length > 0) {
    const parsed = Number.parseInt(limitValue, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_SUMMARY_LIMIT);
    }
  }

  const includeSpecialOnly = includeSpecialOnlyValue === 'true';

  return { limit: limit ?? DEFAULT_SUMMARY_LIMIT, includeSpecialOnly };
};

router.get(
  '/:teamId/announcements/titles',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    const summaryOptions = parseSummaryOptions(req.query);
    const announcements = await announcementService.listTeamAnnouncementSummaries(
      accountId,
      teamId,
      summaryOptions,
    );
    res.json({ announcements });
  }),
);

router.get(
  '/:teamId/announcements',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    const announcements = await announcementService.listTeamAnnouncements(accountId, teamId);
    res.json({ announcements });
  }),
);

router.get(
  '/:teamId/announcements/:announcementId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, announcementId } = extractBigIntParams(req.params, 'teamId', 'announcementId');

    const announcement = await announcementService.getTeamAnnouncement(
      accountId,
      teamId,
      announcementId,
    );

    res.json(announcement);
  }),
);

router.post(
  '/:teamId/announcements',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const payload = UpsertAnnouncementSchema.parse(req.body);

    const announcement = await announcementService.createTeamAnnouncement(
      accountId,
      teamId,
      payload,
    );

    res.status(201).json(announcement);
  }),
);

router.put(
  '/:teamId/announcements/:announcementId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, announcementId } = extractBigIntParams(req.params, 'teamId', 'announcementId');
    const payload = UpsertAnnouncementSchema.parse(req.body);

    const announcement = await announcementService.updateTeamAnnouncement(
      accountId,
      teamId,
      announcementId,
      payload,
    );

    res.json(announcement);
  }),
);

router.delete(
  '/:teamId/announcements/:announcementId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, announcementId } = extractBigIntParams(req.params, 'teamId', 'announcementId');

    await announcementService.deleteTeamAnnouncement(accountId, teamId, announcementId);
    res.status(204).send();
  }),
);

export default router;
