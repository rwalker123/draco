import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountGalleryPhotosAdmin as apiListPhotos,
  createAccountGalleryPhoto as apiCreatePhoto,
  updateAccountGalleryPhoto as apiUpdatePhoto,
  deleteAccountGalleryPhoto as apiDeletePhoto,
  listAccountGalleryAlbumsAdmin as apiListAlbums,
  createAccountGalleryAlbum as apiCreateAlbum,
  updateAccountGalleryAlbum as apiUpdateAlbum,
  deleteAccountGalleryAlbum as apiDeleteAlbum,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import {
  listGalleryPhotosAdmin,
  createGalleryPhotoAdmin,
  updateGalleryPhotoAdmin,
  deleteGalleryPhotoAdmin,
  listGalleryAlbumsAdmin,
  createGalleryAlbumAdmin,
  updateGalleryAlbumAdmin,
  deleteGalleryAlbumAdmin,
} from '../photoGalleryAdminService';

vi.mock('@draco/shared-api-client', () => ({
  listAccountGalleryPhotosAdmin: vi.fn(),
  createAccountGalleryPhoto: vi.fn(),
  updateAccountGalleryPhoto: vi.fn(),
  deleteAccountGalleryPhoto: vi.fn(),
  listAccountGalleryAlbumsAdmin: vi.fn(),
  createAccountGalleryAlbum: vi.fn(),
  updateAccountGalleryAlbum: vi.fn(),
  deleteAccountGalleryAlbum: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

const ACCOUNT_ID = 'account-42';

const photoData = {
  id: 'photo-1',
  accountId: ACCOUNT_ID,
  title: 'Team Photo',
  caption: 'Season opener',
  albumId: null,
  url: 'https://cdn.example.com/photo.jpg',
  createdAt: '2025-01-01T00:00:00Z',
};

const albumData = {
  id: 'album-1',
  accountId: ACCOUNT_ID,
  name: 'Season 2025',
  description: 'All photos from 2025',
  createdAt: '2025-01-01T00:00:00Z',
};

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, status = 500) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as never;

describe('photoGalleryAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listGalleryPhotosAdmin', () => {
    it('returns the photos list from the API', async () => {
      const payload = { photos: [photoData], total: 1 };
      vi.mocked(apiListPhotos).mockResolvedValue(makeOk(payload));

      const result = await listGalleryPhotosAdmin(ACCOUNT_ID, 'token-123');

      expect(apiListPhotos).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: ACCOUNT_ID } }),
      );
      expect(result).toEqual(payload);
    });

    it('passes the AbortSignal to the API call', async () => {
      const payload = { photos: [], total: 0 };
      vi.mocked(apiListPhotos).mockResolvedValue(makeOk(payload));
      const controller = new AbortController();

      await listGalleryPhotosAdmin(ACCOUNT_ID, null, controller.signal);

      expect(apiListPhotos).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws when the API returns an error', async () => {
      vi.mocked(apiListPhotos).mockResolvedValue(makeError('Unauthorized', 401));

      await expect(listGalleryPhotosAdmin(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createGalleryPhotoAdmin', () => {
    it('creates a photo and returns the created record', async () => {
      vi.mocked(apiCreatePhoto).mockResolvedValue(makeOk(photoData));
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

      const result = await createGalleryPhotoAdmin(
        ACCOUNT_ID,
        { title: 'Team Photo', caption: 'Season opener', albumId: null, file },
        'token-123',
      );

      expect(apiCreatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: expect.objectContaining({ title: 'Team Photo', photo: file }),
        }),
      );
      expect(result).toEqual(photoData);
    });

    it('omits undefined caption from the request body', async () => {
      vi.mocked(apiCreatePhoto).mockResolvedValue(makeOk(photoData));
      const file = new Blob(['data']);

      await createGalleryPhotoAdmin(ACCOUNT_ID, { title: 'No caption', file });

      expect(apiCreatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ albumId: null }),
        }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(apiCreatePhoto).mockResolvedValue(makeError('Bad Request', 400));

      await expect(
        createGalleryPhotoAdmin(ACCOUNT_ID, { title: 'X', file: new Blob() }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateGalleryPhotoAdmin', () => {
    it('updates only the fields that are provided', async () => {
      const updated = { ...photoData, title: 'Updated Title' };
      vi.mocked(apiUpdatePhoto).mockResolvedValue(makeOk(updated));

      const result = await updateGalleryPhotoAdmin(ACCOUNT_ID, 'photo-1', {
        title: 'Updated Title',
      });

      expect(apiUpdatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, photoId: 'photo-1' },
          body: { title: 'Updated Title' },
        }),
      );
      expect(result.title).toBe('Updated Title');
    });

    it('includes caption and albumId when provided', async () => {
      vi.mocked(apiUpdatePhoto).mockResolvedValue(makeOk(photoData));

      await updateGalleryPhotoAdmin(ACCOUNT_ID, 'photo-1', {
        title: 'T',
        caption: 'New caption',
        albumId: 'album-2',
      });

      expect(apiUpdatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { title: 'T', caption: 'New caption', albumId: 'album-2' },
        }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(apiUpdatePhoto).mockResolvedValue(makeError('Not found', 404));

      await expect(updateGalleryPhotoAdmin(ACCOUNT_ID, 'photo-99', {})).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('deleteGalleryPhotoAdmin', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiDeletePhoto).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(deleteGalleryPhotoAdmin(ACCOUNT_ID, 'photo-1')).resolves.toBeUndefined();

      expect(apiDeletePhoto).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: ACCOUNT_ID, photoId: 'photo-1' } }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(apiDeletePhoto).mockResolvedValue(makeError('Forbidden', 403));

      await expect(deleteGalleryPhotoAdmin(ACCOUNT_ID, 'photo-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('listGalleryAlbumsAdmin', () => {
    it('returns the albums list', async () => {
      const payload = { albums: [albumData] };
      vi.mocked(apiListAlbums).mockResolvedValue(makeOk(payload));

      const result = await listGalleryAlbumsAdmin(ACCOUNT_ID, 'token-123');

      expect(apiListAlbums).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: ACCOUNT_ID } }),
      );
      expect(result).toEqual(payload);
    });

    it('passes the AbortSignal through', async () => {
      vi.mocked(apiListAlbums).mockResolvedValue(makeOk({ albums: [] }));
      const controller = new AbortController();

      await listGalleryAlbumsAdmin(ACCOUNT_ID, null, controller.signal);

      expect(apiListAlbums).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(apiListAlbums).mockResolvedValue(makeError('Server Error', 500));

      await expect(listGalleryAlbumsAdmin(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createGalleryAlbumAdmin', () => {
    it('creates an album and returns the created record', async () => {
      vi.mocked(apiCreateAlbum).mockResolvedValue(makeOk(albumData));

      const result = await createGalleryAlbumAdmin(
        ACCOUNT_ID,
        { name: 'Season 2025', description: 'All photos from 2025' } as never,
        'token-123',
      );

      expect(apiCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: { name: 'Season 2025', description: 'All photos from 2025' },
        }),
      );
      expect(result).toEqual(albumData);
    });

    it('throws on API error', async () => {
      vi.mocked(apiCreateAlbum).mockResolvedValue(makeError('Conflict', 409));

      await expect(
        createGalleryAlbumAdmin(ACCOUNT_ID, { name: 'Dup' } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateGalleryAlbumAdmin', () => {
    it('updates an album and returns the updated record', async () => {
      const updated = { ...albumData, name: 'Renamed Album' };
      vi.mocked(apiUpdateAlbum).mockResolvedValue(makeOk(updated));

      const result = await updateGalleryAlbumAdmin(ACCOUNT_ID, 'album-1', {
        name: 'Renamed Album',
      } as never);

      expect(apiUpdateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, albumId: 'album-1' },
          body: { name: 'Renamed Album' },
        }),
      );
      expect((result as Record<string, unknown>).name).toBe('Renamed Album');
    });

    it('throws on API error', async () => {
      vi.mocked(apiUpdateAlbum).mockResolvedValue(makeError('Not found', 404));

      await expect(
        updateGalleryAlbumAdmin(ACCOUNT_ID, 'album-99', { name: 'X' } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteGalleryAlbumAdmin', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiDeleteAlbum).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(deleteGalleryAlbumAdmin(ACCOUNT_ID, 'album-1')).resolves.toBeUndefined();

      expect(apiDeleteAlbum).toHaveBeenCalledWith(
        expect.objectContaining({ path: { accountId: ACCOUNT_ID, albumId: 'album-1' } }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(apiDeleteAlbum).mockResolvedValue(makeError('Forbidden', 403));

      await expect(deleteGalleryAlbumAdmin(ACCOUNT_ID, 'album-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
