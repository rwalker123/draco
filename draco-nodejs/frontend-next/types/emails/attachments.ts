/**
 * Email attachment type definitions
 */

/**
 * File attachment metadata
 *
 * Note: The `file` property stores a File object reference. File objects cannot be
 * serialized to JSON (they become `{}`). Do NOT persist this state to localStorage
 * or sessionStorage. The file reference is used only during the compose session
 * and extracted when sending the email.
 */
export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
  lastModified?: number;
  previewUrl?: string;
}

/**
 * Attachment validation configuration
 */
export interface AttachmentConfig {
  maxFileSize?: number; // Max size in bytes
  maxTotalSize?: number; // Max total size for all attachments
  maxFiles?: number; // Maximum number of attachments
  allowedTypes?: string[]; // MIME types or extensions
  restrictedTypes?: string[]; // Blocked MIME types or extensions
}

/**
 * Attachment validation result
 */
export interface AttachmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalSize: number;
  fileCount: number;
}

/**
 * Attachment upload state
 */
export interface AttachmentUploadState {
  attachments: EmailAttachment[];
  uploading: boolean;
  totalProgress: number;
  errors: string[];
}

/**
 * Attachment upload actions
 */
export interface AttachmentUploadActions {
  addFiles: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
  clearAll: () => void;
  getAttachmentUrls: () => string[];
}

/**
 * Default attachment configuration
 */
export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
  maxFileSize: 25 * 1024 * 1024, // 25MB per file
  maxTotalSize: 100 * 1024 * 1024, // 100MB total
  maxFiles: 10,
  allowedTypes: [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
  restrictedTypes: [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-sh',
    'application/x-bat',
  ],
};

/**
 * File type categories for display
 */
export const FILE_TYPE_CATEGORIES = {
  document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
  spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
  presentation: ['ppt', 'pptx', 'odp'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  other: [],
} as const;

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Get file type category
 */
export function getFileCategory(filename: string): keyof typeof FILE_TYPE_CATEGORIES {
  const ext = getFileExtension(filename);

  for (const [category, extensions] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return category as keyof typeof FILE_TYPE_CATEGORIES;
    }
  }

  return 'other';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(file: File, config: AttachmentConfig): boolean {
  if (config.restrictedTypes?.includes(file.type)) {
    return false;
  }

  if (config.allowedTypes && config.allowedTypes.length > 0) {
    return config.allowedTypes.includes(file.type);
  }

  return true;
}

/**
 * Validate file attachments
 */
export function validateAttachments(
  files: File[],
  currentAttachments: EmailAttachment[],
  config: AttachmentConfig,
): AttachmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check max files
  const totalFiles = currentAttachments.length + files.length;
  if (config.maxFiles && totalFiles > config.maxFiles) {
    errors.push(
      `Maximum ${config.maxFiles} files allowed. You're trying to attach ${totalFiles} files.`,
    );
  }

  // Calculate total size
  const currentSize = currentAttachments.reduce((sum, att) => sum + att.size, 0);
  const newSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSize = currentSize + newSize;

  // Check total size
  if (config.maxTotalSize && totalSize > config.maxTotalSize) {
    errors.push(`Total size exceeds maximum of ${formatFileSize(config.maxTotalSize)}`);
  }

  // Check individual files
  files.forEach((file) => {
    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      errors.push(`"${file.name}" exceeds maximum size of ${formatFileSize(config.maxFileSize)}`);
    }

    // Check file type
    if (!isFileTypeAllowed(file, config)) {
      errors.push(`"${file.name}" has a restricted file type`);
    }

    // Check for duplicates
    const isDuplicate = currentAttachments.some(
      (att) => att.name === file.name && att.size === file.size,
    );
    if (isDuplicate) {
      warnings.push(`"${file.name}" appears to be already attached`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalSize,
    fileCount: totalFiles,
  };
}
