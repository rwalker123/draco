import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handoutUploadMiddleware } from '../middleware/handoutUpload.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpsertHandoutSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const handoutService = ServiceFactory.getHandoutService();

router.get(
  '/:accountId/handouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const handouts = await handoutService.listAccountHandouts(accountId);
    res.json({ handouts });
  }),
);

router.post(
  '/:accountId/handouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.handouts.manage'),
  handoutUploadMiddleware('file'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { description } = UpsertHandoutSchema.parse(req.body);

    const file = req.file
      ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : undefined;

    const handout = await handoutService.createAccountHandout(accountId, {
      description,
      file,
    });

    res.status(201).json(handout);
  }),
);

router.put(
  '/:accountId/handouts/:handoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.handouts.manage'),
  handoutUploadMiddleware('file'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { handoutId } = extractBigIntParams(req.params, 'handoutId');
    const { description } = UpsertHandoutSchema.parse(req.body);

    const file = req.file
      ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : undefined;

    const handout = await handoutService.updateAccountHandout(accountId, handoutId, {
      description,
      file,
    });

    res.json(handout);
  }),
);

router.delete(
  '/:accountId/handouts/:handoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.handouts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { handoutId } = extractBigIntParams(req.params, 'handoutId');

    await handoutService.deleteAccountHandout(accountId, handoutId);

    res.status(204).send();
  }),
);

router.get(
  '/:accountId/handouts/:handoutId/download',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { handoutId } = extractBigIntParams(req.params, 'handoutId');

    const { fileName, buffer } = await handoutService.getAccountHandoutFile(accountId, handoutId);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }),
);

export default router;
