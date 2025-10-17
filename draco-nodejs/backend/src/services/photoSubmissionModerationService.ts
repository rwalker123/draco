import { ServiceFactory } from './serviceFactory.js';
import { PhotoSubmissionService } from './photoSubmissionService.js';
import { PhotoGalleryService } from './photoGalleryService.js';
import { PhotoSubmissionAssetService } from './photoSubmissionAssetService.js';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

const ALBUM_PHOTO_LIMIT = 100;

export class PhotoSubmissionModerationService {
  constructor(
    private readonly submissionService: PhotoSubmissionService = ServiceFactory.getPhotoSubmissionService(),
    private readonly galleryService: PhotoGalleryService = ServiceFactory.getPhotoGalleryService(),
    private readonly assetService: PhotoSubmissionAssetService = ServiceFactory.getPhotoSubmissionAssetService(),
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

    const updatedSubmission = await this.submissionService.approveSubmission({
      accountId: accountId.toString(),
      submissionId: submissionId.toString(),
      moderatorContactId: moderatorContactId.toString(),
      approvedPhotoId: photo.id.toString(),
    });

    await this.assetService.promoteSubmissionAssets(updatedSubmission, photo.id);
    await this.assetService.deleteSubmissionAssets(updatedSubmission);

    return this.submissionService.getSubmissionDetail(accountId, submissionId);
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

    return this.submissionService.getSubmissionDetail(accountId, submissionId);
  }
}
