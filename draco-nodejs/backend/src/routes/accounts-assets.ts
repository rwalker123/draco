// Account Assets Management Routes
// Handles logo upload, retrieval, and deletion

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { validateLogoFile, getAccountLogoUrl } from '../config/logo.js';
import { createStorageService } from '../services/storageService.js';
import { logoUploadMiddleware } from '../middleware/logoUpload.js';
import { getStringParam } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const storageService = createStorageService();

/**
 * POST /api/accounts/:accountId/logo
 *
 * Account logo upload endpoint
 * Accepts a multipart/form-data request with a 'logo' file field.
 * Requires 'account.manage' permission.
 */
router.post(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  logoUploadMiddleware(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = getStringParam(req.params.accountId)!;
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

/**
 * GET /api/accounts/:accountId/logo
 *
 * Account logo retrieval endpoint
 * Requires 'account.manage' permission.
 */
router.get(
  '/:accountId/logo',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = getStringParam(req.params.accountId)!;
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

/**
 * DELETE /api/accounts/:accountId/logo
 *
 * Account logo deletion endpoint
 * Requires 'account.manage' permission.
 * Note: This action is irreversible. Ensure the user understands the implications of this action.
 */
router.delete(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = getStringParam(req.params.accountId)!;
    await storageService.deleteAccountLogo(accountId);
    res.json(true);
  }),
);

export default router;
