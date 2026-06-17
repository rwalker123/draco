import sharp from 'sharp';
import { buildGalleryAssetPaths } from '../utils/photoSubmissionPaths.js';
import { contentTypeForKey } from '../utils/mimeTypes.js';
import { ServiceFactory } from './serviceFactory.js';
import type { StorageService } from './baseStorageService.js';

const PRIMARY_DIMENSIONS = { width: 800, height: 450 } as const;
const THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;
const GALLERY_EXTENSION = '.jpg';

const toJpeg = async (
  buffer: Buffer,
  dimensions?: { width: number; height: number },
  options: { withoutEnlargement?: boolean } = {},
): Promise<Buffer> => {
  let image = sharp(buffer);

  if (dimensions) {
    image = image.resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: options.withoutEnlargement ?? false,
    });
  }

  return image.jpeg({ quality: 90 }).toBuffer();
};

export class PhotoGalleryAssetService {
  constructor(private readonly storage: StorageService = ServiceFactory.getStorageService()) {}

  async saveGalleryAssets(accountId: bigint, photoId: bigint, buffer: Buffer): Promise<void> {
    const galleryPaths = buildGalleryAssetPaths(accountId, photoId, GALLERY_EXTENSION);

    try {
      const primary = await toJpeg(buffer, PRIMARY_DIMENSIONS, { withoutEnlargement: true });
      const thumbnail = await toJpeg(buffer, THUMBNAIL_DIMENSIONS);

      await this.storage.saveObject(
        galleryPaths.primaryImagePath,
        primary,
        contentTypeForKey(galleryPaths.primaryImagePath),
      );
      await this.storage.saveObject(
        galleryPaths.thumbnailImagePath,
        thumbnail,
        contentTypeForKey(galleryPaths.thumbnailImagePath),
      );
    } catch (error) {
      await this.deleteGalleryAssets(accountId, photoId).catch(() => undefined);
      throw error;
    }
  }

  async deleteGalleryAssets(accountId: bigint, photoId: bigint): Promise<void> {
    const galleryPaths = buildGalleryAssetPaths(accountId, photoId, GALLERY_EXTENSION);

    await this.storage.deleteObject(galleryPaths.primaryImagePath);
    await this.storage.deleteObject(galleryPaths.thumbnailImagePath);
  }
}
