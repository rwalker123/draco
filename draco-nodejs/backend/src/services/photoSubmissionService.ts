import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type {
  ApprovePhotoSubmissionInputType,
  CreatePhotoSubmissionInputType,
  DenyPhotoSubmissionInputType,
  PhotoSubmissionDetailType,
  PhotoSubmissionRecordType,
} from '@draco/shared-schemas';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/index.js';
import { buildSubmissionAssetPaths } from '../utils/photoSubmissionPaths.js';
import type {
  IPhotoSubmissionRepository,
  dbApprovePhotoSubmissionInput,
  dbCreatePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoGalleryAlbum,
  dbPhotoSubmission,
} from '../repositories/index.js';
import { PhotoSubmissionResponseFormatter } from '../responseFormatters/photoSubmissionResponseFormatter.js';

const ALLOWED_EXTENSIONS = new Set(['.gif', '.jpg', '.jpeg', '.png', '.bmp']);

export class PhotoSubmissionService {
  constructor(
    private readonly repository: IPhotoSubmissionRepository = RepositoryFactory.getPhotoSubmissionRepository(),
  ) {}

  async createSubmission(
    input: CreatePhotoSubmissionInputType,
  ): Promise<PhotoSubmissionRecordType> {
    const accountId = this.parseBigInt(input.accountId, 'Account');
    const submitterContactId = this.parseBigInt(input.submitterContactId, 'Submitter contact');
    const albumId = this.parseOptionalBigInt(input.albumId, 'Album');
    const teamId = this.normalizeTeamId(this.parseOptionalBigInt(input.teamId, 'Team'));

    const title = this.validateTitle(input.title);
    const caption = this.validateCaption(input.caption ?? null);
    const originalFileName = this.validateOriginalFileName(input.originalFileName);
    const extension = this.validateExtension(originalFileName);

    const album = albumId ? await this.getAlbum(accountId, albumId) : null;
    const resolvedTeamId = this.resolveTeamId(teamId, album);

    const storageKey = input.storageKey ?? randomUUID();
    const assetPaths = buildSubmissionAssetPaths(accountId, storageKey, extension);

    const createData: dbCreatePhotoSubmissionInput = {
      accountid: accountId,
      teamid: resolvedTeamId ?? undefined,
      albumid: albumId ?? undefined,
      submittercontactid: submitterContactId,
      title,
      caption: caption ?? undefined,
      originalfilename: originalFileName,
      originalfilepath: assetPaths.originalFilePath,
      primaryimagepath: assetPaths.primaryImagePath,
      thumbnailimagepath: assetPaths.thumbnailImagePath,
    };

    const record = await this.repository.createSubmission(createData);
    return PhotoSubmissionResponseFormatter.formatSubmission(record);
  }

  async deleteSubmission(accountId: bigint, submissionId: bigint): Promise<void> {
    const submission = await this.requireSubmission(accountId, submissionId);

    if (submission.status !== 'Pending') {
      throw new ValidationError('Only pending submissions can be deleted');
    }

    await this.repository.deleteSubmission(submissionId);
  }

  async getSubmission(accountId: bigint, submissionId: bigint): Promise<PhotoSubmissionRecordType> {
    const submission = await this.requireSubmission(accountId, submissionId);
    return PhotoSubmissionResponseFormatter.formatSubmission(submission);
  }

  async getSubmissionDetail(
    accountId: bigint,
    submissionId: bigint,
  ): Promise<PhotoSubmissionDetailType> {
    const submission = await this.repository.findSubmissionWithRelations(submissionId);
    if (!submission || submission.accountid !== accountId) {
      throw new NotFoundError('Photo submission not found');
    }
    return PhotoSubmissionResponseFormatter.formatSubmissionDetail(submission);
  }

  async listPendingAccountSubmissions(accountId: bigint): Promise<PhotoSubmissionDetailType[]> {
    const submissions = await this.repository.findPendingSubmissionsForAccount(accountId);
    return submissions.map((submission) =>
      PhotoSubmissionResponseFormatter.formatSubmissionDetail(submission),
    );
  }

  async listPendingTeamSubmissions(
    accountId: bigint,
    teamId: bigint,
  ): Promise<PhotoSubmissionDetailType[]> {
    const submissions = await this.repository.findPendingSubmissionsForTeam(accountId, teamId);
    return submissions.map((submission) =>
      PhotoSubmissionResponseFormatter.formatSubmissionDetail(submission),
    );
  }

  async approveSubmission(
    input: ApprovePhotoSubmissionInputType,
  ): Promise<PhotoSubmissionRecordType> {
    const accountId = this.parseBigInt(input.accountId, 'Account');
    const submissionId = this.parseBigInt(input.submissionId, 'Submission');
    const moderatorContactId = this.parseBigInt(input.moderatorContactId, 'Moderator contact');
    const approvedPhotoId = this.parseBigInt(input.approvedPhotoId, 'Approved photo');

    const submission = await this.requireSubmission(accountId, submissionId);
    this.ensurePending(submission);

    const now = new Date();
    const updateData: dbApprovePhotoSubmissionInput = {
      moderatedbycontactid: moderatorContactId,
      approvedphotoid: approvedPhotoId,
      moderatedat: now,
      updatedat: now,
    };

    const updated = await this.repository.approveSubmission(submission.id, updateData);
    return PhotoSubmissionResponseFormatter.formatSubmission(updated);
  }

  async revertApproval(submission: PhotoSubmissionRecordType): Promise<void> {
    const submissionId = this.parseBigInt(submission.id, 'Submission');
    await this.repository.revertApproval(submissionId);
  }

  async denySubmission(input: DenyPhotoSubmissionInputType): Promise<PhotoSubmissionRecordType> {
    const accountId = this.parseBigInt(input.accountId, 'Account');
    const submissionId = this.parseBigInt(input.submissionId, 'Submission');
    const moderatorContactId = this.parseBigInt(input.moderatorContactId, 'Moderator contact');
    const reason = this.validateDenialReason(input.denialReason);

    const submission = await this.requireSubmission(accountId, submissionId);
    this.ensurePending(submission);

    const now = new Date();
    const updateData: dbDenyPhotoSubmissionInput = {
      moderatedbycontactid: moderatorContactId,
      denialreason: reason,
      moderatedat: now,
      updatedat: now,
    };

    const updated = await this.repository.denySubmission(submission.id, updateData);
    return PhotoSubmissionResponseFormatter.formatSubmission(updated);
  }

  private async requireSubmission(
    accountId: bigint,
    submissionId: bigint,
  ): Promise<dbPhotoSubmission> {
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

  private normalizeTeamId(teamId: bigint | null): bigint | null {
    if (teamId === null) {
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

  private parseBigInt(value: string, label: string): bigint {
    try {
      const normalized = value.trim();
      if (!normalized) {
        throw new Error('empty');
      }
      return BigInt(normalized);
    } catch (_error) {
      throw new ValidationError(`${label} identifier must be a valid number`);
    }
  }

  private parseOptionalBigInt(value: string | null | undefined, label: string): bigint | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      return null;
    }

    return this.parseBigInt(normalized, label);
  }
}
