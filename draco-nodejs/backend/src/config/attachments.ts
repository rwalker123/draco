// Email Attachment Configuration
// Defines allowed file types, size limits, and validation rules

import { fileTypeFromBuffer } from 'file-type';

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

    // Images (SVG removed - can contain JavaScript)
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    // Other common formats (HTML removed - can contain JavaScript)
    'application/json',
    'application/xml',
    'text/xml',
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
    '.zip',
    '.rar',
    '.7z',
    '.json',
    '.xml',
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
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.json': 'application/json',
    '.xml': 'application/xml',
  };

  return mimeMap[extension];
}

export interface FileTypeVerificationResult {
  valid: boolean;
  detectedType?: string;
  error?: string;
}

const MIME_TYPES_WITH_MAGIC_NUMBERS: Record<string, string[]> = {
  'application/pdf': ['application/pdf'],
  'image/jpeg': ['image/jpeg'],
  'image/png': ['image/png'],
  'image/gif': ['image/gif'],
  'image/webp': ['image/webp'],
  'application/zip': ['application/zip', 'application/x-zip-compressed'],
  'application/x-zip-compressed': ['application/zip', 'application/x-zip-compressed'],
  'application/x-rar-compressed': ['application/x-rar-compressed'],
  'application/x-7z-compressed': ['application/x-7z-compressed'],
};

export async function verifyFileType(
  buffer: Buffer,
  claimedMimeType: string,
): Promise<FileTypeVerificationResult> {
  const detected = await fileTypeFromBuffer(buffer);

  if (detected) {
    const expectedTypes = MIME_TYPES_WITH_MAGIC_NUMBERS[claimedMimeType];
    if (expectedTypes && !expectedTypes.includes(detected.mime)) {
      return {
        valid: false,
        detectedType: detected.mime,
        error: `File content (${detected.mime}) doesn't match claimed type (${claimedMimeType})`,
      };
    }

    if (!ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES.includes(detected.mime)) {
      return {
        valid: false,
        detectedType: detected.mime,
        error: `Detected file type '${detected.mime}' is not allowed`,
      };
    }
  }

  return { valid: true };
}
