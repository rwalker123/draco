import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IPhotoGalleryRepository } from '../repositories/interfaces/index.js';
import type { dbPhotoGallery } from '../repositories/types/dbTypes.js';

interface CreatePhotoParams {
  accountId: bigint;
  albumId: bigint | null;
  title: string;
  caption?: string | null;
}

export class PhotoGalleryService {
  constructor(
    private readonly repository: IPhotoGalleryRepository = RepositoryFactory.getPhotoGalleryRepository(),
  ) {}

  async countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number> {
    return this.repository.countPhotosInAlbum(accountId, albumId ?? null);
  }

  async createPhoto(params: CreatePhotoParams): Promise<dbPhotoGallery> {
    const caption = params.caption?.trim() ?? '';

    return this.repository.createPhoto({
      accountid: params.accountId,
      albumid: params.albumId ?? null,
      title: params.title,
      caption,
    });
  }

  async deletePhoto(photoId: bigint): Promise<void> {
    await this.repository.deletePhoto(photoId);
  }
}
