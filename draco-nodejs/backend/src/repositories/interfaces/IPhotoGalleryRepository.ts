import {
  dbCreatePhotoGalleryInput,
  dbPhotoGallery,
  dbPhotoGalleryEntry,
} from '../types/dbTypes.js';

export interface GalleryQueryOptions {
  accountId: bigint;
  albumId?: bigint | null;
  teamId?: bigint | null;
}

export interface IPhotoGalleryRepository {
  createPhoto(data: dbCreatePhotoGalleryInput): Promise<dbPhotoGallery>;
  countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number>;
  deletePhoto(photoId: bigint): Promise<void>;
  listGalleryEntries(options: GalleryQueryOptions): Promise<dbPhotoGalleryEntry[]>;
}
