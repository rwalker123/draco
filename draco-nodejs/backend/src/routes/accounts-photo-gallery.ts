import { Router, Request, Response } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import {
  CreatePhotoGalleryAlbumSchema,
  CreatePhotoGalleryPhotoSchema,
  PhotoGalleryQuerySchema,
  UpdatePhotoGalleryAlbumSchema,
  UpdatePhotoGalleryPhotoSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handlePhotoUploadMiddleware, validatePhotoUpload } from '../middleware/fileUpload.js';

const router = Router({ mergeParams: true });
const galleryService = ServiceFactory.getPhotoGalleryService();
const galleryAdminService = ServiceFactory.getPhotoGalleryAdminService();
const routeProtection = ServiceFactory.getRouteProtection();

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

const normalizeOptionalNumericInput = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null) {
    return null;
  }

  const stringValue = String(raw).trim();
  if (!stringValue) {
    return null;
  }

  if (stringValue.toLowerCase() === 'null') {
    return null;
  }

  return stringValue;
};

const createPhotoBodySchema = CreatePhotoGalleryPhotoSchema.omit({ photo: true });
const updatePhotoBodySchema = UpdatePhotoGalleryPhotoSchema;
const createAlbumBodySchema = CreatePhotoGalleryAlbumSchema;
const updateAlbumBodySchema = UpdatePhotoGalleryAlbumSchema;

router.get(
  '/:accountId/photo-gallery',
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

router.get(
  '/:accountId/photo-gallery/photos',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = PhotoGalleryQuerySchema.parse(req.query);

    const response = await galleryAdminService.listGalleryEntries(accountId, query);
    res.json(response);
  }),
);

router.post(
  '/:accountId/photo-gallery/photos',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  handlePhotoUploadMiddleware,
  validatePhotoUpload,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const file = req.file;

    if (!file) {
      throw new ValidationError('Photo file is required');
    }

    const body = createPhotoBodySchema.parse({
      title: req.body.title,
      caption: req.body.caption,
      albumId: normalizeOptionalNumericInput(req.body.albumId),
    });

    const photo = await galleryAdminService.createPhoto(accountId, body, file.buffer);
    res.status(201).json(photo);
  }),
);

router.patch(
  '/:accountId/photo-gallery/photos/:photoId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { photoId } = extractBigIntParams(req.params, 'photoId');

    const body = updatePhotoBodySchema.parse({
      title: req.body.title,
      caption: req.body.caption,
      albumId: normalizeOptionalNumericInput(req.body.albumId),
    });

    const photo = await galleryAdminService.updatePhoto(accountId, photoId, body);
    res.json(photo);
  }),
);

router.delete(
  '/:accountId/photo-gallery/photos/:photoId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { photoId } = extractBigIntParams(req.params, 'photoId');

    await galleryAdminService.deletePhoto(accountId, photoId);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/photo-gallery/albums',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const response = await galleryAdminService.listAlbums(accountId);
    res.json(response);
  }),
);

router.post(
  '/:accountId/photo-gallery/albums',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const body = createAlbumBodySchema.parse({
      title: req.body.title,
      teamId: normalizeOptionalNumericInput(req.body.teamId),
      parentAlbumId: normalizeOptionalNumericInput(req.body.parentAlbumId),
    });

    const album = await galleryAdminService.createAlbum(accountId, body);
    res.status(201).json(album);
  }),
);

router.patch(
  '/:accountId/photo-gallery/albums/:albumId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { albumId } = extractBigIntParams(req.params, 'albumId');

    const body = updateAlbumBodySchema.parse({
      title: req.body.title,
      teamId: normalizeOptionalNumericInput(req.body.teamId),
      parentAlbumId: normalizeOptionalNumericInput(req.body.parentAlbumId),
    });

    const album = await galleryAdminService.updateAlbum(accountId, albumId, body);
    res.json(album);
  }),
);

router.delete(
  '/:accountId/photo-gallery/albums/:albumId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { albumId } = extractBigIntParams(req.params, 'albumId');

    await galleryAdminService.deleteAlbum(accountId, albumId);
    res.status(204).send();
  }),
);

export default router;
