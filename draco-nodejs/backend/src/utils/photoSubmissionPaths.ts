import type { PhotoSubmissionAssetsType } from '@draco/shared-schemas';

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
  const basePath = `${accountSegment}/photo-submissions/${storageKey}`;

  return {
    originalFilePath: `${basePath}/original${normalizedExtension}`,
    primaryImagePath: `${basePath}/primary${normalizedExtension}`,
    thumbnailImagePath: `${basePath}/thumbnail${normalizedExtension}`,
    originalFileName: `original${normalizedExtension}`,
  };
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
  const basePath = `${accountSegment}/photo-gallery/${photoId.toString()}`;

  return {
    originalFilePath: `${basePath}/photo${normalizedExtension}`,
    primaryImagePath: `${basePath}/photo${normalizedExtension}`,
    thumbnailImagePath: `${basePath}/photo-thumb${normalizedExtension}`,
  };
}
