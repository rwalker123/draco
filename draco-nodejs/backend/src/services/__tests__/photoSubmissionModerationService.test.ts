import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PhotoSubmissionModerationService } from '../photoSubmissionModerationService.js';
import type {
  ApprovePhotoSubmissionInputType,
  DenyPhotoSubmissionInputType,
  PhotoSubmissionDetailType,
  PhotoSubmissionRecordType,
} from '@draco/shared-schemas';

describe('PhotoSubmissionModerationService', () => {
  const submissionService = {
    getSubmissionDetail:
      vi.fn<(accountId: bigint, submissionId: bigint) => Promise<PhotoSubmissionDetailType>>(),
    approveSubmission:
      vi.fn<(input: ApprovePhotoSubmissionInputType) => Promise<PhotoSubmissionRecordType>>(),
    denySubmission:
      vi.fn<(input: DenyPhotoSubmissionInputType) => Promise<PhotoSubmissionRecordType>>(),
    revertApproval: vi.fn<(submission: PhotoSubmissionRecordType) => Promise<void>>(),
  };

  const galleryService = {
    countPhotosInAlbum: vi.fn<(accountId: bigint, albumId: bigint | null) => Promise<number>>(),
    createPhoto:
      vi.fn<
        (params: {
          accountId: bigint;
          albumId: bigint | null;
          title: string;
          caption?: string | null;
        }) => Promise<{ id: bigint }>
      >(),
    deletePhoto: vi.fn<(photoId: bigint) => Promise<void>>(),
  };

  const assetService = {
    promoteSubmissionAssets:
      vi.fn<(submission: PhotoSubmissionRecordType, photoId: bigint) => Promise<void>>(),
    deleteSubmissionAssets: vi.fn<(submission: PhotoSubmissionRecordType) => Promise<void>>(),
    deleteGalleryAssets:
      vi.fn<(submission: PhotoSubmissionRecordType, photoId: bigint) => Promise<void>>(),
  };

  const notificationService = {
    sendSubmissionApprovedNotification:
      vi.fn<(detail: PhotoSubmissionDetailType) => Promise<void>>(),
    sendSubmissionDeniedNotification: vi.fn<(detail: PhotoSubmissionDetailType) => Promise<void>>(),
  };

  const baseDetail: PhotoSubmissionDetailType = {
    id: '10',
    accountId: '1',
    teamId: null,
    albumId: null,
    submitterContactId: '5',
    moderatedByContactId: null,
    approvedPhotoId: null,
    title: 'Summer Tournament',
    caption: null,
    originalFileName: 'photo.jpg',
    originalFilePath: 'Uploads/Accounts/1/PhotoSubmissions/key/original.jpg',
    primaryImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/primary.jpg',
    thumbnailImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/thumbnail.jpg',
    status: 'Pending',
    denialReason: null,
    submittedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    moderatedAt: null,
    accountName: 'Example Account',
    album: null,
    approvedPhoto: null,
    submitter: { id: '5', firstName: 'Sam', lastName: 'Submitter', email: 'sam@example.com' },
    moderator: null,
  };

  const approvedRecord: PhotoSubmissionRecordType = {
    id: '10',
    accountId: '1',
    teamId: null,
    albumId: null,
    submitterContactId: '5',
    moderatedByContactId: '7',
    approvedPhotoId: '25',
    title: 'Summer Tournament',
    caption: null,
    originalFileName: 'photo.jpg',
    originalFilePath: 'Uploads/Accounts/1/PhotoSubmissions/key/original.jpg',
    primaryImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/primary.jpg',
    thumbnailImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/thumbnail.jpg',
    status: 'Approved',
    denialReason: null,
    submittedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T01:00:00Z').toISOString(),
    moderatedAt: new Date('2024-01-01T01:00:00Z').toISOString(),
  };

  const deniedRecord: PhotoSubmissionRecordType = {
    ...approvedRecord,
    status: 'Denied',
    approvedPhotoId: null,
    moderatedByContactId: '7',
    denialReason: 'Inappropriate',
  };

  let service: PhotoSubmissionModerationService;

  beforeEach(() => {
    submissionService.getSubmissionDetail.mockReset();
    submissionService.approveSubmission.mockReset();
    submissionService.denySubmission.mockReset();
    submissionService.revertApproval.mockReset();
    galleryService.countPhotosInAlbum.mockReset();
    galleryService.createPhoto.mockReset();
    galleryService.deletePhoto.mockReset();
    assetService.promoteSubmissionAssets.mockReset();
    assetService.deleteSubmissionAssets.mockReset();
    assetService.deleteGalleryAssets.mockReset();
    notificationService.sendSubmissionApprovedNotification.mockReset();
    notificationService.sendSubmissionDeniedNotification.mockReset();
    service = new PhotoSubmissionModerationService(
      submissionService as never,
      galleryService as never,
      assetService as never,
      notificationService as never,
    );
  });

  it('approves a submission targeting the default album', async () => {
    const detailAfterApproval: PhotoSubmissionDetailType = {
      ...baseDetail,
      status: 'Approved',
      approvedPhotoId: '25',
      moderatedByContactId: '7',
      moderatedAt: new Date('2024-01-01T01:00:00Z').toISOString(),
      approvedPhoto: { id: '25', title: 'Summer Tournament', albumId: null },
      moderator: { id: '7', firstName: 'Mia', lastName: 'Moderator', email: 'mia@example.com' },
    };

    submissionService.getSubmissionDetail
      .mockResolvedValueOnce(baseDetail)
      .mockResolvedValueOnce(detailAfterApproval);
    galleryService.countPhotosInAlbum.mockResolvedValue(5);
    galleryService.createPhoto.mockResolvedValue({ id: 25n });
    submissionService.approveSubmission.mockResolvedValue(approvedRecord);
    assetService.promoteSubmissionAssets.mockResolvedValue();
    assetService.deleteSubmissionAssets.mockResolvedValue();

    const result = await service.approveSubmission(1n, 10n, 7n);

    expect(galleryService.countPhotosInAlbum).toHaveBeenCalledWith(1n, null);
    expect(galleryService.createPhoto).toHaveBeenCalledWith({
      accountId: 1n,
      albumId: null,
      title: 'Summer Tournament',
      caption: '',
    });
    expect(submissionService.approveSubmission).toHaveBeenCalledWith({
      accountId: '1',
      submissionId: '10',
      moderatorContactId: '7',
      approvedPhotoId: '25',
    });
    expect(assetService.promoteSubmissionAssets).toHaveBeenCalledWith(approvedRecord, 25n);
    expect(assetService.deleteSubmissionAssets).toHaveBeenCalledWith(approvedRecord);
    expect(assetService.deleteGalleryAssets).not.toHaveBeenCalled();
    expect(submissionService.revertApproval).not.toHaveBeenCalled();
    expect(notificationService.sendSubmissionApprovedNotification).toHaveBeenCalledWith(
      detailAfterApproval,
    );
    expect(result).toEqual(detailAfterApproval);
  });

  it('throws a validation error when the album limit is reached', async () => {
    submissionService.getSubmissionDetail.mockResolvedValue(baseDetail);
    galleryService.countPhotosInAlbum.mockResolvedValue(100);

    await expect(service.approveSubmission(1n, 10n, 7n)).rejects.toThrow(
      'Album has reached the maximum number of photos',
    );

    expect(galleryService.createPhoto).not.toHaveBeenCalled();
    expect(submissionService.approveSubmission).not.toHaveBeenCalled();
    expect(assetService.promoteSubmissionAssets).not.toHaveBeenCalled();
  });

  it('denies a submission and cleans up assets', async () => {
    const detailAfterDenial: PhotoSubmissionDetailType = {
      ...baseDetail,
      status: 'Denied',
      denialReason: 'Inappropriate',
      moderatedByContactId: '7',
      moderatedAt: new Date('2024-01-01T01:00:00Z').toISOString(),
      moderator: { id: '7', firstName: 'Mia', lastName: 'Moderator', email: 'mia@example.com' },
    };

    submissionService.denySubmission.mockResolvedValue(deniedRecord);
    submissionService.getSubmissionDetail.mockResolvedValue(detailAfterDenial);
    assetService.deleteSubmissionAssets.mockResolvedValue();

    const result = await service.denySubmission(1n, 10n, 7n, 'Inappropriate');

    expect(assetService.deleteSubmissionAssets).toHaveBeenCalledWith(deniedRecord);
    expect(notificationService.sendSubmissionDeniedNotification).toHaveBeenCalledWith(
      detailAfterDenial,
    );
    expect(result).toEqual(detailAfterDenial);
  });

  it('rolls back approval when asset promotion fails', async () => {
    submissionService.getSubmissionDetail.mockResolvedValue(baseDetail);
    galleryService.countPhotosInAlbum.mockResolvedValue(5);
    galleryService.createPhoto.mockResolvedValue({ id: 25n });
    submissionService.approveSubmission.mockResolvedValue(approvedRecord);
    const error = new Error('promotion failed');
    assetService.promoteSubmissionAssets.mockRejectedValue(error);

    await expect(service.approveSubmission(1n, 10n, 7n)).rejects.toBe(error);

    expect(assetService.deleteSubmissionAssets).not.toHaveBeenCalled();
    expect(assetService.deleteGalleryAssets).toHaveBeenCalledWith(approvedRecord, 25n);
    expect(galleryService.deletePhoto).toHaveBeenCalledWith(25n);
    expect(submissionService.revertApproval).toHaveBeenCalledWith(approvedRecord);
  });

  it('reverts approval when submission asset cleanup fails', async () => {
    submissionService.getSubmissionDetail.mockResolvedValue(baseDetail);
    galleryService.countPhotosInAlbum.mockResolvedValue(5);
    galleryService.createPhoto.mockResolvedValue({ id: 25n });
    submissionService.approveSubmission.mockResolvedValue(approvedRecord);
    assetService.promoteSubmissionAssets.mockResolvedValue();
    const error = new Error('cleanup failed');
    assetService.deleteSubmissionAssets.mockRejectedValue(error);

    await expect(service.approveSubmission(1n, 10n, 7n)).rejects.toBe(error);

    expect(assetService.promoteSubmissionAssets).toHaveBeenCalledWith(approvedRecord, 25n);
    expect(assetService.deleteGalleryAssets).toHaveBeenCalledWith(approvedRecord, 25n);
    expect(galleryService.deletePhoto).toHaveBeenCalledWith(25n);
    expect(submissionService.revertApproval).toHaveBeenCalledWith(approvedRecord);
  });
});
