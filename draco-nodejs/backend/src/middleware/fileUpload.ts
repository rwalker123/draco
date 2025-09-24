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

// Parse JSON strings back to objects for FormData requests
export const parseFormDataJSON = (req: Request, res: Response, next: NextFunction): void => {
  // Only process if we have a multipart form request (indicated by req.file or specific content-type)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Parse JSON strings back to objects for FormData requests
    if (req.body.contactDetails && typeof req.body.contactDetails === 'string') {
      try {
        req.body.contactDetails = JSON.parse(req.body.contactDetails);
      } catch (error) {
        res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Invalid contactDetails format - must be valid JSON',
        });
        return;
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
