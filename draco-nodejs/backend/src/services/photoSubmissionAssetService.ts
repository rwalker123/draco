import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp, { FormatEnum, type Metadata } from 'sharp';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import {
  buildGalleryAssetPaths,
  resolveGalleryAssetAbsolutePath,
  resolveSubmissionAssetAbsolutePath,
} from '../utils/photoSubmissionPaths.js';

const PRIMARY_DIMENSIONS = { width: 800, height: 450 } as const;
const THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;

const SUPPORTED_FORMATS: Record<string, keyof FormatEnum> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.bmp': 'jpeg',
};

const ensureDirectory = async (targetPath: string): Promise<void> => {
  await fs.mkdir(targetPath, { recursive: true });
};

const getExtension = (filePath: string): string => path.extname(filePath).toLowerCase();

const getSharpFormat = (extension: string): keyof FormatEnum => {
  const format = SUPPORTED_FORMATS[extension];
  return format ?? 'jpeg';
};

const matchesTargetDimensions = (
  metadata: Metadata | null | undefined,
  dimensions: { width: number; height: number },
): boolean => {
  if (!metadata?.width || !metadata?.height) {
    return false;
  }

  return metadata.width === dimensions.width && metadata.height === dimensions.height;
};

const processImage = async (
  buffer: Buffer,
  destination: string,
  format: keyof FormatEnum,
  dimensions: { width: number; height: number },
  options: { withoutEnlargement?: boolean } = {},
): Promise<void> => {
  await sharp(buffer)
    .resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: options.withoutEnlargement ?? false,
    })
    .toFormat(format)
    .toFile(destination);
};

const copyFile = async (source: string, destination: string): Promise<void> => {
  await ensureDirectory(path.dirname(destination));
  await fs.copyFile(source, destination);
};

export class PhotoSubmissionAssetService {
  async stageSubmissionAssets(
    submission: PhotoSubmissionRecordType,
    fileBuffer: Buffer,
  ): Promise<void> {
    const originalPath = resolveSubmissionAssetAbsolutePath(submission.originalFilePath);
    const primaryPath = resolveSubmissionAssetAbsolutePath(submission.primaryImagePath);
    const thumbnailPath = resolveSubmissionAssetAbsolutePath(submission.thumbnailImagePath);
    const directory = path.dirname(originalPath);
    const extension = getExtension(submission.originalFilePath);
    const format = getSharpFormat(extension);

    try {
      await ensureDirectory(directory);
      await fs.writeFile(originalPath, fileBuffer);

      const metadata = await sharp(fileBuffer).metadata();

      await ensureDirectory(path.dirname(primaryPath));
      if (matchesTargetDimensions(metadata, PRIMARY_DIMENSIONS)) {
        await fs.writeFile(primaryPath, fileBuffer);
      } else {
        await processImage(fileBuffer, primaryPath, format, PRIMARY_DIMENSIONS, {
          withoutEnlargement: true,
        });
      }

      await ensureDirectory(path.dirname(thumbnailPath));
      if (matchesTargetDimensions(metadata, THUMBNAIL_DIMENSIONS)) {
        await fs.writeFile(thumbnailPath, fileBuffer);
      } else {
        await processImage(fileBuffer, thumbnailPath, format, THUMBNAIL_DIMENSIONS);
      }
    } catch (error) {
      await fs.rm(directory, { recursive: true, force: true }).catch(() => undefined);
      throw error;
    }
  }

  async deleteSubmissionAssets(submission: PhotoSubmissionRecordType): Promise<void> {
    const directory = path.dirname(resolveSubmissionAssetAbsolutePath(submission.originalFilePath));
    await fs.rm(directory, { recursive: true, force: true });
  }

  async promoteSubmissionAssets(
    submission: PhotoSubmissionRecordType,
    approvedPhotoId: bigint,
  ): Promise<void> {
    const extension = getExtension(submission.originalFilePath);
    const accountId = BigInt(submission.accountId);
    const galleryAssets = buildGalleryAssetPaths(accountId, approvedPhotoId, extension);

    const sourceOriginal = resolveSubmissionAssetAbsolutePath(submission.originalFilePath);
    const sourcePrimary = resolveSubmissionAssetAbsolutePath(submission.primaryImagePath);
    const sourceThumbnail = resolveSubmissionAssetAbsolutePath(submission.thumbnailImagePath);

    const destinationOriginal = resolveGalleryAssetAbsolutePath(galleryAssets.originalFilePath);
    const destinationPrimary = resolveGalleryAssetAbsolutePath(galleryAssets.primaryImagePath);
    const destinationThumbnail = resolveGalleryAssetAbsolutePath(galleryAssets.thumbnailImagePath);

    await copyFile(sourceOriginal, destinationOriginal);
    await copyFile(sourcePrimary, destinationPrimary);
    await copyFile(sourceThumbnail, destinationThumbnail);
  }

  async deleteGalleryAssets(
    submission: PhotoSubmissionRecordType,
    approvedPhotoId: bigint,
  ): Promise<void> {
    const extension = getExtension(submission.originalFilePath);
    const accountId = BigInt(submission.accountId);
    const galleryAssets = buildGalleryAssetPaths(accountId, approvedPhotoId, extension);

    const destinationOriginal = resolveGalleryAssetAbsolutePath(galleryAssets.originalFilePath);
    const directory = path.dirname(destinationOriginal);

    await fs.rm(directory, { recursive: true, force: true });
  }
}
