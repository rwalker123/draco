import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const handoutUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export const handoutUploadMiddleware = (fieldName = 'file') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
      next();
      return;
    }

    handoutUpload.single(fieldName)(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Failed to process upload';
        res.status(400).json({ message });
        return;
      }

      next();
    });
  };
};
