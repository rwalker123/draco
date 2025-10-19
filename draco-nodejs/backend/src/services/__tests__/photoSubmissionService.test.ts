import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.mock('../../utils/customErrors.js', () => {
  class ValidationError extends Error {}
  class NotFoundError extends Error {}
  class ConflictError extends Error {}
  return { ValidationError, NotFoundError, ConflictError };
});
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getPhotoSubmissionRepository: vi.fn(),
  },
}));
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'storage-key'),
}));

import { PhotoSubmissionService } from '../photoSubmissionService.js';
import { ValidationError, NotFoundError, ConflictError } from '../../utils/customErrors.js';
import {
  dbPhotoSubmission,
  dbPhotoGalleryAlbum,
  dbCreatePhotoSubmissionInput,
  dbApprovePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoSubmissionWithRelations,
} from '../../repositories/types/dbTypes.js';
import { IPhotoSubmissionRepository } from '../../repositories/interfaces/IPhotoSubmissionRepository.js';
import type {
  ApprovePhotoSubmissionInputType,
  CreatePhotoSubmissionInputType,
  DenyPhotoSubmissionInputType,
} from '@draco/shared-schemas';

class PhotoSubmissionRepositoryMock implements IPhotoSubmissionRepository {
  createSubmissionMock =
    vi.fn<(data: dbCreatePhotoSubmissionInput) => Promise<dbPhotoSubmission>>();
  findSubmissionByIdMock = vi.fn<(submissionId: bigint) => Promise<dbPhotoSubmission | null>>();
  findSubmissionForAccountMock =
    vi.fn<(accountId: bigint, submissionId: bigint) => Promise<dbPhotoSubmission | null>>();
  findSubmissionWithRelationsMock =
    vi.fn<(submissionId: bigint) => Promise<dbPhotoSubmissionWithRelations | null>>();
  findPendingSubmissionsForAccountMock =
    vi.fn<(accountId: bigint) => Promise<dbPhotoSubmissionWithRelations[]>>();
  findPendingSubmissionsForTeamMock =
    vi.fn<(accountId: bigint, teamId: bigint) => Promise<dbPhotoSubmissionWithRelations[]>>();
  findAlbumForAccountMock =
    vi.fn<(accountId: bigint, albumId: bigint) => Promise<dbPhotoGalleryAlbum | null>>();
  approveSubmissionMock =
    vi.fn<
      (submissionId: bigint, data: dbApprovePhotoSubmissionInput) => Promise<dbPhotoSubmission>
    >();
  denySubmissionMock =
    vi.fn<(submissionId: bigint, data: dbDenyPhotoSubmissionInput) => Promise<dbPhotoSubmission>>();
  deleteSubmissionMock = vi.fn<(submissionId: bigint) => Promise<void>>();
  revertApprovalMock = vi.fn<(submissionId: bigint) => Promise<void>>();

  createSubmission(data: dbCreatePhotoSubmissionInput): Promise<dbPhotoSubmission> {
    return this.createSubmissionMock(data);
  }

  findSubmissionById(submissionId: bigint): Promise<dbPhotoSubmission | null> {
    return this.findSubmissionByIdMock(submissionId);
  }

  findSubmissionForAccount(
    accountId: bigint,
    submissionId: bigint,
  ): Promise<dbPhotoSubmission | null> {
    return this.findSubmissionForAccountMock(accountId, submissionId);
  }

  findSubmissionWithRelations(
    submissionId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations | null> {
    return this.findSubmissionWithRelationsMock(submissionId);
  }

  findPendingSubmissionsForAccount(accountId: bigint): Promise<dbPhotoSubmissionWithRelations[]> {
    return this.findPendingSubmissionsForAccountMock(accountId);
  }

  findPendingSubmissionsForTeam(
    accountId: bigint,
    teamId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations[]> {
    return this.findPendingSubmissionsForTeamMock(accountId, teamId);
  }

  findAlbumForAccount(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum | null> {
    return this.findAlbumForAccountMock(accountId, albumId);
  }

  approveSubmission(
    submissionId: bigint,
    data: dbApprovePhotoSubmissionInput,
  ): Promise<dbPhotoSubmission> {
    return this.approveSubmissionMock(submissionId, data);
  }

  denySubmission(
    submissionId: bigint,
    data: dbDenyPhotoSubmissionInput,
  ): Promise<dbPhotoSubmission> {
    return this.denySubmissionMock(submissionId, data);
  }

  deleteSubmission(submissionId: bigint): Promise<void> {
    return this.deleteSubmissionMock(submissionId);
  }

  revertApproval(submissionId: bigint): Promise<void> {
    return this.revertApprovalMock(submissionId);
  }
}

const createDbSubmission = (overrides: Partial<dbPhotoSubmission> = {}): dbPhotoSubmission => ({
  id: 10n,
  accountid: 1n,
  teamid: null,
  albumid: 2n,
  submittercontactid: 4n,
  moderatedbycontactid: null,
  approvedphotoid: null,
  title: 'Summer Tournament',
  caption: 'Winning shot',
  originalfilename: 'photo.jpg',
  originalfilepath: '1/photo-submissions/storage-key/original.jpg',
  primaryimagepath: '1/photo-submissions/storage-key/primary.jpg',
  thumbnailimagepath: '1/photo-submissions/storage-key/thumbnail.jpg',
  status: 'Pending',
  denialreason: null,
  submittedat: new Date('2024-01-01T00:00:00Z'),
  updatedat: new Date('2024-01-01T00:00:00Z'),
  moderatedat: null,
  ...overrides,
});

const createAlbum = (overrides: Partial<dbPhotoGalleryAlbum> = {}): dbPhotoGalleryAlbum => ({
  id: 2n,
  accountid: 1n,
  teamid: 0n,
  parentalbumid: 0n,
  title: 'Main Album',
  ...overrides,
});

const createSubmissionWithRelations = (
  overrides: Partial<dbPhotoSubmissionWithRelations> = {},
): dbPhotoSubmissionWithRelations => ({
  ...createDbSubmission(),
  accounts: { id: 1n, name: 'Example Account' },
  photogalleryalbum: { id: 2n, accountid: 1n, teamid: 0n, parentalbumid: 0n, title: 'Main Album' },
  photogallery: null,
  submitter: { id: 4n, firstname: 'Sam', lastname: 'Submitter', email: 'sam@example.com' },
  moderator: null,
  ...overrides,
});

describe('PhotoSubmissionService', () => {
  let repository: PhotoSubmissionRepositoryMock;
  let service: PhotoSubmissionService;

  beforeEach(() => {
    repository = new PhotoSubmissionRepositoryMock();
    service = new PhotoSubmissionService(repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseCreateInput: CreatePhotoSubmissionInputType = {
    accountId: '1',
    submitterContactId: '4',
    title: '  Summer Tournament  ',
    caption: '  Winning shot  ',
    albumId: '2',
    teamId: null,
    originalFileName: 'Photo.JPG',
  };

  it('creates a submission with generated storage paths', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum());

    const createdSubmission = createDbSubmission({
      originalfilepath: '1/photo-submissions/storage-key/original.jpg',
      primaryimagepath: '1/photo-submissions/storage-key/primary.jpg',
      thumbnailimagepath: '1/photo-submissions/storage-key/thumbnail.jpg',
    });

    repository.createSubmissionMock.mockResolvedValue(createdSubmission);

    const result = await service.createSubmission(baseCreateInput);

    expect(repository.findAlbumForAccountMock).toHaveBeenCalledWith(1n, 2n);
    expect(repository.createSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accountid: 1n,
        teamid: undefined,
        albumid: 2n,
        title: 'Summer Tournament',
        caption: 'Winning shot',
        originalfilename: 'Photo.JPG',
      }),
    );

    const [[createArgs]] = repository.createSubmissionMock.mock.calls;
    expect(createArgs.originalfilepath).toMatch(
      /^1\/photo-submissions\/[a-z0-9-]+\/original\.jpg$/,
    );

    expect(result.originalFilePath).toBe('1/photo-submissions/storage-key/original.jpg');
    expect(result.primaryImagePath).toBe('1/photo-submissions/storage-key/primary.jpg');
    expect(result.status).toBe('Pending');
    expect(result.caption).toBe('Winning shot');
  });

  it('propagates team id from album when creating submissions', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum({ teamid: 9n }));
    repository.createSubmissionMock.mockResolvedValue(createDbSubmission({ teamid: 9n }));

    const result = await service.createSubmission({ ...baseCreateInput, teamId: '9' });

    expect(repository.createSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ teamid: 9n }),
    );
    expect(result.teamId).toBe('9');
  });

  it('uses provided storage key when creating submissions', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum());
    repository.createSubmissionMock.mockResolvedValue(
      createDbSubmission({
        originalfilepath: '1/photo-submissions/custom-key/original.jpg',
        primaryimagepath: '1/photo-submissions/custom-key/primary.jpg',
        thumbnailimagepath: '1/photo-submissions/custom-key/thumbnail.jpg',
      }),
    );

    await service.createSubmission({ ...baseCreateInput, storageKey: 'custom-key' });

    const [[createArgs]] = repository.createSubmissionMock.mock.calls;
    expect(createArgs.originalfilepath).toBe('1/photo-submissions/custom-key/original.jpg');
  });

  it('throws when album does not exist for account', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(null);

    await expect(service.createSubmission(baseCreateInput)).rejects.toThrow(NotFoundError);
  });

  it('throws when file extension is not supported', async () => {
    const input: CreatePhotoSubmissionInputType = {
      ...baseCreateInput,
      originalFileName: 'photo.tiff',
    };

    await expect(service.createSubmission(input)).rejects.toThrow(ValidationError);
  });

  it('throws when account album is paired with a team id', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum({ teamid: 0n }));

    await expect(service.createSubmission({ ...baseCreateInput, teamId: '5' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('deletes pending submissions', async () => {
    const pending = createDbSubmission();
    repository.findSubmissionForAccountMock.mockResolvedValue(pending);

    await service.deleteSubmission(1n, pending.id);

    expect(repository.deleteSubmissionMock).toHaveBeenCalledWith(pending.id);
  });

  it('returns submission details with relations', async () => {
    const submissionWithRelations = createSubmissionWithRelations();
    repository.findSubmissionWithRelationsMock.mockResolvedValue(submissionWithRelations);

    const result = await service.getSubmissionDetail(1n, 10n);

    expect(result.accountName).toBe('Example Account');
    expect(result.album?.title).toBe('Main Album');
  });

  it('lists pending account submissions', async () => {
    repository.findPendingSubmissionsForAccountMock.mockResolvedValue([
      createSubmissionWithRelations(),
    ]);

    const results = await service.listPendingAccountSubmissions(1n);

    expect(results).toHaveLength(1);
    expect(repository.findPendingSubmissionsForAccountMock).toHaveBeenCalledWith(1n);
  });

  const baseApproveInput: ApprovePhotoSubmissionInputType = {
    accountId: '1',
    submissionId: '10',
    moderatorContactId: '3',
    approvedPhotoId: '20',
  };

  it('approves a pending submission', async () => {
    const pending = createDbSubmission();
    repository.findSubmissionForAccountMock.mockResolvedValue(pending);
    repository.approveSubmissionMock.mockResolvedValue(
      createDbSubmission({
        status: 'Approved',
        approvedphotoid: 20n,
        moderatedbycontactid: 3n,
        moderatedat: new Date('2024-01-02T00:00:00Z'),
      }),
    );

    const result = await service.approveSubmission(baseApproveInput);

    expect(repository.approveSubmissionMock).toHaveBeenCalled();
    const [, data] = repository.approveSubmissionMock.mock.calls[0];
    expect(data.moderatedbycontactid).toBe(3n);
    expect(data.approvedphotoid).toBe(20n);
    expect(data.moderatedat).toBeInstanceOf(Date);
    expect(data.updatedat).toBeInstanceOf(Date);
    expect(result.status).toBe('Approved');
    expect(result.approvedPhotoId).toBe('20');
  });

  it('rejects approval when submission is not pending', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(
      createDbSubmission({ status: 'Denied' }),
    );

    await expect(service.approveSubmission(baseApproveInput)).rejects.toThrow(ValidationError);
  });

  it('throws a conflict error when moderation races occur', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(createDbSubmission());
    repository.approveSubmissionMock.mockRejectedValue(
      new ConflictError('Photo submission has already been moderated'),
    );

    await expect(service.approveSubmission(baseApproveInput)).rejects.toThrow(ConflictError);
  });

  const baseDenyInput: DenyPhotoSubmissionInputType = {
    accountId: '1',
    submissionId: '10',
    moderatorContactId: '3',
    denialReason: '  Low quality image  ',
  };

  it('denies a pending submission with trimmed reason', async () => {
    const pending = createDbSubmission();
    repository.findSubmissionForAccountMock.mockResolvedValue(pending);
    repository.denySubmissionMock.mockResolvedValue(
      createDbSubmission({
        status: 'Denied',
        denialreason: 'Low quality image',
        moderatedbycontactid: 3n,
        moderatedat: new Date('2024-01-02T00:00:00Z'),
      }),
    );

    const result = await service.denySubmission(baseDenyInput);

    const [, data] = repository.denySubmissionMock.mock.calls[0];
    expect(data.denialreason).toBe('Low quality image');
    expect(result.status).toBe('Denied');
    expect(result.denialReason).toBe('Low quality image');
  });

  it('requires denial reason to be provided', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(createDbSubmission());

    await expect(service.denySubmission({ ...baseDenyInput, denialReason: '   ' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('retrieves a submission by account', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(createDbSubmission());

    const result = await service.getSubmission(1n, 10n);

    expect(result.id).toBe('10');
    expect(repository.findSubmissionForAccountMock).toHaveBeenCalledWith(1n, 10n);
  });
});
