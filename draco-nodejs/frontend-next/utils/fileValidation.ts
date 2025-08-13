/**
 * Enhanced file validation utilities for secure file uploads
 * Provides comprehensive validation including file type, size, and security checks
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  securityRisk?: boolean;
}

/**
 * List of dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'pif',
  'scr',
  'vbs',
  'js',
  'jar',
  'app',
  'dmg',
  'deb',
  'rpm',
  'msi',
  'pkg',
  'sh',
  'ps1',
  'php',
  'asp',
  'aspx',
  'jsp',
  'action',
  'do',
];

/**
 * Maximum file size limits by category (in bytes)
 */
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  default: 50 * 1024 * 1024, // 50MB
};

/**
 * MIME type to category mapping
 */
const MIME_CATEGORIES = {
  'image/': 'image',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument': 'document',
  'text/': 'document',
};

/**
 * Enhanced file validation with security checks
 */
export const validateFileSecure = (
  file: File,
  allowedTypes: string[],
  maxFileSize?: number,
): FileValidationResult => {
  try {
    // 1. Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      return {
        isValid: false,
        error: 'File must have an extension',
      };
    }

    // 2. Reject dangerous extensions regardless of config
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
        securityRisk: true,
      };
    }

    // 3. Check against allowed types
    const isTypeAllowed = allowedTypes.some((type) => {
      if (type.startsWith('.')) {
        return extension === type.substring(1).toLowerCase();
      }
      if (type.includes('*')) {
        const baseType = type.replace('*', '');
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isTypeAllowed) {
      return {
        isValid: false,
        error: `File type .${extension} is not allowed`,
      };
    }

    // 4. Enhanced size validation with category-specific limits
    const category = Object.keys(MIME_CATEGORIES).find((mime) => file.type.startsWith(mime));
    const categoryType = category
      ? MIME_CATEGORIES[category as keyof typeof MIME_CATEGORIES]
      : 'default';
    const categoryLimit = SIZE_LIMITS[categoryType as keyof typeof SIZE_LIMITS];
    const sizeLimit = maxFileSize ? Math.min(maxFileSize, categoryLimit) : categoryLimit;

    if (file.size > sizeLimit) {
      const sizeMB = Math.round(sizeLimit / (1024 * 1024));
      return {
        isValid: false,
        error: `File size exceeds ${sizeMB}MB limit`,
      };
    }

    // 5. Additional security checks
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Empty files are not allowed',
      };
    }

    // 6. Check for suspicious file names
    const suspiciousPatterns = [
      /^\./, // Hidden files
      /\.(php|jsp|asp)\./i, // Double extensions
      /\s*(script|javascript|vbscript)/i, // Script content in name
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
      return {
        isValid: false,
        error: 'Suspicious file name detected',
        securityRisk: true,
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'File validation failed due to an unexpected error',
    };
  }
};

/**
 * Validates multiple files with enhanced security
 */
export const validateFilesSecure = (
  files: File[],
  allowedTypes: string[],
  maxFileSize?: number,
  maxTotalSize?: number,
): { validFiles: File[]; errors: string[]; securityRisks: string[] } => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  const securityRisks: string[] = [];
  let totalSize = 0;

  for (const file of files) {
    const result = validateFileSecure(file, allowedTypes, maxFileSize);

    if (result.isValid) {
      // Check total size limit
      if (maxTotalSize && totalSize + file.size > maxTotalSize) {
        errors.push(
          `Total file size would exceed ${Math.round(maxTotalSize / (1024 * 1024))}MB limit`,
        );
        continue;
      }

      validFiles.push(file);
      totalSize += file.size;
    } else {
      errors.push(`${file.name}: ${result.error}`);
      if (result.securityRisk) {
        securityRisks.push(`${file.name}: Security risk detected`);
      }
    }
  }

  return { validFiles, errors, securityRisks };
};

/**
 * File size formatter for user display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
