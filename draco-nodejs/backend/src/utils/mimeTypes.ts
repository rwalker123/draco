const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

const FORMAT_CONTENT_TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export const contentTypeForKey = (key: string): string => {
  const lastDot = key.lastIndexOf('.');
  if (lastDot === -1) {
    return 'application/octet-stream';
  }

  const extension = key.slice(lastDot).toLowerCase();
  return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream';
};

export const contentTypeForImageFormat = (format: string): string => {
  return FORMAT_CONTENT_TYPES[format] ?? 'application/octet-stream';
};
