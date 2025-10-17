import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  ApprovePhotoSubmissionInput,
  CreatePhotoSubmissionInput,
  DenyPhotoSubmissionInput,
  PhotoSubmissionAssets,
  PhotoSubmissionRecord,
  PhotoSubmissionStatus,
} from '../types/photoSubmissions.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/index.js';
import type {
  IPhotoSubmissionRepository,
  dbApprovePhotoSubmissionInput,
  dbCreatePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoGalleryAlbum,
  dbPhotoSubmission,
} from '../repositories/index.js';

const ALLOWED_EXTENSIONS = new Set(['.gif', '.jpg', '.jpeg', '.png', '.bmp']);
const STORAGE_BASE_PREFIX = 'Uploads/Accounts';

export class PhotoSubmissionService {
  constructor(
    private readonly repository: IPhotoSubmissionRepository = RepositoryFactory.getPhotoSubmissionRepository(),
  ) {}

  async createSubmission(input: CreatePhotoSubmissionInput): Promise<PhotoSubmissionRecord> {
    const title = this.validateTitle(input.title);
    const caption = this.validateCaption(input.caption);
    const originalFileName = this.validateOriginalFileName(input.originalFileName);
    const extension = this.validateExtension(originalFileName);

    const album = input.albumId ? await this.getAlbum(input.accountId, input.albumId) : null;
    const resolvedTeamId = this.resolveTeamId(this.normalizeTeamId(input.teamId), album);

    const storageKey = randomUUID();
    const assetPaths = this.buildStoragePaths(input.accountId, storageKey, extension);

    const createData: dbCreatePhotoSubmissionInput = {
      accountid: input.accountId,
      teamid: resolvedTeamId ?? undefined,
      albumid: input.albumId ?? undefined,
      submittercontactid: input.submitterContactId,
      title,
      caption: caption ?? undefined,
      originalfilename: originalFileName,
      originalfilepath: assetPaths.originalFilePath,
      primaryimagepath: assetPaths.primaryImagePath,
      thumbnailimagepath: assetPaths.thumbnailImagePath,
    };

    const record = await this.repository.createSubmission(createData);
    return this.mapSubmission(record);
  }

  async getSubmission(accountId: bigint, submissionId: bigint): Promise<PhotoSubmissionRecord> {
    const submission = await this.requireSubmission(accountId, submissionId);
    return this.mapSubmission(submission);
  }

  async approveSubmission(input: ApprovePhotoSubmissionInput): Promise<PhotoSubmissionRecord> {
    this.ensurePositiveIdentifier(input.moderatorContactId, 'Moderator contact');
    this.ensurePositiveIdentifier(input.approvedPhotoId, 'Approved photo');

    const submission = await this.requireSubmission(input.accountId, input.submissionId);
    this.ensurePending(submission);

    const now = new Date();
    const updateData: dbApprovePhotoSubmissionInput = {
      moderatedbycontactid: input.moderatorContactId,
      approvedphotoid: input.approvedPhotoId,
      moderatedat: now,
      updatedat: now,
    };

    const updated = await this.repository.approveSubmission(submission.id, updateData);
    return this.mapSubmission(updated);
  }

  async denySubmission(input: DenyPhotoSubmissionInput): Promise<PhotoSubmissionRecord> {
    this.ensurePositiveIdentifier(input.moderatorContactId, 'Moderator contact');
    const reason = this.validateDenialReason(input.denialReason);

    const submission = await this.requireSubmission(input.accountId, input.submissionId);
    this.ensurePending(submission);

    const now = new Date();
    const updateData: dbDenyPhotoSubmissionInput = {
      moderatedbycontactid: input.moderatorContactId,
      denialreason: reason,
      moderatedat: now,
      updatedat: now,
    };

    const updated = await this.repository.denySubmission(submission.id, updateData);
    return this.mapSubmission(updated);
  }

  private async requireSubmission(accountId: bigint, submissionId: bigint): Promise<dbPhotoSubmission> {
    const submission = await this.repository.findSubmissionForAccount(accountId, submissionId);
    if (!submission) {
      throw new NotFoundError('Photo submission not found');
    }
    return submission;
  }

  private async getAlbum(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum> {
    const album = await this.repository.findAlbumForAccount(accountId, albumId);
    if (!album) {
      throw new NotFoundError('Photo album not found');
    }
    return album;
  }

  private ensurePending(submission: dbPhotoSubmission): void {
    if (submission.status !== 'Pending') {
      throw new ValidationError('Only pending submissions can be moderated');
    }
  }

  private ensurePositiveIdentifier(value: bigint, label: string): void {
    if (value <= 0n) {
      throw new ValidationError(`${label} identifier must be a positive value`);
    }
  }

  private validateTitle(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new ValidationError('Title is required');
    }
    if (trimmed.length > 50) {
      throw new ValidationError('Title must be 50 characters or fewer');
    }
    return trimmed;
  }

  private validateCaption(caption?: string | null): string | null {
    if (caption === undefined || caption === null) {
      return null;
    }

    const trimmed = caption.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.length > 255) {
      throw new ValidationError('Caption must be 255 characters or fewer');
    }

    return trimmed;
  }

  private validateDenialReason(reason: string): string {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new ValidationError('Denial reason is required');
    }
    if (trimmed.length > 255) {
      throw new ValidationError('Denial reason must be 255 characters or fewer');
    }
    return trimmed;
  }

  private validateOriginalFileName(fileName: string): string {
    const trimmed = fileName.trim();
    if (!trimmed) {
      throw new ValidationError('Original file name is required');
    }
    if (trimmed.length > 255) {
      throw new ValidationError('Original file name must be 255 characters or fewer');
    }
    return trimmed;
  }

  private validateExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new ValidationError(`Unsupported file type: ${extension || 'unknown'}`);
    }
    return extension;
  }

  private normalizeTeamId(teamId?: bigint | null): bigint | null {
    if (teamId === undefined || teamId === null) {
      return null;
    }

    if (teamId === 0n) {
      return null;
    }

    this.ensurePositiveIdentifier(teamId, 'Team');
    return teamId;
  }

  private resolveTeamId(teamId: bigint | null, album: dbPhotoGalleryAlbum | null): bigint | null {
    if (!album) {
      return teamId;
    }

    const albumTeamId = album.teamid ?? 0n;
    if (albumTeamId !== 0n) {
      if (teamId && teamId !== albumTeamId) {
        throw new ValidationError('Album does not belong to the provided team');
      }
      return albumTeamId;
    }

    if (teamId) {
      throw new ValidationError('Account-level albums cannot be associated with a team submission');
    }

    return null;
  }

  private buildStoragePaths(
    accountId: bigint,
    storageKey: string,
    extension: string,
  ): PhotoSubmissionAssets {
    const accountSegment = accountId.toString();
    const basePath = `${STORAGE_BASE_PREFIX}/${accountSegment}/PhotoSubmissions/${storageKey}`;

    return {
      originalFilePath: `${basePath}/original${extension}`,
      primaryImagePath: `${basePath}/primary${extension}`,
      thumbnailImagePath: `${basePath}/thumbnail${extension}`,
      originalFileName: `original${extension}`,
    };
  }

  private mapSubmission(submission: dbPhotoSubmission): PhotoSubmissionRecord {
    return {
      id: submission.id,
      accountId: submission.accountid,
      teamId: this.normalizeTeamId(submission.teamid ?? null),
      albumId: submission.albumid ?? null,
      submitterContactId: submission.submittercontactid,
      moderatedByContactId: submission.moderatedbycontactid ?? null,
      approvedPhotoId: submission.approvedphotoid ?? null,
      title: submission.title,
      caption: submission.caption ?? null,
      originalFileName: submission.originalfilename,
      originalFilePath: submission.originalfilepath,
      primaryImagePath: submission.primaryimagepath,
      thumbnailImagePath: submission.thumbnailimagepath,
      status: submission.status as PhotoSubmissionStatus,
      denialReason: submission.denialreason ?? null,
      submittedAt: submission.submittedat,
      updatedAt: submission.updatedat,
      moderatedAt: submission.moderatedat ?? null,
    };
  }
}
