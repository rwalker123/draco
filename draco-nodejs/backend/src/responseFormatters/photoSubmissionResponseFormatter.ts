import type {
  PhotoSubmissionAlbumInfoType,
  PhotoSubmissionApprovedPhotoType,
  PhotoSubmissionContactInfoType,
  PhotoSubmissionDetailType,
  PhotoSubmissionRecordType,
} from '@draco/shared-schemas';
import type {
  dbPhotoGalleryAlbum,
  dbPhotoSubmission,
  dbPhotoSubmissionWithRelations,
} from '../repositories/types/dbTypes.js';
import { DateUtils } from '../utils/dateUtils.js';

const normalizeBigInt = (value: bigint | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (value === 0n) {
    return null;
  }

  return value.toString();
};

const formatDateTime = (value: Date | null | undefined): string => {
  return DateUtils.formatDateTimeForResponse(value) ?? new Date(0).toISOString();
};

const formatNullableDateTime = (value: Date | null | undefined): string | null => {
  return DateUtils.formatDateTimeForResponse(value);
};

const formatAlbum = (album: dbPhotoGalleryAlbum | null | undefined): PhotoSubmissionAlbumInfoType | null => {
  if (!album) {
    return null;
  }

  return {
    id: album.id.toString(),
    title: album.title,
    teamId: normalizeBigInt(album.teamid ?? null),
  };
};

const formatApprovedPhoto = (
  submission: dbPhotoSubmissionWithRelations,
): PhotoSubmissionApprovedPhotoType | null => {
  if (!submission.photogallery) {
    return null;
  }

  return {
    id: submission.photogallery.id.toString(),
    title: submission.photogallery.title,
    albumId: normalizeBigInt(submission.photogallery.albumid ?? null),
  };
};

const formatContact = (
  contact: dbPhotoSubmissionWithRelations['submitter'],
): PhotoSubmissionContactInfoType => ({
  id: contact.id.toString(),
  firstName: contact.firstname?.trim() ?? '',
  lastName: contact.lastname?.trim() ?? '',
  email: contact.email ?? null,
});

export class PhotoSubmissionResponseFormatter {
  static formatSubmission(submission: dbPhotoSubmission): PhotoSubmissionRecordType {
    return {
      id: submission.id.toString(),
      accountId: submission.accountid.toString(),
      teamId: normalizeBigInt(submission.teamid ?? null),
      albumId: normalizeBigInt(submission.albumid ?? null),
      submitterContactId: submission.submittercontactid.toString(),
      moderatedByContactId: normalizeBigInt(submission.moderatedbycontactid ?? null),
      approvedPhotoId: normalizeBigInt(submission.approvedphotoid ?? null),
      title: submission.title,
      caption: submission.caption ?? null,
      originalFileName: submission.originalfilename,
      originalFilePath: submission.originalfilepath,
      primaryImagePath: submission.primaryimagepath,
      thumbnailImagePath: submission.thumbnailimagepath,
      status: submission.status as PhotoSubmissionRecordType['status'],
      denialReason: submission.denialreason ?? null,
      submittedAt: formatDateTime(submission.submittedat),
      updatedAt: formatDateTime(submission.updatedat),
      moderatedAt: formatNullableDateTime(submission.moderatedat),
    };
  }

  static formatSubmissionDetail(submission: dbPhotoSubmissionWithRelations): PhotoSubmissionDetailType {
    const base = this.formatSubmission(submission);

    return {
      ...base,
      accountName: submission.accounts?.name ?? '',
      album: formatAlbum(submission.photogalleryalbum),
      approvedPhoto: formatApprovedPhoto(submission),
      submitter: submission.submitter ? formatContact(submission.submitter) : null,
      moderator: submission.moderator ? formatContact(submission.moderator) : null,
    };
  }
}
