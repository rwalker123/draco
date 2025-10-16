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
  '/:teamId/handouts',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    const handouts = await handoutService.listTeamHandouts(accountId, teamId);
    res.json({ handouts });
  }),
);

router.post(
  '/:teamId/handouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.handouts.manage'),
  handoutUploadMiddleware('file'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const { description } = UpsertHandoutSchema.parse(req.body);

    const file = req.file
      ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : undefined;

    const handout = await handoutService.createTeamHandout(accountId, teamId, {
      description,
      file,
    });

    res.status(201).json(handout);
  }),
);

router.put(
  '/:teamId/handouts/:handoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.handouts.manage'),
  handoutUploadMiddleware('file'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, handoutId } = extractBigIntParams(req.params, 'teamId', 'handoutId');
    const { description } = UpsertHandoutSchema.parse(req.body);

    const file = req.file
      ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : undefined;

    const handout = await handoutService.updateTeamHandout(accountId, teamId, handoutId, {
      description,
      file,
    });

    res.json(handout);
  }),
);

router.delete(
  '/:teamId/handouts/:handoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.handouts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, handoutId } = extractBigIntParams(req.params, 'teamId', 'handoutId');

    await handoutService.deleteTeamHandout(accountId, teamId, handoutId);

    res.status(204).send();
  }),
);

router.get(
  '/:teamId/handouts/:handoutId/download',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, handoutId } = extractBigIntParams(req.params, 'teamId', 'handoutId');

    const { fileName, buffer } = await handoutService.getTeamHandoutFile(
      accountId,
      teamId,
      handoutId,
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }),
);

export default router;
