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
 * Allowed MIME types for security validation
 */
const ALLOWED_MIME_TYPES = {
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
};

/**
 * Path traversal patterns to detect and block
 */
const PATH_TRAVERSAL_PATTERNS = [
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
];

/**
 * Validates file path for path traversal attacks
 */
export const validateFilePath = (filename: string): { isValid: boolean; error?: string } => {
  if (!filename || typeof filename !== 'string') {
    return { isValid: false, error: 'Invalid filename' };
  }

  // Check for path traversal patterns
  const hasPathTraversal = PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(filename));
  if (hasPathTraversal) {
    return {
      isValid: false,
      error: 'Filename contains illegal path traversal sequences',
    };
  }

  // Check for absolute paths
  if (filename.startsWith('/') || filename.match(/^[a-zA-Z]:/)) {
    return {
      isValid: false,
      error: 'Absolute paths are not allowed',
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
  const reservedNames = [
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
  ];

  const baseName = filename.split('.')[0].toUpperCase();
  if (reservedNames.includes(baseName)) {
    return {
      isValid: false,
      error: 'Filename uses reserved system name',
    };
  }

  return { isValid: true };
};

/**
 * Validates MIME type against file extension
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
  const mimeEntry = Object.entries(ALLOWED_MIME_TYPES).find(([mimeType, extensions]) => {
    return mimeType === file.type && extensions.includes(`.${extension}`);
  });

  if (!mimeEntry) {
    // Check if extension is allowed but MIME type doesn't match
    const extensionFound = Object.values(ALLOWED_MIME_TYPES).some((extensions) =>
      extensions.includes(`.${extension}`),
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
 * Performs basic file content validation
 */
export const validateFileContent = async (
  file: File,
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Read first few bytes to check file signatures
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for embedded scripts FIRST (priority for security)
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const textContent = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /%3cscript/i,
      ];

      if (scriptPatterns.some((pattern) => pattern.test(textContent))) {
        return {
          isValid: false,
          error: 'File contains potentially malicious content',
        };
      }
    }

    // Common file signature validation (after script check)
    const signatures: { [key: string]: number[][] } = {
      'image/jpeg': [[0xff, 0xd8, 0xff]],
      'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
      'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      ],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      'application/zip': [
        [0x50, 0x4b, 0x03, 0x04],
        [0x50, 0x4b, 0x05, 0x06],
        [0x50, 0x4b, 0x07, 0x08],
      ],
    };

    const expectedSignatures = signatures[file.type];
    if (expectedSignatures) {
      const hasValidSignature = expectedSignatures.some((signature) => {
        return signature.every((byte, index) => bytes[index] === byte);
      });

      if (!hasValidSignature) {
        return {
          isValid: false,
          error: `File content does not match expected format for ${file.type}`,
        };
      }
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
 * Enhanced file validation with security checks
 */
export const validateFileSecure = async (
  file: File,
  allowedTypes: string[],
  maxFileSize?: number,
): Promise<FileValidationResult> => {
  try {
    // 1. Validate file path for traversal attacks
    const pathValidation = validateFilePath(file.name);
    if (!pathValidation.isValid) {
      return {
        isValid: false,
        error: pathValidation.error,
        securityRisk: true,
      };
    }

    // 2. Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      return {
        isValid: false,
        error: 'File must have an extension',
      };
    }

    // 3. Reject dangerous extensions first (highest priority)
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
        securityRisk: true,
      };
    }

    // 4. Check for suspicious file names (but exclude extensions already caught above)
    const suspiciousPatterns = [
      /^\./, // Hidden files like .htaccess
      /\.(php|jsp|asp|bat|cmd|exe|scr|pif|com)\./i, // Double extensions with executable parts
      /\s*(script|javascript|vbscript)/i, // Script content in name
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
      return {
        isValid: false,
        error: 'Suspicious file name detected',
        securityRisk: true,
      };
    }

    // 5. Validate MIME type against extension
    const mimeValidation = validateMimeType(file);
    if (!mimeValidation.isValid) {
      return {
        isValid: false,
        error: mimeValidation.error,
        securityRisk: true,
      };
    }

    // 6. Check against allowed types
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

    // 6. Enhanced size validation with category-specific limits
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

    // 7. Additional security checks
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Empty files are not allowed',
      };
    }

    // 8. Validate file content (async operation)
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
