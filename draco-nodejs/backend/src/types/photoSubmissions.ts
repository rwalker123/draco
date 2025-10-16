export type PhotoSubmissionStatus = 'Pending' | 'Approved' | 'Denied';

export interface PhotoSubmissionAssets {
  originalFilePath: string;
  primaryImagePath: string;
  thumbnailImagePath: string;
  originalFileName: string;
}

export interface PhotoSubmissionMetadata {
  id: bigint;
  accountId: bigint;
  teamId?: bigint | null;
  albumId?: bigint | null;
  submitterContactId: bigint;
  moderatedByContactId?: bigint | null;
  approvedPhotoId?: bigint | null;
  title: string;
  caption?: string | null;
  status: PhotoSubmissionStatus;
  denialReason?: string | null;
  submittedAt: Date;
  updatedAt: Date;
  moderatedAt?: Date | null;
}

export type PhotoSubmissionRecord = PhotoSubmissionMetadata & PhotoSubmissionAssets;
