import { dbCreatePhotoGalleryInput, dbPhotoGallery } from '../types/dbTypes.js';

export interface IPhotoGalleryRepository {
  createPhoto(data: dbCreatePhotoGalleryInput): Promise<dbPhotoGallery>;
  countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number>;
  deletePhoto(photoId: bigint): Promise<void>;
}
