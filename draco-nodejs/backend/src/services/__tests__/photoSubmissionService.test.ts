import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@draco/shared-schemas', () => ({}));
vi.mock('../../utils/customErrors.js', () => {
  class ValidationError extends Error {}
  class NotFoundError extends Error {}
  return { ValidationError, NotFoundError };
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
import { ValidationError, NotFoundError } from '../../utils/customErrors.js';
import {
  dbPhotoSubmission,
  dbPhotoGalleryAlbum,
  dbCreatePhotoSubmissionInput,
  dbApprovePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoSubmissionWithRelations,
} from '../../repositories/types/dbTypes.js';
import { IPhotoSubmissionRepository } from '../../repositories/interfaces/IPhotoSubmissionRepository.js';
import {
  ApprovePhotoSubmissionInput,
  CreatePhotoSubmissionInput,
  DenyPhotoSubmissionInput,
} from '../../types/photoSubmissions.js';

class PhotoSubmissionRepositoryMock implements IPhotoSubmissionRepository {
  createSubmissionMock = vi.fn<[dbCreatePhotoSubmissionInput], Promise<dbPhotoSubmission>>();
  findSubmissionByIdMock = vi.fn<[bigint], Promise<dbPhotoSubmission | null>>();
  findSubmissionForAccountMock = vi.fn<[bigint, bigint], Promise<dbPhotoSubmission | null>>();
  findSubmissionWithRelationsMock = vi.fn<
    [bigint],
    Promise<dbPhotoSubmissionWithRelations | null>
  >();
  findAlbumForAccountMock = vi.fn<[bigint, bigint], Promise<dbPhotoGalleryAlbum | null>>();
  approveSubmissionMock = vi.fn<
    [bigint, dbApprovePhotoSubmissionInput],
    Promise<dbPhotoSubmission>
  >();
  denySubmissionMock = vi.fn<[bigint, dbDenyPhotoSubmissionInput], Promise<dbPhotoSubmission>>();

  createSubmission(data: dbCreatePhotoSubmissionInput): Promise<dbPhotoSubmission> {
    return this.createSubmissionMock(data);
  }

  findSubmissionById(submissionId: bigint): Promise<dbPhotoSubmission | null> {
    return this.findSubmissionByIdMock(submissionId);
  }

  findSubmissionForAccount(accountId: bigint, submissionId: bigint): Promise<dbPhotoSubmission | null> {
    return this.findSubmissionForAccountMock(accountId, submissionId);
  }

  findSubmissionWithRelations(
    submissionId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations | null> {
    return this.findSubmissionWithRelationsMock(submissionId);
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

  denySubmission(submissionId: bigint, data: dbDenyPhotoSubmissionInput): Promise<dbPhotoSubmission> {
    return this.denySubmissionMock(submissionId, data);
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
  originalfilepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/original.jpg',
  primaryimagepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/primary.jpg',
  thumbnailimagepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/thumbnail.jpg',
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

  const baseCreateInput: CreatePhotoSubmissionInput = {
    accountId: 1n,
    submitterContactId: 4n,
    title: '  Summer Tournament  ',
    caption: '  Winning shot  ',
    albumId: 2n,
    teamId: null,
    originalFileName: 'Photo.JPG',
  };

  it('creates a submission with generated storage paths', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum());

    const createdSubmission = createDbSubmission({
      originalfilepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/original.jpg',
      primaryimagepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/primary.jpg',
      thumbnailimagepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/thumbnail.jpg',
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
        originalfilepath: 'Uploads/Accounts/1/PhotoSubmissions/storage-key/original.jpg',
      }),
    );

    expect(result.originalFilePath).toBe(
      'Uploads/Accounts/1/PhotoSubmissions/storage-key/original.jpg',
    );
    expect(result.primaryImagePath).toBe(
      'Uploads/Accounts/1/PhotoSubmissions/storage-key/primary.jpg',
    );
    expect(result.status).toBe('Pending');
    expect(result.caption).toBe('Winning shot');
  });

  it('propagates team id from album when creating submissions', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum({ teamid: 9n }));
    repository.createSubmissionMock.mockResolvedValue(
      createDbSubmission({ teamid: 9n }),
    );

    const result = await service.createSubmission({ ...baseCreateInput, teamId: 9n });

    expect(repository.createSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ teamid: 9n }),
    );
    expect(result.teamId).toBe(9n);
  });

  it('throws when album does not exist for account', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(null);

    await expect(service.createSubmission(baseCreateInput)).rejects.toThrow(NotFoundError);
  });

  it('throws when file extension is not supported', async () => {
    const input: CreatePhotoSubmissionInput = {
      ...baseCreateInput,
      originalFileName: 'photo.tiff',
    };

    await expect(service.createSubmission(input)).rejects.toThrow(ValidationError);
  });

  it('throws when account album is paired with a team id', async () => {
    repository.findAlbumForAccountMock.mockResolvedValue(createAlbum({ teamid: 0n }));

    await expect(service.createSubmission({ ...baseCreateInput, teamId: 5n })).rejects.toThrow(
      ValidationError,
    );
  });

  const baseApproveInput: ApprovePhotoSubmissionInput = {
    accountId: 1n,
    submissionId: 10n,
    moderatorContactId: 3n,
    approvedPhotoId: 20n,
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
    expect(result.approvedPhotoId).toBe(20n);
  });

  it('rejects approval when submission is not pending', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(
      createDbSubmission({ status: 'Denied' }),
    );

    await expect(service.approveSubmission(baseApproveInput)).rejects.toThrow(ValidationError);
  });

  const baseDenyInput: DenyPhotoSubmissionInput = {
    accountId: 1n,
    submissionId: 10n,
    moderatorContactId: 3n,
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

    await expect(
      service.denySubmission({ ...baseDenyInput, denialReason: '   ' }),
    ).rejects.toThrow(ValidationError);
  });

  it('retrieves a submission by account', async () => {
    repository.findSubmissionForAccountMock.mockResolvedValue(createDbSubmission());

    const result = await service.getSubmission(1n, 10n);

    expect(result.id).toBe(10n);
    expect(repository.findSubmissionForAccountMock).toHaveBeenCalledWith(1n, 10n);
  });
});
