import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { PhotoGalleryListType } from '@draco/shared-schemas';
import type {
  GalleryQueryOptions,
  IPhotoGalleryRepository,
} from '../repositories/interfaces/index.js';
import type { dbPhotoGallery } from '../repositories/types/dbTypes.js';
import { PhotoGalleryResponseFormatter } from '../responseFormatters/photoGalleryResponseFormatter.js';

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

  async listGalleryEntries(options: GalleryQueryOptions): Promise<PhotoGalleryListType> {
    const entries = await this.repository.listGalleryEntries(options);
    return PhotoGalleryResponseFormatter.formatAccountGallery(entries);
  }
}
