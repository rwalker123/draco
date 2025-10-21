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

  let service: PhotoGalleryAdminService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PhotoGalleryAdminService(repository as never, assetService as never);
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
});
