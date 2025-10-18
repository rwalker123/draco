import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handlePhotoUploadMiddleware } from '../middleware/fileUpload.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import {
  CreatePhotoSubmissionFormSchema,
  DenyPhotoSubmissionRequestSchema,
} from '@draco/shared-schemas';
import { ZodError } from 'zod';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const photoSubmissionService = ServiceFactory.getPhotoSubmissionService();
const assetService = ServiceFactory.getPhotoSubmissionAssetService();
const teamService = ServiceFactory.getTeamService();
const moderationService = ServiceFactory.getPhotoSubmissionModerationService();
const notificationService = ServiceFactory.getPhotoSubmissionNotificationService();

const createPhotoSubmissionBodySchema = CreatePhotoSubmissionFormSchema.pick({
  title: true,
  caption: true,
  albumId: true,
});

const ensureSubmitterContact = (req: Request): bigint => {
  const contactId = req.accountBoundary?.contactId;

  if (!contactId || contactId <= 0n) {
    throw new ValidationError('Authenticated contact is required to submit photos');
  }

  return contactId;
};

const ensureModeratorContact = (req: Request): bigint => {
  const contactId = req.accountBoundary?.contactId;

  if (!contactId || contactId <= 0n) {
    throw new ValidationError('Authenticated moderator contact is required for this action');
  }

  return contactId;
};

router.post(
  '/:teamId/photo-submissions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  handlePhotoUploadMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const submitterContactId = ensureSubmitterContact(req);
    const file = req.file;

    if (!file) {
      throw new ValidationError('Photo file is required');
    }

    await teamService.ensureContactIsOnTeam(accountId, teamId, submitterContactId);

    const { title, caption, albumId } = createPhotoSubmissionBodySchema.parse(req.body);

    const submission = await photoSubmissionService.createSubmission({
      accountId: accountId.toString(),
      submitterContactId: submitterContactId.toString(),
      title,
      caption: caption ?? null,
      albumId: albumId ?? null,
      teamId: teamId.toString(),
      originalFileName: file.originalname,
    });

    try {
      await assetService.stageSubmissionAssets(submission, file.buffer);
    } catch (error) {
      await photoSubmissionService.deleteSubmission(accountId, BigInt(submission.id));
      throw error;
    }

    try {
      const detail = await photoSubmissionService.getSubmissionDetail(
        accountId,
        BigInt(submission.id),
      );
      await notificationService.sendSubmissionReceivedNotification(detail);
    } catch (error) {
      console.error('Failed to send submission received notification', error);
    }

    res.status(201).json(submission);
  }),
);

router.get(
  '/:teamId/photo-submissions/pending',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    const submissions = await moderationService.listTeamPending(accountId, teamId);
    res.json({ submissions });
  }),
);

router.post(
  '/:teamId/photo-submissions/:submissionId/approve',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { submissionId } = extractBigIntParams(req.params, 'submissionId');
    const moderatorContactId = ensureModeratorContact(req);

    const result = await moderationService.approveSubmission(
      accountId,
      submissionId,
      moderatorContactId,
    );

    res.json(result);
  }),
);

router.post(
  '/:teamId/photo-submissions/:submissionId/deny',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { submissionId } = extractBigIntParams(req.params, 'submissionId');
    const moderatorContactId = ensureModeratorContact(req);
    let denialReason: string;
    try {
      ({ denialReason } = DenyPhotoSubmissionRequestSchema.parse(req.body));
    } catch (error) {
      if (error instanceof ZodError) {
        const normalizeMessage = error.issues.some((issue) => {
          const pathEnd = issue.path.length > 0 ? issue.path[issue.path.length - 1] : undefined;
          return (
            issue.code === 'invalid_type' ||
            (pathEnd === 'denialReason' && issue.code === 'too_small')
          );
        });

        if (normalizeMessage) {
          throw new ValidationError('Denial reason is required');
        }
      }
      throw error;
    }

    const result = await moderationService.denySubmission(
      accountId,
      submissionId,
      moderatorContactId,
      denialReason,
    );

    res.json(result);
  }),
);

export default router;
