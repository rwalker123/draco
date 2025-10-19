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
import { photoSubmissionMetrics } from '../metrics/photoSubmissionMetrics.js';
import { PhotoSubmissionNotificationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const photoSubmissionService = ServiceFactory.getPhotoSubmissionService();
const assetService = ServiceFactory.getPhotoSubmissionAssetService();
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
  '/:accountId/photo-submissions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  handlePhotoUploadMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let accountId: bigint | null = null;
    let submissionId: string | null = null;

    try {
      ({ accountId } = extractAccountParams(req.params));
      const submitterContactId = ensureSubmitterContact(req);
      const file = req.file;

      if (!file) {
        throw new ValidationError('Photo file is required');
      }

      const { title, caption, albumId } = createPhotoSubmissionBodySchema.parse(req.body);

      const submission = await photoSubmissionService.createSubmission({
        accountId: accountId.toString(),
        submitterContactId: submitterContactId.toString(),
        title,
        caption: caption ?? null,
        albumId: albumId ?? null,
        teamId: null,
        originalFileName: file.originalname,
      });

      submissionId = submission.id.toString();

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
        const emailSent = await notificationService.sendSubmissionReceivedNotification(detail);
        if (!emailSent) {
          res.setHeader('X-Photo-Email-Warning', 'submission-received');
        }
      } catch (error) {
        console.error('Failed to send submission received notification', error);
        res.setHeader('X-Photo-Email-Warning', 'submission-received');
      }

      res.status(201).json(submission);
    } catch (error) {
      photoSubmissionMetrics.recordSubmissionFailure({
        stage: 'account-create',
        accountId: accountId?.toString(),
        teamId: null,
        submissionId,
        error,
      });
      throw error;
    }
  }),
);

router.get(
  '/:accountId/photo-submissions/pending',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const submissions = await moderationService.listAccountPending(accountId);
    res.json({ submissions });
  }),
);

router.post(
  '/:accountId/photo-submissions/:submissionId/approve',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { submissionId } = extractBigIntParams(req.params, 'submissionId');
    const moderatorContactId = ensureModeratorContact(req);
    try {
      const result = await moderationService.approveSubmission(
        accountId,
        submissionId,
        moderatorContactId,
      );

      res.json(result);
    } catch (error) {
      if (error instanceof PhotoSubmissionNotificationError && error.detail) {
        res.setHeader('X-Photo-Email-Warning', error.event);
        res.status(200).json(error.detail);
        return;
      }
      throw error;
    }
  }),
);

router.post(
  '/:accountId/photo-submissions/:submissionId/deny',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
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

    try {
      const result = await moderationService.denySubmission(
        accountId,
        submissionId,
        moderatorContactId,
        denialReason,
      );

      res.json(result);
    } catch (error) {
      if (error instanceof PhotoSubmissionNotificationError && error.detail) {
        res.setHeader('X-Photo-Email-Warning', error.event);
        res.status(200).json(error.detail);
        return;
      }
      throw error;
    }
  }),
);

export default router;
