import { ServiceFactory } from './serviceFactory.js';
import { PhotoSubmissionService } from './photoSubmissionService.js';
import { PhotoGalleryApprovalService } from './photoGalleryApprovalService.js';
import { PhotoSubmissionAssetService } from './photoSubmissionAssetService.js';
import { PhotoSubmissionNotificationService } from './photoSubmissionNotificationService.js';
import { InstagramIntegrationService } from './instagramIntegrationService.js';
import type { PhotoSubmissionDetailType, PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { ValidationError, PhotoSubmissionNotificationError } from '../utils/customErrors.js';
import { photoSubmissionMetrics } from '../metrics/photoSubmissionMetrics.js';
import { ALBUM_PHOTO_LIMIT } from './photoGalleryLimits.js';

export class PhotoSubmissionModerationService {
  constructor(
    private readonly submissionService: PhotoSubmissionService = ServiceFactory.getPhotoSubmissionService(),
    private readonly galleryService: PhotoGalleryApprovalService = ServiceFactory.getPhotoGalleryApprovalService(),
    private readonly assetService: PhotoSubmissionAssetService = ServiceFactory.getPhotoSubmissionAssetService(),
    private readonly notificationService: PhotoSubmissionNotificationService = ServiceFactory.getPhotoSubmissionNotificationService(),
    private readonly instagramIntegrationService: InstagramIntegrationService = ServiceFactory.getInstagramIntegrationService(),
  ) {}

  async listAccountPending(accountId: bigint): Promise<PhotoSubmissionDetailType[]> {
    return this.submissionService.listPendingAccountSubmissions(accountId);
  }

  async listTeamPending(accountId: bigint, teamId: bigint): Promise<PhotoSubmissionDetailType[]> {
    return this.submissionService.listPendingTeamSubmissions(accountId, teamId);
  }

  async approveSubmission(
    accountId: bigint,
    submissionId: bigint,
    moderatorContactId: bigint,
  ): Promise<PhotoSubmissionDetailType> {
    let detail: PhotoSubmissionDetailType | null = null;

    try {
      detail = await this.submissionService.getSubmissionDetail(accountId, submissionId);
      const albumId = detail.albumId ? BigInt(detail.albumId) : null;
      const photoCount = await this.galleryService.countPhotosInAlbum(accountId, albumId);
      if (photoCount >= ALBUM_PHOTO_LIMIT) {
        photoSubmissionMetrics.recordQuotaViolation({
          accountId: detail.accountId,
          teamId: detail.teamId,
          submissionId: detail.id,
          albumId: detail.albumId,
          limit: ALBUM_PHOTO_LIMIT,
        });

        throw new ValidationError('Album has reached the maximum number of photos');
      }

      const photo = await this.galleryService.createPhoto({
        accountId,
        albumId,
        title: detail.title,
        caption: detail.caption ?? '',
      });

      const cleanupPhoto = async (error: unknown): Promise<never> => {
        try {
          await this.galleryService.deletePhoto(photo.id);
        } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], 'Failed to approve photo submission');
        }

        throw error;
      };

      let updatedSubmission: PhotoSubmissionRecordType;
      try {
        updatedSubmission = await this.submissionService.approveSubmission({
          accountId: accountId.toString(),
          submissionId: submissionId.toString(),
          moderatorContactId: moderatorContactId.toString(),
          approvedPhotoId: photo.id.toString(),
        });
      } catch (error) {
        return cleanupPhoto(error);
      }

      try {
        await this.assetService.promoteSubmissionAssets(updatedSubmission, photo.id);
        await this.assetService.deleteSubmissionAssets(updatedSubmission);
        await this.uploadToInstagram(accountId, photo.id, detail?.caption ?? undefined).catch(
          (error) => {
            console.error('[instagram] Failed to mirror approved submission', {
              accountId: accountId.toString(),
              photoId: photo.id.toString(),
              error,
            });
          },
        );
      } catch (error) {
        const rollbackErrors: unknown[] = [];

        try {
          await this.assetService.deleteGalleryAssets(updatedSubmission, photo.id);
        } catch (cleanupError) {
          rollbackErrors.push(cleanupError);
        }

        try {
          await this.galleryService.deletePhoto(photo.id);
        } catch (cleanupError) {
          rollbackErrors.push(cleanupError);
        }

        try {
          await this.submissionService.revertApproval(updatedSubmission);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }

        if (rollbackErrors.length > 0) {
          throw new AggregateError(
            [error, ...rollbackErrors],
            'Failed to approve photo submission',
          );
        }

        throw error;
      }

      const finalDetail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

      const emailSent =
        await this.notificationService.sendSubmissionApprovedNotification(finalDetail);
      if (!emailSent) {
        throw new PhotoSubmissionNotificationError('moderation-approved', undefined, finalDetail);
      }

      return finalDetail;
    } catch (error) {
      const isQuotaViolation =
        error instanceof ValidationError &&
        error.message === 'Album has reached the maximum number of photos';

      if (!isQuotaViolation && !(error instanceof PhotoSubmissionNotificationError)) {
        photoSubmissionMetrics.recordSubmissionFailure({
          stage: 'moderation-approve',
          accountId: accountId.toString(),
          teamId: detail?.teamId ?? null,
          submissionId: submissionId.toString(),
          error,
        });
      }

      throw error;
    }
  }

  async denySubmission(
    accountId: bigint,
    submissionId: bigint,
    moderatorContactId: bigint,
    denialReason: string,
  ): Promise<PhotoSubmissionDetailType> {
    let detail: PhotoSubmissionDetailType | null = null;

    try {
      detail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

      const updatedSubmission = await this.submissionService.denySubmission({
        accountId: accountId.toString(),
        submissionId: submissionId.toString(),
        moderatorContactId: moderatorContactId.toString(),
        denialReason,
      });

      await this.assetService.deleteSubmissionAssets(updatedSubmission);

      const finalDetail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

      const emailSent =
        await this.notificationService.sendSubmissionDeniedNotification(finalDetail);
      if (!emailSent) {
        throw new PhotoSubmissionNotificationError('moderation-denied', undefined, finalDetail);
      }

      return finalDetail;
    } catch (error) {
      if (!(error instanceof PhotoSubmissionNotificationError)) {
        photoSubmissionMetrics.recordSubmissionFailure({
          stage: 'moderation-deny',
          accountId: accountId.toString(),
          teamId: detail?.teamId ?? null,
          submissionId: submissionId.toString(),
          error,
        });
      }
      throw error;
    }
  }

  private async uploadToInstagram(accountId: bigint, photoId: bigint, caption?: string): Promise<void> {
    await this.instagramIntegrationService.uploadPhotoFromGallery(accountId, photoId, caption);
  }
}
