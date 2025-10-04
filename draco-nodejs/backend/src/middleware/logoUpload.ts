import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { LOGO_CONFIG } from '../config/logo.js';

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LOGO_CONFIG.MAX_UPLOAD_SIZE,
  },
});

export const logoUploadMiddleware = (fieldName = 'logo') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
      next();
      return;
    }

    logoUpload.single(fieldName)(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Failed to process upload';
        res.status(400).json({ message });
        return;
      }

      next();
    });
  };
};
