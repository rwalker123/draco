import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import { PhotoGalleryQuerySchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const galleryService = ServiceFactory.getPhotoGalleryService();

const normalizeQueryId = (value: unknown): bigint | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw !== 'string') {
    throw new ValidationError('Identifier parameters must be provided as strings');
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return BigInt(trimmed);
  } catch (_error) {
    throw new ValidationError('Invalid identifier supplied');
  }
};

router.get(
  '/:accountId/photo-gallery',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { albumId, teamId } = PhotoGalleryQuerySchema.parse(req.query);

    const response = await galleryService.listGalleryEntries({
      accountId,
      albumId:
        albumId === undefined
          ? undefined
          : albumId === null
            ? null
            : (normalizeQueryId(albumId) ?? null),
      teamId:
        teamId === undefined
          ? undefined
          : teamId === null
            ? null
            : (normalizeQueryId(teamId) ?? null),
    });

    res.json(response);
  }),
);

export default router;
