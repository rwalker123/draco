/**
 * Email-related constants
 * Provides standardized configurations for email attachments and validation
 */

export interface FileTypeInfo {
  extension: string;
  mimeType: string;
  category: 'document' | 'image' | 'archive' | 'text';
  iconName: string;
}

export const ALLOWED_ATTACHMENT_TYPES: FileTypeInfo[] = [
  // Documents
  {
    extension: '.pdf',
    mimeType: 'application/pdf',
    category: 'document',
    iconName: 'PictureAsPdf',
  },
  {
    extension: '.doc',
    mimeType: 'application/msword',
    category: 'document',
    iconName: 'Description',
  },
  {
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
    iconName: 'Description',
  },
  {
    extension: '.xls',
    mimeType: 'application/vnd.ms-excel',
    category: 'document',
    iconName: 'TableChart',
  },
  {
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'document',
    iconName: 'TableChart',
  },
  {
    extension: '.ppt',
    mimeType: 'application/vnd.ms-powerpoint',
    category: 'document',
    iconName: 'Slideshow',
  },
  {
    extension: '.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'document',
    iconName: 'Slideshow',
  },

  // Text files
  { extension: '.txt', mimeType: 'text/plain', category: 'text', iconName: 'TextSnippet' },
  { extension: '.rtf', mimeType: 'application/rtf', category: 'text', iconName: 'TextSnippet' },
  { extension: '.csv', mimeType: 'text/csv', category: 'text', iconName: 'TableChart' },

  // Images
  { extension: '.jpg', mimeType: 'image/jpeg', category: 'image', iconName: 'Image' },
  { extension: '.jpeg', mimeType: 'image/jpeg', category: 'image', iconName: 'Image' },
  { extension: '.png', mimeType: 'image/png', category: 'image', iconName: 'Image' },
  { extension: '.gif', mimeType: 'image/gif', category: 'image', iconName: 'Image' },
  { extension: '.bmp', mimeType: 'image/bmp', category: 'image', iconName: 'Image' },

  // Archives
  { extension: '.zip', mimeType: 'application/zip', category: 'archive', iconName: 'Archive' },
  { extension: '.rar', mimeType: 'application/vnd.rar', category: 'archive', iconName: 'Archive' },
  {
    extension: '.7z',
    mimeType: 'application/x-7z-compressed',
    category: 'archive',
    iconName: 'Archive',
  },
];

/**
 * Get allowed file extensions as a simple array
 */
export const getAllowedExtensions = (): string[] => {
  return ALLOWED_ATTACHMENT_TYPES.map((type) => type.extension);
};

/**
 * Get file type info by extension
 */
export const getFileTypeInfo = (filename: string): FileTypeInfo | null => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_ATTACHMENT_TYPES.find((type) => type.extension === extension) || null;
};

/**
 * Get file icon name by extension
 */
export const getFileIcon = (filename: string): string => {
  const fileType = getFileTypeInfo(filename);
  return fileType ? fileType.iconName : 'AttachFile';
};

/**
 * Check if file type is allowed for email attachments
 */
export const isAllowedFileType = (filename: string): boolean => {
  return getFileTypeInfo(filename) !== null;
};

/**
 * Get allowed file types by category
 */
export const getFileTypesByCategory = (category: FileTypeInfo['category']): FileTypeInfo[] => {
  return ALLOWED_ATTACHMENT_TYPES.filter((type) => type.category === category);
};

/**
 * Email validation patterns
 */
export const EMAIL_VALIDATION = {
  PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_LENGTH: 254,
} as const;

/**
 * Template variable patterns
 */
export const TEMPLATE_PATTERNS = {
  DOUBLE_BRACE: /{{\s*([^}]+)\s*}}/g,
  SINGLE_BRACE: /{\s*([^}]+)\s*}/g,
} as const;

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB total
  MAX_ATTACHMENTS: 10,
} as const;
