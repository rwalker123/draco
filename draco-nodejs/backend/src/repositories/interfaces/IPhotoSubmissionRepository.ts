import {
  dbApprovePhotoSubmissionInput,
  dbCreatePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoGalleryAlbum,
  dbPhotoSubmission,
  dbPhotoSubmissionWithRelations,
} from '../types/dbTypes.js';

export interface IPhotoSubmissionRepository {
  createSubmission(data: dbCreatePhotoSubmissionInput): Promise<dbPhotoSubmission>;
  findSubmissionById(submissionId: bigint): Promise<dbPhotoSubmission | null>;
  findSubmissionForAccount(
    accountId: bigint,
    submissionId: bigint,
  ): Promise<dbPhotoSubmission | null>;
  findSubmissionWithRelations(
    submissionId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations | null>;
  findAlbumForAccount(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum | null>;
  approveSubmission(
    submissionId: bigint,
    data: dbApprovePhotoSubmissionInput,
  ): Promise<dbPhotoSubmission>;
  denySubmission(
    submissionId: bigint,
    data: dbDenyPhotoSubmissionInput,
  ): Promise<dbPhotoSubmission>;
}
