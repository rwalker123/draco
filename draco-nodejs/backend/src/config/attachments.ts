// Email Attachment Configuration for Draco Sports Manager
// Defines allowed file types, size limits, and validation rules

export const ATTACHMENT_CONFIG = {
  // Maximum file size in bytes (10MB default)
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // Maximum number of attachments per email
  MAX_ATTACHMENTS_PER_EMAIL: 10,

  // Total maximum size for all attachments in an email (25MB)
  MAX_TOTAL_ATTACHMENTS_SIZE: 25 * 1024 * 1024,

  // Allowed MIME types for attachments
  ALLOWED_MIME_TYPES: [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain',
    'text/csv',
    'application/rtf',

    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    // Other common formats
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'application/x-pdf',
  ],

  // File extensions mapping (for additional validation)
  ALLOWED_EXTENSIONS: [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
    '.csv',
    '.rtf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.zip',
    '.rar',
    '.7z',
    '.json',
    '.xml',
    '.html',
  ],
};

/**
 * Validate attachment file
 */
export function validateAttachmentFile(file: {
  mimetype?: string;
  size?: number;
  originalname?: string;
}): string | null {
  if (!file) {
    return 'No file provided';
  }

  // Check file size
  if (file.size && file.size > ATTACHMENT_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = ATTACHMENT_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return `File size exceeds maximum allowed size of ${maxSizeMB}MB`;
  }

  // Check MIME type
  if (file.mimetype && !ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return `File type '${file.mimetype}' is not allowed`;
  }

  // Additional extension check
  if (file.originalname) {
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (extension && !ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
      return `File extension '${extension}' is not allowed`;
    }
  }

  return null;
}

/**
 * Validate multiple attachments
 */
export function validateAttachments(
  files: Array<{ mimetype?: string; size?: number; originalname?: string }>,
): string | null {
  if (!files || files.length === 0) {
    return null;
  }

  // Check number of attachments
  if (files.length > ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_EMAIL) {
    return `Maximum ${ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_EMAIL} attachments allowed per email`;
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  if (totalSize > ATTACHMENT_CONFIG.MAX_TOTAL_ATTACHMENTS_SIZE) {
    const maxTotalSizeMB = ATTACHMENT_CONFIG.MAX_TOTAL_ATTACHMENTS_SIZE / (1024 * 1024);
    return `Total attachment size exceeds maximum allowed size of ${maxTotalSizeMB}MB`;
  }

  // Validate each file
  for (const file of files) {
    const error = validateAttachmentFile(file);
    if (error) {
      return error;
    }
  }

  return null;
}

/**
 * Generate safe filename for storage
 */
export function generateSafeFilename(originalName: string): string {
  // Remove special characters and spaces
  const timestamp = Date.now();
  const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  const baseName = originalName
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
    .slice(0, 50); // Limit length

  return `${baseName}_${timestamp}${extension}`;
}

/**
 * Get MIME type from filename
 */
export function getMimeTypeFromFilename(filename: string): string | undefined {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return undefined;

  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
  };

  return mimeMap[extension];
}
