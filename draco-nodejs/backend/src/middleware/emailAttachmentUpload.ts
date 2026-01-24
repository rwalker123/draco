import { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { mkdirSync } from 'fs';
import os from 'os';
import path from 'path';

import { ATTACHMENT_CONFIG } from '../config/attachments.js';
import { PayloadTooLargeError, ValidationError } from '../utils/customErrors.js';

// Configure disk storage to reduce memory pressure under high concurrency
// Files are written to temp directory and cleaned up after processing
const uploadTempDir = path.join(os.tmpdir(), 'draco-email-attachments');

// Create temp directory at module initialization (synchronous) to avoid race conditions
try {
  mkdirSync(uploadTempDir, { recursive: true });
} catch {
  // Directory may already exist or be created by another process
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory separators and keeps only safe characters
 */
function sanitizeFilename(originalName: string): string {
  const basename = path.basename(originalName);
  return basename.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadTempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = sanitizeFilename(file.originalname);
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: ATTACHMENT_CONFIG.MAX_FILE_SIZE,
    files: ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_EMAIL,
  },
});

/**
 * Middleware for email attachment uploads with disk storage
 * Follows the same pattern as handoutUploadMiddleware
 */
export const emailAttachmentUploadMiddleware = (fieldName = 'attachmentFiles') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];

    // Skip if not multipart form data
    if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
      next();
      return;
    }

    upload.array(fieldName)(req, res, (err: unknown) => {
      if (err) {
        // Transform multer errors to appropriate API errors
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            const error = new PayloadTooLargeError('File size exceeds the maximum allowed limit');
            res.status(error.statusCode).json(error.toErrorResponse());
            return;
          }
          const error = new ValidationError(
            err.code === 'LIMIT_FILE_COUNT'
              ? 'Too many files uploaded'
              : err.code === 'LIMIT_UNEXPECTED_FILE'
                ? 'Unexpected file field'
                : err.message,
          );
          res.status(error.statusCode).json(error.toErrorResponse());
          return;
        }

        // Generic upload error
        const error = new ValidationError(
          err instanceof Error ? err.message : 'File upload failed',
        );
        res.status(error.statusCode).json(error.toErrorResponse());
        return;
      }

      next();
    });
  };
};

// Export the temp directory path for use by cleanup utilities
export { uploadTempDir };
