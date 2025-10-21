import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { PhotoGalleryListType } from '@draco/shared-schemas';
import type {
  GalleryQueryOptions,
  IPhotoGalleryReadRepository,
} from '../repositories/interfaces/index.js';
import { PhotoGalleryResponseFormatter } from '../responseFormatters/photoGalleryResponseFormatter.js';

export class PhotoGalleryService {
  constructor(
    private readonly repository: IPhotoGalleryReadRepository = RepositoryFactory.getPhotoGalleryReadRepository(),
  ) {}

  async listGalleryEntries(options: GalleryQueryOptions): Promise<PhotoGalleryListType> {
    const entries = await this.repository.listGalleryEntries(options);
    return PhotoGalleryResponseFormatter.formatAccountGallery(entries);
  }
}
