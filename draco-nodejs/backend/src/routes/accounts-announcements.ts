import { Router, Request, Response } from 'express';
import { UpsertAnnouncementSchema } from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { parseAnnouncementSummaryOptions } from './utils/announcementSummaryOptions.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const announcementService = ServiceFactory.getAnnouncementService();
router.get(
  '/:accountId/announcements/titles',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const summaryOptions = parseAnnouncementSummaryOptions(req.query);
    const announcements = await announcementService.listAccountAnnouncementSummaries(
      accountId,
      summaryOptions,
    );

    res.json({ announcements });
  }),
);

router.get(
  '/:accountId/announcements',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const announcements = await announcementService.listAccountAnnouncements(accountId);

    res.json({ announcements });
  }),
);

router.get(
  '/:accountId/announcements/:announcementId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { announcementId } = extractBigIntParams(req.params, 'announcementId');

    const announcement = await announcementService.getAccountAnnouncement(
      accountId,
      announcementId,
    );
    res.json(announcement);
  }),
);

router.post(
  '/:accountId/announcements',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = UpsertAnnouncementSchema.parse(req.body);

    const announcement = await announcementService.createAccountAnnouncement(accountId, payload);
    res.status(201).json(announcement);
  }),
);

router.put(
  '/:accountId/announcements/:announcementId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { announcementId } = extractBigIntParams(req.params, 'announcementId');
    const payload = UpsertAnnouncementSchema.parse(req.body);

    const announcement = await announcementService.updateAccountAnnouncement(
      accountId,
      announcementId,
      payload,
    );

    res.json(announcement);
  }),
);

router.delete(
  '/:accountId/announcements/:announcementId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { announcementId } = extractBigIntParams(req.params, 'announcementId');

    await announcementService.deleteAccountAnnouncement(accountId, announcementId);
    res.status(204).send();
  }),
);

export default router;
