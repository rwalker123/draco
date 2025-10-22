import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  buildGalleryAssetPaths,
  resolveGalleryAssetAbsolutePath,
} from '../utils/photoSubmissionPaths.js';

const PRIMARY_DIMENSIONS = { width: 800, height: 450 } as const;
const THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;
const GALLERY_EXTENSION = '.jpg';

const ensureDirectory = async (targetPath: string): Promise<void> => {
  await fs.mkdir(targetPath, { recursive: true });
};

const writeJpeg = async (
  buffer: Buffer,
  destination: string,
  dimensions?: { width: number; height: number },
  options: { withoutEnlargement?: boolean } = {},
): Promise<void> => {
  let image = sharp(buffer);

  if (dimensions) {
    image = image.resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: options.withoutEnlargement ?? false,
    });
  }

  await ensureDirectory(path.dirname(destination));
  await image.jpeg({ quality: 90 }).toFile(destination);
};

export class PhotoGalleryAssetService {
  async saveGalleryAssets(accountId: bigint, photoId: bigint, buffer: Buffer): Promise<void> {
    const galleryPaths = buildGalleryAssetPaths(accountId, photoId, GALLERY_EXTENSION);

    const originalPath = resolveGalleryAssetAbsolutePath(galleryPaths.originalFilePath);
    const primaryPath = resolveGalleryAssetAbsolutePath(galleryPaths.primaryImagePath);
    const thumbnailPath = resolveGalleryAssetAbsolutePath(galleryPaths.thumbnailImagePath);

    try {
      await writeJpeg(buffer, originalPath);
      await writeJpeg(buffer, primaryPath, PRIMARY_DIMENSIONS, { withoutEnlargement: true });
      await writeJpeg(buffer, thumbnailPath, THUMBNAIL_DIMENSIONS);
    } catch (error) {
      await fs
        .rm(path.dirname(originalPath), { recursive: true, force: true })
        .catch(() => undefined);
      throw error;
    }
  }

  async deleteGalleryAssets(accountId: bigint, photoId: bigint): Promise<void> {
    const galleryPaths = buildGalleryAssetPaths(accountId, photoId, GALLERY_EXTENSION);
    const originalPath = resolveGalleryAssetAbsolutePath(galleryPaths.originalFilePath);
    const directory = path.dirname(originalPath);

    await fs.rm(directory, { recursive: true, force: true });
  }
}
