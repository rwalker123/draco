import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoGalleryAdminService } from '../photoGalleryAdminService.js';

const createGalleryEntry = (overrides: Partial<unknown> = {}) => ({
  id: 25n,
  accountid: 1n,
  albumid: 2n,
  title: 'Summer Tournament',
  caption: 'Caption',
  photogalleryalbum: {
    id: 2n,
    title: 'Main Album',
    teamid: 0n,
  },
  photogallerysubmission: [],
  ...overrides,
});

const createAlbum = (overrides: Partial<unknown> = {}) => ({
  id: 2n,
  accountid: 1n,
  title: 'Main Album',
  teamid: 0n,
  parentalbumid: 0n,
  _count: { photogallery: 0 },
  ...overrides,
});

describe('PhotoGalleryAdminService', () => {
  const repository = {
    listGalleryEntries: vi.fn(),
    createPhoto: vi.fn(),
    updatePhoto: vi.fn(),
    deletePhoto: vi.fn(),
    countPhotosInAlbum: vi.fn(),
    findPhotoById: vi.fn(),
    listAlbums: vi.fn(),
    createAlbum: vi.fn(),
    updateAlbum: vi.fn(),
    deleteAlbum: vi.fn(),
    findAlbumById: vi.fn(),
    findAlbumByTitle: vi.fn(),
    countChildAlbums: vi.fn(),
  };

  const assetService = {
    saveGalleryAssets: vi.fn(),
    deleteGalleryAssets: vi.fn(),
  };

  const instagramIntegrationService = {
    uploadPhotoFromGallery: vi.fn(),
  };

  const teamRepository = {
    findTeamDefinition: vi.fn(),
    findLatestTeamSeasonName: vi.fn(),
  };

  let service: PhotoGalleryAdminService;

  beforeEach(() => {
    vi.resetAllMocks();
    instagramIntegrationService.uploadPhotoFromGallery.mockResolvedValue(undefined);
    service = new PhotoGalleryAdminService(
      repository as never,
      assetService as never,
      instagramIntegrationService as never,
      teamRepository as never,
    );
  });

  it('creates a gallery photo and saves assets', async () => {
    repository.findAlbumById.mockResolvedValue(createAlbum());
    repository.countPhotosInAlbum.mockResolvedValue(0);
    repository.createPhoto.mockResolvedValue({
      id: 25n,
      accountid: 1n,
      albumid: 2n,
      title: 'Summer Tournament',
      caption: 'Caption',
    });
    repository.findPhotoById
      .mockResolvedValueOnce(createGalleryEntry())
      .mockResolvedValueOnce(createGalleryEntry());
    assetService.saveGalleryAssets.mockResolvedValue(undefined);

    const buffer = Buffer.from('image-bytes');

    const result = await service.createPhoto(
      1n,
      { title: 'Summer Tournament', caption: ' Caption ', albumId: '2' },
      buffer,
    );

    expect(repository.countPhotosInAlbum).toHaveBeenCalledWith(1n, 2n);
    expect(repository.createPhoto).toHaveBeenCalledWith({
      accountid: 1n,
      albumid: 2n,
      title: 'Summer Tournament',
      caption: 'Caption',
    });
    expect(assetService.saveGalleryAssets).toHaveBeenCalledWith(1n, 25n, buffer);
    expect(result.id).toBe('25');
  });

  it('throws when album capacity is exceeded on create', async () => {
    repository.findAlbumById.mockResolvedValue(createAlbum());
    repository.countPhotosInAlbum.mockResolvedValue(100);

    await expect(
      service.createPhoto(1n, { title: 'New Photo', albumId: '2' }, Buffer.from('file')),
    ).rejects.toThrow('Album has reached the maximum number of photos');

    expect(repository.createPhoto).not.toHaveBeenCalled();
  });

  it('updates gallery photo metadata and enforces album capacity', async () => {
    repository.findPhotoById
      .mockResolvedValueOnce(createGalleryEntry())
      .mockResolvedValueOnce(createGalleryEntry({ albumid: 3n }));
    repository.findAlbumById.mockResolvedValue(createAlbum({ id: 3n }));
    repository.countPhotosInAlbum.mockResolvedValue(2);
    repository.updatePhoto.mockResolvedValue({
      id: 25n,
      accountid: 1n,
      albumid: 3n,
      title: 'Updated',
      caption: 'Caption',
    });

    const result = await service.updatePhoto(1n, 25n, { albumId: '3', title: 'Updated' });

    expect(repository.countPhotosInAlbum).toHaveBeenCalledWith(1n, 3n);
    expect(repository.updatePhoto).toHaveBeenCalledWith(25n, {
      albumid: 3n,
      title: 'Updated',
    });
    expect(result.albumId).toBe('3');
  });

  it('deletes gallery photo and assets', async () => {
    repository.findPhotoById
      .mockResolvedValueOnce(createGalleryEntry())
      .mockResolvedValueOnce(createGalleryEntry());
    repository.deletePhoto.mockResolvedValue(undefined);
    assetService.deleteGalleryAssets.mockResolvedValue(undefined);

    await service.deletePhoto(1n, 25n);

    expect(repository.deletePhoto).toHaveBeenCalledWith(25n);
    expect(assetService.deleteGalleryAssets).toHaveBeenCalledWith(1n, 25n);
  });

  it('creates albums and enforces unique titles', async () => {
    repository.findAlbumByTitle.mockResolvedValue(null);
    repository.createAlbum.mockResolvedValue({
      ...createAlbum({ title: 'Fresh Album' }),
      _count: { photogallery: 0 },
    });

    const result = await service.createAlbum(1n, {
      title: 'Fresh Album',
      teamId: null,
      parentAlbumId: null,
    });

    expect(repository.createAlbum).toHaveBeenCalledWith({
      accountid: 1n,
      title: 'Fresh Album',
      teamid: 0n,
      parentalbumid: 0n,
    });
    expect(result.title).toBe('Fresh Album');
  });

  it('prevents deleting albums that contain photos', async () => {
    repository.findAlbumById.mockResolvedValue(createAlbum());
    repository.countPhotosInAlbum.mockResolvedValue(2);
    repository.countChildAlbums.mockResolvedValue(0);

    await expect(service.deleteAlbum(1n, 2n)).rejects.toThrow(
      'Album cannot be deleted while it contains photos',
    );

    expect(repository.deleteAlbum).not.toHaveBeenCalled();
  });

  describe('team-scoped operations', () => {
    const accountId = 1n;
    const teamId = 42n;

    const teamAlbumRow = createAlbum({ id: 7n, teamid: teamId, title: 'Eagles' });
    const teamPhotoEntry = createGalleryEntry({
      id: 100n,
      albumid: 7n,
      photogalleryalbum: { id: 7n, title: 'Eagles', teamid: teamId },
    });

    it('auto-creates the team album from the latest season name when none exists', async () => {
      repository.listAlbums.mockResolvedValue([
        createAlbum({ id: 5n, teamid: 99n, title: 'Other Team' }),
      ]);
      teamRepository.findTeamDefinition.mockResolvedValue({ id: teamId, accountid: accountId });
      teamRepository.findLatestTeamSeasonName.mockResolvedValue('Eagles');
      repository.createAlbum.mockResolvedValue({
        ...teamAlbumRow,
        _count: { photogallery: 0 },
      });
      repository.countPhotosInAlbum.mockResolvedValue(0);
      repository.findAlbumById.mockResolvedValue(teamAlbumRow);
      repository.createPhoto.mockResolvedValue({
        id: 100n,
        accountid: accountId,
        albumid: 7n,
        title: 'Trophy',
        caption: '',
      });
      repository.findPhotoById
        .mockResolvedValueOnce(teamPhotoEntry)
        .mockResolvedValueOnce(teamPhotoEntry);
      assetService.saveGalleryAssets.mockResolvedValue(undefined);

      await service.createTeamPhoto(
        accountId,
        teamId,
        { title: 'Trophy', caption: '' },
        Buffer.from('img'),
      );

      expect(teamRepository.findTeamDefinition).toHaveBeenCalledWith(teamId);
      expect(teamRepository.findLatestTeamSeasonName).toHaveBeenCalledWith(teamId);
      expect(repository.createAlbum).toHaveBeenCalledWith({
        accountid: accountId,
        title: 'Eagles',
        teamid: teamId,
        parentalbumid: 0n,
      });
      expect(repository.createPhoto).toHaveBeenCalledWith({
        accountid: accountId,
        albumid: 7n,
        title: 'Trophy',
        caption: '',
      });
    });

    it('reuses the existing team album on subsequent uploads', async () => {
      repository.listAlbums.mockResolvedValue([teamAlbumRow]);
      repository.countPhotosInAlbum.mockResolvedValue(0);
      repository.findAlbumById.mockResolvedValue(teamAlbumRow);
      repository.createPhoto.mockResolvedValue({
        id: 101n,
        accountid: accountId,
        albumid: 7n,
        title: 'Banner',
        caption: '',
      });
      repository.findPhotoById
        .mockResolvedValueOnce(teamPhotoEntry)
        .mockResolvedValueOnce(teamPhotoEntry);
      assetService.saveGalleryAssets.mockResolvedValue(undefined);

      await service.createTeamPhoto(accountId, teamId, { title: 'Banner' }, Buffer.from('img'));

      expect(repository.createAlbum).not.toHaveBeenCalled();
      expect(teamRepository.findTeamDefinition).not.toHaveBeenCalled();
      expect(repository.createPhoto).toHaveBeenCalledWith(expect.objectContaining({ albumid: 7n }));
    });

    it('disambiguates the auto-created album title when another album already uses it', async () => {
      repository.listAlbums.mockResolvedValue([
        createAlbum({ id: 9n, teamid: 99n, title: 'Eagles' }),
      ]);
      teamRepository.findTeamDefinition.mockResolvedValue({ id: teamId, accountid: accountId });
      teamRepository.findLatestTeamSeasonName.mockResolvedValue('Eagles');
      repository.createAlbum.mockImplementation(async (data) => ({
        id: 7n,
        accountid: data.accountid,
        title: data.title,
        teamid: data.teamid,
        parentalbumid: data.parentalbumid,
        _count: { photogallery: 0 },
      }));
      repository.countPhotosInAlbum.mockResolvedValue(0);
      repository.findAlbumById.mockResolvedValue(teamAlbumRow);
      repository.createPhoto.mockResolvedValue({
        id: 100n,
        accountid: accountId,
        albumid: 7n,
        title: 'Photo',
        caption: '',
      });
      repository.findPhotoById
        .mockResolvedValueOnce(teamPhotoEntry)
        .mockResolvedValueOnce(teamPhotoEntry);
      assetService.saveGalleryAssets.mockResolvedValue(undefined);

      await service.createTeamPhoto(accountId, teamId, { title: 'Photo' }, Buffer.from('img'));

      const createCall = repository.createAlbum.mock.calls[0][0];
      expect(createCall.title).toBe(`Eagles (#${teamId.toString()})`);
      expect(createCall.title.length).toBeLessThanOrEqual(25);
    });

    it('rejects when the team does not belong to the account', async () => {
      repository.listAlbums.mockResolvedValue([]);
      teamRepository.findTeamDefinition.mockResolvedValue({ id: teamId, accountid: 999n });

      await expect(
        service.createTeamPhoto(accountId, teamId, { title: 'X' }, Buffer.from('img')),
      ).rejects.toThrow('Team not found');

      expect(repository.createAlbum).not.toHaveBeenCalled();
      expect(repository.createPhoto).not.toHaveBeenCalled();
    });

    it('updateTeamPhoto strips albumId from the payload', async () => {
      repository.findPhotoById.mockResolvedValue(teamPhotoEntry);
      repository.updatePhoto.mockResolvedValue({
        id: 100n,
        accountid: accountId,
        albumid: 7n,
        title: 'Renamed',
        caption: 'updated',
      });

      await service.updateTeamPhoto(accountId, teamId, 100n, {
        title: 'Renamed',
        caption: 'updated',
        albumId: '999',
      });

      expect(repository.updatePhoto).toHaveBeenCalledWith(100n, {
        title: 'Renamed',
        caption: 'updated',
      });
      const updatePayload = repository.updatePhoto.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('albumid');
    });

    it('updateTeamPhoto rejects photos that do not belong to the team', async () => {
      const otherTeamPhoto = createGalleryEntry({
        id: 200n,
        albumid: 99n,
        photogalleryalbum: { id: 99n, title: 'Other', teamid: 555n },
      });
      repository.findPhotoById.mockResolvedValue(otherTeamPhoto);

      await expect(
        service.updateTeamPhoto(accountId, teamId, 200n, { title: 'X' }),
      ).rejects.toThrow('Gallery photo not found');

      expect(repository.updatePhoto).not.toHaveBeenCalled();
    });

    it('deleteTeamPhoto enforces team ownership', async () => {
      const otherTeamPhoto = createGalleryEntry({
        id: 200n,
        albumid: 99n,
        photogalleryalbum: { id: 99n, title: 'Other', teamid: 555n },
      });
      repository.findPhotoById.mockResolvedValue(otherTeamPhoto);

      await expect(service.deleteTeamPhoto(accountId, teamId, 200n)).rejects.toThrow(
        'Gallery photo not found',
      );

      expect(repository.deletePhoto).not.toHaveBeenCalled();
    });

    it('listTeamAlbums filters to the requested team', async () => {
      repository.listAlbums.mockResolvedValue([
        createAlbum({ id: 7n, teamid: teamId, title: 'Eagles' }),
        createAlbum({ id: 8n, teamid: 99n, title: 'Other' }),
        createAlbum({ id: 9n, teamid: 0n, title: 'Account Album' }),
      ]);

      const result = await service.listTeamAlbums(accountId, teamId);

      expect(result.albums).toHaveLength(1);
      expect(result.albums[0].id).toBe('7');
    });

    it('createTeamAlbum bypasses the account-level uniqueness check and disambiguates', async () => {
      teamRepository.findTeamDefinition.mockResolvedValue({ id: teamId, accountid: accountId });
      repository.listAlbums.mockResolvedValue([
        createAlbum({ id: 9n, teamid: 99n, title: 'Eagles' }),
      ]);
      repository.createAlbum.mockImplementation(async (data) => ({
        id: 7n,
        accountid: data.accountid,
        title: data.title,
        teamid: data.teamid,
        parentalbumid: data.parentalbumid,
        _count: { photogallery: 0 },
      }));

      const result = await service.createTeamAlbum(accountId, teamId, {
        title: 'Eagles',
        teamId: teamId.toString(),
        parentAlbumId: null,
      });

      expect(repository.findAlbumByTitle).not.toHaveBeenCalled();
      expect(repository.createAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          accountid: accountId,
          teamid: teamId,
          title: `Eagles (#${teamId.toString()})`,
        }),
      );
      expect(result.title).toBe(`Eagles (#${teamId.toString()})`);
    });

    it('createTeamAlbum rejects when the team does not belong to the account', async () => {
      teamRepository.findTeamDefinition.mockResolvedValue({ id: teamId, accountid: 999n });

      await expect(
        service.createTeamAlbum(accountId, teamId, {
          title: 'Eagles',
          teamId: teamId.toString(),
          parentAlbumId: null,
        }),
      ).rejects.toThrow('Team not found');

      expect(repository.createAlbum).not.toHaveBeenCalled();
    });

    it('updateTeamAlbum rejects reassigning the album to a different team', async () => {
      repository.findAlbumById.mockResolvedValue(teamAlbumRow);

      await expect(
        service.updateTeamAlbum(accountId, teamId, 7n, {
          title: 'Renamed',
          teamId: '999',
        }),
      ).rejects.toThrow('Team albums cannot be reassigned to a different team');

      expect(repository.updateAlbum).not.toHaveBeenCalled();
    });

    it('deleteTeamAlbum rejects albums that do not belong to the team', async () => {
      repository.findAlbumById.mockResolvedValue(
        createAlbum({ id: 7n, teamid: 555n, title: 'Other' }),
      );

      await expect(service.deleteTeamAlbum(accountId, teamId, 7n)).rejects.toThrow(
        'Photo album not found',
      );

      expect(repository.deleteAlbum).not.toHaveBeenCalled();
    });
  });
});
