import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IPhotoGalleryModerationRepository } from '../repositories/interfaces/IPhotoGalleryRepository.js';
import type { dbPhotoGallery } from '../repositories/types/dbTypes.js';

interface CreateApprovedPhotoParams {
  accountId: bigint;
  albumId: bigint | null;
  title: string;
  caption?: string | null;
}

export class PhotoGalleryApprovalService {
  constructor(
    private readonly repository: IPhotoGalleryModerationRepository = RepositoryFactory.getPhotoGalleryModerationRepository(),
  ) {}

  async countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number> {
    return this.repository.countPhotosInAlbum(accountId, albumId ?? null);
  }

  async createPhoto(params: CreateApprovedPhotoParams): Promise<dbPhotoGallery> {
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
