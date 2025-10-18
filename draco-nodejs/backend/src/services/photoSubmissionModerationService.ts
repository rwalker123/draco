import { ServiceFactory } from './serviceFactory.js';
import { PhotoSubmissionService } from './photoSubmissionService.js';
import { PhotoGalleryService } from './photoGalleryService.js';
import { PhotoSubmissionAssetService } from './photoSubmissionAssetService.js';
import { PhotoSubmissionNotificationService } from './photoSubmissionNotificationService.js';
import type { PhotoSubmissionDetailType, PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

const ALBUM_PHOTO_LIMIT = 100;

export class PhotoSubmissionModerationService {
  constructor(
    private readonly submissionService: PhotoSubmissionService = ServiceFactory.getPhotoSubmissionService(),
    private readonly galleryService: PhotoGalleryService = ServiceFactory.getPhotoGalleryService(),
    private readonly assetService: PhotoSubmissionAssetService = ServiceFactory.getPhotoSubmissionAssetService(),
    private readonly notificationService: PhotoSubmissionNotificationService = ServiceFactory.getPhotoSubmissionNotificationService(),
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
    const detail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

    const albumId = detail.albumId ? BigInt(detail.albumId) : null;

    const photoCount = await this.galleryService.countPhotosInAlbum(accountId, albumId);
    if (photoCount >= ALBUM_PHOTO_LIMIT) {
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
        throw new AggregateError([error, ...rollbackErrors], 'Failed to approve photo submission');
      }

      throw error;
    }

    const finalDetail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

    await this.notificationService.sendSubmissionApprovedNotification(finalDetail);

    return finalDetail;
  }

  async denySubmission(
    accountId: bigint,
    submissionId: bigint,
    moderatorContactId: bigint,
    denialReason: string,
  ): Promise<PhotoSubmissionDetailType> {
    const updatedSubmission = await this.submissionService.denySubmission({
      accountId: accountId.toString(),
      submissionId: submissionId.toString(),
      moderatorContactId: moderatorContactId.toString(),
      denialReason,
    });

    await this.assetService.deleteSubmissionAssets(updatedSubmission);

    const finalDetail = await this.submissionService.getSubmissionDetail(accountId, submissionId);

    await this.notificationService.sendSubmissionDeniedNotification(finalDetail);

    return finalDetail;
  }
}
