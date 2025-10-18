import path from 'node:path';
import type { PhotoSubmissionAssetsType } from '@draco/shared-schemas';

const STORAGE_BASE_PREFIX = 'Uploads/Accounts';

const ensureExtensionFormat = (extension: string): string => {
  if (!extension) {
    return extension;
  }

  return extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
};

export function buildSubmissionAssetPaths(
  accountId: bigint,
  storageKey: string,
  extension: string,
): PhotoSubmissionAssetsType {
  const accountSegment = accountId.toString();
  const normalizedExtension = ensureExtensionFormat(extension);
  const basePath = `${STORAGE_BASE_PREFIX}/${accountSegment}/PhotoSubmissions/${storageKey}`;

  return {
    originalFilePath: `${basePath}/original${normalizedExtension}`,
    primaryImagePath: `${basePath}/primary${normalizedExtension}`,
    thumbnailImagePath: `${basePath}/thumbnail${normalizedExtension}`,
    originalFileName: `original${normalizedExtension}`,
  };
}

export function resolveSubmissionAssetAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), 'uploads', relativePath);
}

export function buildGalleryAssetPaths(
  accountId: bigint,
  photoId: bigint,
  extension: string,
): {
  originalFilePath: string;
  primaryImagePath: string;
  thumbnailImagePath: string;
} {
  const accountSegment = accountId.toString();
  const normalizedExtension = ensureExtensionFormat(extension);
  const basePath = `${STORAGE_BASE_PREFIX}/${accountSegment}/PhotoGallery/${photoId.toString()}`;

  return {
    originalFilePath: `${basePath}/Original${normalizedExtension}`,
    primaryImagePath: `${basePath}/Primary${normalizedExtension}`,
    thumbnailImagePath: `${basePath}/PhotoGalleryThumb${normalizedExtension}`,
  };
}

export function resolveGalleryAssetAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), 'uploads', relativePath);
}
