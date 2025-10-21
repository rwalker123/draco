import {
  dbCreatePhotoGalleryAlbumInput,
  dbCreatePhotoGalleryInput,
  dbPhotoGallery,
  dbPhotoGalleryAlbum,
  dbPhotoGalleryAlbumWithCount,
  dbPhotoGalleryEntry,
  dbUpdatePhotoGalleryAlbumInput,
  dbUpdatePhotoGalleryInput,
} from '../types/dbTypes.js';

export interface GalleryQueryOptions {
  accountId: bigint;
  albumId?: bigint | null;
  teamId?: bigint | null;
}

export interface IPhotoGalleryReadRepository {
  listGalleryEntries(options: GalleryQueryOptions): Promise<dbPhotoGalleryEntry[]>;
}

export interface IPhotoGalleryModerationRepository extends IPhotoGalleryReadRepository {
  createPhoto(data: dbCreatePhotoGalleryInput): Promise<dbPhotoGallery>;
  countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number>;
  deletePhoto(photoId: bigint): Promise<void>;
}

export interface IPhotoGalleryAdminRepository extends IPhotoGalleryModerationRepository {
  updatePhoto(photoId: bigint, data: dbUpdatePhotoGalleryInput): Promise<dbPhotoGallery>;
  findPhotoById(accountId: bigint, photoId: bigint): Promise<dbPhotoGalleryEntry | null>;
  listAlbums(accountId: bigint): Promise<dbPhotoGalleryAlbumWithCount[]>;
  createAlbum(data: dbCreatePhotoGalleryAlbumInput): Promise<dbPhotoGalleryAlbumWithCount>;
  updateAlbum(
    albumId: bigint,
    data: dbUpdatePhotoGalleryAlbumInput,
  ): Promise<dbPhotoGalleryAlbumWithCount>;
  deleteAlbum(albumId: bigint): Promise<void>;
  findAlbumById(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum | null>;
  findAlbumByTitle(accountId: bigint, title: string): Promise<dbPhotoGalleryAlbum | null>;
  countChildAlbums(accountId: bigint, parentAlbumId: bigint): Promise<number>;
}
