import path from 'node:path';
import sharp, { FormatEnum, type Metadata } from 'sharp';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { buildGalleryAssetPaths } from '../utils/photoSubmissionPaths.js';
import { contentTypeForKey, contentTypeForImageFormat } from '../utils/mimeTypes.js';
import { ServiceFactory } from './serviceFactory.js';
import type { StorageService } from './baseStorageService.js';

const PRIMARY_DIMENSIONS = { width: 800, height: 450 } as const;
const THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;

const SUPPORTED_FORMATS: Record<string, keyof FormatEnum> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.bmp': 'jpeg',
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

const resizeToBuffer = async (
  buffer: Buffer,
  format: keyof FormatEnum,
  dimensions: { width: number; height: number },
  options: { withoutEnlargement?: boolean } = {},
): Promise<Buffer> => {
  return sharp(buffer)
    .resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: options.withoutEnlargement ?? false,
    })
    .toFormat(format)
    .toBuffer();
};

export class PhotoSubmissionAssetService {
  constructor(private readonly storage: StorageService = ServiceFactory.getStorageService()) {}

  async stageSubmissionAssets(
    submission: PhotoSubmissionRecordType,
    fileBuffer: Buffer,
  ): Promise<void> {
    const extension = getExtension(submission.originalFilePath);
    const format = getSharpFormat(extension);
    const originalContentType = contentTypeForKey(submission.originalFilePath);
    const encodedContentType = contentTypeForImageFormat(format);

    try {
      await this.storage.saveObject(submission.originalFilePath, fileBuffer, originalContentType);

      const metadata = await sharp(fileBuffer).metadata();

      const primaryMatches = matchesTargetDimensions(metadata, PRIMARY_DIMENSIONS);
      const primaryBuffer = primaryMatches
        ? fileBuffer
        : await resizeToBuffer(fileBuffer, format, PRIMARY_DIMENSIONS, {
            withoutEnlargement: true,
          });
      await this.storage.saveObject(
        submission.primaryImagePath,
        primaryBuffer,
        primaryMatches ? originalContentType : encodedContentType,
      );

      const thumbnailMatches = matchesTargetDimensions(metadata, THUMBNAIL_DIMENSIONS);
      const thumbnailBuffer = thumbnailMatches
        ? fileBuffer
        : await resizeToBuffer(fileBuffer, format, THUMBNAIL_DIMENSIONS);
      await this.storage.saveObject(
        submission.thumbnailImagePath,
        thumbnailBuffer,
        thumbnailMatches ? originalContentType : encodedContentType,
      );
    } catch (error) {
      await this.deleteSubmissionAssets(submission).catch(() => undefined);
      throw error;
    }
  }

  async deleteSubmissionAssets(submission: PhotoSubmissionRecordType): Promise<void> {
    await this.storage.deleteObject(submission.originalFilePath);
    await this.storage.deleteObject(submission.primaryImagePath);
    await this.storage.deleteObject(submission.thumbnailImagePath);
  }

  async promoteSubmissionAssets(
    submission: PhotoSubmissionRecordType,
    approvedPhotoId: bigint,
  ): Promise<void> {
    const extension = getExtension(submission.originalFilePath);
    const accountId = BigInt(submission.accountId);
    const galleryAssets = buildGalleryAssetPaths(accountId, approvedPhotoId, extension);

    await this.copyObject(submission.primaryImagePath, galleryAssets.primaryImagePath);
    await this.copyObject(submission.thumbnailImagePath, galleryAssets.thumbnailImagePath);
  }

  async deleteGalleryAssets(
    submission: PhotoSubmissionRecordType,
    approvedPhotoId: bigint,
  ): Promise<void> {
    const extension = getExtension(submission.originalFilePath);
    const accountId = BigInt(submission.accountId);
    const galleryAssets = buildGalleryAssetPaths(accountId, approvedPhotoId, extension);

    await this.storage.deleteObject(galleryAssets.primaryImagePath);
    await this.storage.deleteObject(galleryAssets.thumbnailImagePath);
  }

  private async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const stored = await this.storage.getObject(sourceKey);
    if (!stored) {
      throw new Error(`Source asset not found: ${sourceKey}`);
    }

    await this.storage.saveObject(destinationKey, stored.buffer, stored.contentType);
  }
}
