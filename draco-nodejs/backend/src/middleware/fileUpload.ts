import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const executePhotoUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('photo')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: message,
      });
      return;
    }

    next();
  });
};

export const handlePhotoUploadMiddleware = executePhotoUpload;

// Fields that may be JSON stringified in multipart form data
const JSON_STRING_FIELDS = ['contactDetails', 'recipients'];

// Parse JSON strings back to objects for FormData requests
export const parseFormDataJSON = (req: Request, res: Response, next: NextFunction): void => {
  // Only process if we have a multipart form request
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    for (const field of JSON_STRING_FIELDS) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          res.status(400).json({
            success: false,
            message:
              error instanceof Error
                ? error.message
                : `Invalid ${field} format - must be valid JSON`,
          });
          return;
        }
      }
    }
  }
  next();
};

// File upload validation
export const validatePhotoUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    next();
    return;
  }

  const file = req.file;
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    res.status(400).json({
      error: 'Invalid file type',
      details: `Allowed types: ${allowedMimeTypes.join(', ')}`,
    });
    return;
  }

  if (file.size > maxSize) {
    res.status(400).json({
      error: 'File too large',
      details: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
    });
    return;
  }

  next();
};
