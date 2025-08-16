/**
 * Enhanced file validation utilities for secure file uploads
 * Provides comprehensive validation including file type, size, and security checks
 * Uses established libraries like file-type for better security and maintainability
 */

import { fileTypeFromBuffer } from 'file-type';
import path from 'path';

/**
 * Enhanced validation result types with better type safety
 */
export interface FileValidationResult<T = void> {
  isValid: boolean;
  error?: string;
  securityRisk?: boolean;
  metadata?: T;
}

export interface ValidationMetadata {
  detectedMimeType?: string;
  fileSize: number;
  extension: string;
  category: string;
}

/**
 * Type for file extensions
 */
export type FileExtension = (typeof VALIDATION_CONFIG.DANGEROUS_EXTENSIONS)[number] | string;

/**
 * Type for MIME categories
 */
export type MimeCategory = keyof typeof VALIDATION_CONFIG.SIZE_LIMITS;

/**
 * Centralized validation configuration
 */
export const VALIDATION_CONFIG = {
  /**
   * List of dangerous file extensions that should never be allowed
   */
  DANGEROUS_EXTENSIONS: [
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
  ] as const,

  /**
   * Maximum file size limits by category (in bytes)
   */
  SIZE_LIMITS: {
    image: 10 * 1024 * 1024, // 10MB
    document: 25 * 1024 * 1024, // 25MB
    default: 50 * 1024 * 1024, // 50MB
  } as const,

  /**
   * MIME type to category mapping
   */
  MIME_CATEGORIES: {
    'image/': 'image',
    'application/pdf': 'document',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument': 'document',
    'text/': 'document',
  } as const,
  /**
   * Allowed MIME types for security validation
   */
  ALLOWED_MIME_TYPES: {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],

    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'application/rtf': ['.rtf'],

    // Archives (with caution)
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],

    // Audio/Video
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'video/mp4': ['.mp4'],
    'video/mpeg': ['.mpeg', '.mpg'],
    'video/quicktime': ['.mov'],
  } as const,

  /**
   * Path traversal patterns to detect and block
   * Using Node.js path module is more secure than regex patterns
   */
  PATH_TRAVERSAL_PATTERNS: [
    /\.\.\//g, // ../
    /\.\.\\/g, // ..\
    /\.\./g, // ..
    /%2e%2e%2f/gi, // URL encoded ../
    /%2e%2e%5c/gi, // URL encoded ..\
    /%252e%252e%252f/gi, // Double URL encoded ../
    /\.%2f/gi, // .%2f (./.)
    /\.%5c/gi, // .%5c (..\)
    /\/\.\.\//g, // /../
    /\\\.\.\\/g, // \..\
    /\0/g, // Null bytes
    /[\x00-\x1f\x7f-\x9f]/g, // Control characters
  ] as const,

  /**
   * Reserved Windows filenames
   */
  RESERVED_NAMES: [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ] as const,
} as const;

/**
 * Enhanced path validation result type
 */
export interface PathValidationResult {
  isValid: boolean;
  error?: string;
  securityRisk?: boolean;
}

/**
 * Validates file path for path traversal attacks using Node.js path module
 * More secure than regex patterns as it leverages Node.js built-in path handling
 */
export const validateFilePath = (filename: string): PathValidationResult => {
  if (!filename || typeof filename !== 'string') {
    return { isValid: false, error: 'Invalid filename', securityRisk: true };
  }

  // Check for path traversal patterns using regex (fallback for encoded sequences)
  const hasPathTraversal = VALIDATION_CONFIG.PATH_TRAVERSAL_PATTERNS.some((pattern) =>
    pattern.test(filename),
  );
  if (hasPathTraversal) {
    return {
      isValid: false,
      error: 'Filename contains illegal path traversal sequences',
      securityRisk: true,
    };
  }

  // Use Node.js path module for better security validation (frontend-safe)
  try {
    // Check for absolute paths in input first (cross-platform)
    const isWindowsAbsolute = /^[a-zA-Z]:/;
    const isUnixAbsolute = filename.startsWith('/');

    if (path.isAbsolute(filename) || isWindowsAbsolute.test(filename) || isUnixAbsolute) {
      return {
        isValid: false,
        error: 'Absolute paths are not allowed',
        securityRisk: true,
      };
    }

    // Normalize the path and check for directory traversal
    const normalizedInput = path.normalize(filename);

    // After normalization, the path should not start with .. or contain ../ sequences
    if (
      normalizedInput.startsWith('..') ||
      normalizedInput.includes('../') ||
      normalizedInput.includes('..\\')
    ) {
      return {
        isValid: false,
        error: 'Path attempts to escape current directory',
        securityRisk: true,
      };
    }

    // Additional check: resolved path should be a simple filename (no directory components)
    const resolvedPath = path.resolve('.', filename);
    const basePath = path.resolve('.');
    if (
      !resolvedPath.startsWith(basePath + path.sep) &&
      resolvedPath !== path.join(basePath, filename)
    ) {
      return {
        isValid: false,
        error: 'Invalid file path structure',
        securityRisk: true,
      };
    }
  } catch {
    return {
      isValid: false,
      error: 'Invalid path format',
      securityRisk: true,
    };
  }

  // Check filename length
  if (filename.length > 255) {
    return {
      isValid: false,
      error: 'Filename too long (max 255 characters)',
    };
  }

  // Check for reserved names (Windows)
  const baseName = filename.split('.')[0].toUpperCase();
  if ((VALIDATION_CONFIG.RESERVED_NAMES as readonly string[]).includes(baseName)) {
    return {
      isValid: false,
      error: 'Filename uses reserved system name',
      securityRisk: true,
    };
  }

  return { isValid: true };
};

/**
 * Validates MIME type against file extension using centralized configuration
 */
export const validateMimeType = (file: File): { isValid: boolean; error?: string } => {
  const parts = file.name.split('.');
  if (parts.length < 2 || parts[parts.length - 1] === '') {
    return { isValid: false, error: 'File extension required' };
  }

  const extension = parts.pop()?.toLowerCase();
  if (!extension) {
    return { isValid: false, error: 'File extension required' };
  }

  // Find matching MIME type entry
  const mimeEntry = Object.entries(VALIDATION_CONFIG.ALLOWED_MIME_TYPES).find(
    ([mimeType, extensions]) => {
      return mimeType === file.type && (extensions as readonly string[]).includes(`.${extension}`);
    },
  );

  if (!mimeEntry) {
    // Check if extension is allowed but MIME type doesn't match
    const extensionFound = Object.values(VALIDATION_CONFIG.ALLOWED_MIME_TYPES).some((extensions) =>
      (extensions as readonly string[]).includes(`.${extension}`),
    );

    if (extensionFound) {
      return {
        isValid: false,
        error: `MIME type '${file.type}' does not match file extension '.${extension}'`,
      };
    } else {
      return {
        isValid: false,
        error: `File type '.${extension}' is not allowed`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Performs enhanced file content validation using file-type library
 * More reliable than custom signature detection
 */
export const validateFileContent = async (
  file: File,
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Read sufficient bytes for file-type library (recommended 4100 bytes)
    const buffer = await file.slice(0, 4100).arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Check for embedded scripts FIRST (priority for security)
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const textContent = new TextDecoder('utf-8', { fatal: false }).decode(
        uint8Array.slice(0, 512), // Check first 512 bytes for scripts
      );
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /%3cscript/i,
        /data:text\/html/i,
        /data:application\/javascript/i,
      ];

      if (scriptPatterns.some((pattern) => pattern.test(textContent))) {
        return {
          isValid: false,
          error: 'File contains potentially malicious content',
        };
      }
    }

    // Use file-type library for accurate file signature detection
    const detectedType = await fileTypeFromBuffer(uint8Array);

    if (!detectedType) {
      // If file-type can't detect the type, check if it's a plain text file
      if (file.type.startsWith('text/')) {
        return { isValid: true }; // Allow text files that file-type can't detect
      }
      return {
        isValid: false,
        error: 'Unable to determine actual file type from content',
      };
    }

    // Compare detected MIME type with declared type
    if (detectedType.mime !== file.type) {
      return {
        isValid: false,
        error: `File content type (${detectedType.mime}) does not match declared type (${file.type})`,
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Failed to validate file content',
    };
  }
};

/**
 * Enhanced validation options interface with better type safety
 */
export interface ValidationOptions {
  allowedTypes: string[];
  maxFileSize?: number;
  strictMimeValidation?: boolean;
  allowHiddenFiles?: boolean;
  customValidators?: ValidationFunction[];
}

/**
 * Type for custom validation functions
 */
export type ValidationFunction = (
  file: File,
) => FileValidationResult | Promise<FileValidationResult>;

/**
 * Type for allowed file types (MIME types or extensions)
 */
export type AllowedFileType = string | `.${string}` | `${string}/*`;

/**
 * Enhanced validation result with metadata
 */
export interface EnhancedValidationResult extends FileValidationResult<ValidationMetadata> {
  warnings?: string[];
}

/**
 * Validates file extension and checks for dangerous extensions
 */
export const validateFileExtension = (file: File): FileValidationResult => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      isValid: false,
      error: 'File must have an extension',
    };
  }

  // Reject dangerous extensions first (highest priority)
  if (
    VALIDATION_CONFIG.DANGEROUS_EXTENSIONS.includes(
      extension as (typeof VALIDATION_CONFIG.DANGEROUS_EXTENSIONS)[number],
    )
  ) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons',
      securityRisk: true,
    };
  }

  return { isValid: true };
};

/**
 * Validates file name for suspicious patterns
 */
export const validateFileName = (filename: string): FileValidationResult => {
  const suspiciousPatterns = [
    /^\./, // Hidden files like .htaccess
    /\.(php|jsp|asp|bat|cmd|exe|scr|pif|com)\./i, // Double extensions with executable parts
    /\s*(script|javascript|vbscript)/i, // Script content in name
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(filename))) {
    return {
      isValid: false,
      error: 'Suspicious file name detected',
      securityRisk: true,
    };
  }

  return { isValid: true };
};

/**
 * Validates if file type is in allowed types list
 */
export const validateAllowedTypes = (file: File, allowedTypes: string[]): FileValidationResult => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return { isValid: false, error: 'File extension required' };
  }

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

  return { isValid: true };
};

/**
 * Validates file size with category-specific limits
 */
export const validateFileSize = (file: File, maxFileSize?: number): FileValidationResult => {
  // Enhanced size validation with category-specific limits
  const category = Object.keys(VALIDATION_CONFIG.MIME_CATEGORIES).find((mime) =>
    file.type.startsWith(mime),
  );
  const categoryType = category
    ? VALIDATION_CONFIG.MIME_CATEGORIES[category as keyof typeof VALIDATION_CONFIG.MIME_CATEGORIES]
    : 'default';
  const categoryLimit =
    VALIDATION_CONFIG.SIZE_LIMITS[categoryType as keyof typeof VALIDATION_CONFIG.SIZE_LIMITS];
  const sizeLimit = maxFileSize ? Math.min(maxFileSize, categoryLimit) : categoryLimit;

  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${sizeMB}MB limit`,
    };
  }

  // Additional security checks
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Empty files are not allowed',
    };
  }

  return { isValid: true };
};

/**
 * Enhanced file validation with security checks using composition
 * Following SOLID principles by breaking down into focused validators
 */
export const validateFileSecure = async (
  file: File,
  allowedTypes: string[],
  maxFileSize?: number,
): Promise<FileValidationResult> => {
  try {
    // Define validation steps in order of execution
    const validationSteps = [
      () => validateFilePath(file.name),
      () => validateFileExtension(file),
      () => validateFileName(file.name),
      () => validateMimeType(file),
      () => validateAllowedTypes(file, allowedTypes),
      () => validateFileSize(file, maxFileSize),
    ];

    // Execute synchronous validations
    for (const validate of validationSteps) {
      const result = validate();
      if (!result.isValid) {
        return result;
      }
    }

    // Execute asynchronous content validation last
    const contentValidation = await validateFileContent(file);
    if (!contentValidation.isValid) {
      return {
        isValid: false,
        error: contentValidation.error,
        securityRisk: true,
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'File validation failed due to an unexpected error',
      securityRisk: true,
    };
  }
};

/**
 * Validates multiple files with enhanced security
 */
export const validateFilesSecure = async (
  files: File[],
  allowedTypes: string[],
  maxFileSize?: number,
  maxTotalSize?: number,
): Promise<{ validFiles: File[]; errors: string[]; securityRisks: string[] }> => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  const securityRisks: string[] = [];
  let totalSize = 0;

  for (const file of files) {
    const result = await validateFileSecure(file, allowedTypes, maxFileSize);

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
