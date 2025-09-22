// Account Assets Management Routes for Draco Sports Manager
// Handles logo upload, retrieval, and deletion

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import multer from 'multer';
import { validateLogoFile, getAccountLogoUrl } from '../config/logo.js';
import { createStorageService } from '../services/storageService.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const storageService = createStorageService();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Account logo upload endpoint
router.post(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('logo')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ success: false, message: (err as Error).message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    const validationError = validateLogoFile(req.file);
    if (validationError) {
      throw new ValidationError(validationError);
    }
    await storageService.saveAccountLogo(accountId, req.file.buffer);
    const accountLogoUrl = getAccountLogoUrl(accountId);
    res.json(accountLogoUrl);
  }),
);

// Account logo get endpoint
router.get(
  '/:accountId/logo',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    const logoBuffer = await storageService.getAccountLogo(accountId);
    if (!logoBuffer) {
      throw new NotFoundError('Account logo not found');
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Length', logoBuffer.length.toString());
    res.send(logoBuffer);
  }),
);

// Account logo delete endpoint
router.delete(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    await storageService.deleteAccountLogo(accountId);
    res.json(true);
  }),
);

export default router;
