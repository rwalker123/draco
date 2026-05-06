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

const TeamPhotoGalleryQuerySchema = PhotoGalleryQuerySchema.pick({ albumId: true });

const router = Router({ mergeParams: true });
const galleryAdminService = ServiceFactory.getPhotoGalleryAdminService();
const routeProtection = ServiceFactory.getRouteProtection();

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
  if (!stringValue || stringValue.toLowerCase() === 'null') {
    return null;
  }

  return stringValue;
};

const createPhotoBodySchema = CreatePhotoGalleryPhotoSchema.omit({ photo: true });
const updatePhotoBodySchema = UpdatePhotoGalleryPhotoSchema;
const createAlbumBodySchema = CreatePhotoGalleryAlbumSchema;
const updateAlbumBodySchema = UpdatePhotoGalleryAlbumSchema;

router.get(
  '/:teamId/photo-gallery/photos',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const query = TeamPhotoGalleryQuerySchema.parse(req.query);

    const response = await galleryAdminService.listTeamGalleryEntries(accountId, teamId, {
      albumId: query.albumId ?? undefined,
    });
    res.json(response);
  }),
);

router.post(
  '/:teamId/photo-gallery/photos',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  handlePhotoUploadMiddleware,
  validatePhotoUpload,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const file = req.file;

    if (!file) {
      throw new ValidationError('Photo file is required');
    }

    const body = createPhotoBodySchema.parse({
      title: req.body.title,
      caption: req.body.caption,
      albumId: normalizeOptionalNumericInput(req.body.albumId),
    });

    const photo = await galleryAdminService.createTeamPhoto(accountId, teamId, body, file.buffer);
    res.status(201).json(photo);
  }),
);

router.patch(
  '/:teamId/photo-gallery/photos/:photoId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, photoId } = extractBigIntParams(req.params, 'teamId', 'photoId');

    const body = updatePhotoBodySchema.parse({
      title: req.body.title,
      caption: req.body.caption,
      albumId: normalizeOptionalNumericInput(req.body.albumId),
    });

    const photo = await galleryAdminService.updateTeamPhoto(accountId, teamId, photoId, body);
    res.json(photo);
  }),
);

router.delete(
  '/:teamId/photo-gallery/photos/:photoId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, photoId } = extractBigIntParams(req.params, 'teamId', 'photoId');

    await galleryAdminService.deleteTeamPhoto(accountId, teamId, photoId);
    res.status(204).send();
  }),
);

router.get(
  '/:teamId/photo-gallery/albums',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');
    const response = await galleryAdminService.listTeamAlbums(accountId, teamId);
    res.json(response);
  }),
);

router.post(
  '/:teamId/photo-gallery/albums',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    const body = createAlbumBodySchema.parse({
      title: req.body.title,
      teamId: teamId.toString(),
      parentAlbumId: normalizeOptionalNumericInput(req.body.parentAlbumId),
    });

    const album = await galleryAdminService.createTeamAlbum(accountId, teamId, body);
    res.status(201).json(album);
  }),
);

router.patch(
  '/:teamId/photo-gallery/albums/:albumId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, albumId } = extractBigIntParams(req.params, 'teamId', 'albumId');

    const body = updateAlbumBodySchema.parse({
      title: req.body.title,
      parentAlbumId: normalizeOptionalNumericInput(req.body.parentAlbumId),
    });

    const album = await galleryAdminService.updateTeamAlbum(accountId, teamId, albumId, body);
    res.json(album);
  }),
);

router.delete(
  '/:teamId/photo-gallery/albums/:albumId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.photos.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId, albumId } = extractBigIntParams(req.params, 'teamId', 'albumId');

    await galleryAdminService.deleteTeamAlbum(accountId, teamId, albumId);
    res.status(204).send();
  }),
);

export default router;
