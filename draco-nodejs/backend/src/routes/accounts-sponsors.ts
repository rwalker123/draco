import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateSponsorSchema, CreateSponsorType } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logoUploadMiddleware } from '../middleware/logoUpload.js';
import { handleSponsorPhotoUpload } from './utils/fileUpload.js';

const router = Router({ mergeParams: true });
const sponsorService = ServiceFactory.getSponsorService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/:accountId/sponsors',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const sponsors = await sponsorService.getAccountSponsors(accountId);
    res.json({ sponsors });
  }),
);

router.get(
  '/:accountId/sponsors/:sponsorId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { sponsorId } = extractBigIntParams(req.params, 'sponsorId');
    const sponsor = await sponsorService.getSponsor(accountId, sponsorId);
    res.json(sponsor);
  }),
);

router.post(
  '/:accountId/sponsors',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.sponsors.manage'),
  logoUploadMiddleware('photo'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = CreateSponsorSchema.parse(req.body) as Omit<CreateSponsorType, 'teamId'>;

    const sponsor = await sponsorService.createAccountSponsor(accountId, {
      ...payload,
    });

    if (req.file) {
      await handleSponsorPhotoUpload(req, accountId, BigInt(sponsor.id));
    }

    const response = await sponsorService.getSponsor(accountId, BigInt(sponsor.id));
    res.status(201).json(response);
  }),
);

router.put(
  '/:accountId/sponsors/:sponsorId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.sponsors.manage'),
  logoUploadMiddleware('photo'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { sponsorId } = extractBigIntParams(req.params, 'sponsorId');
    const hasBodyData = req.body && Object.keys(req.body).length > 0;

    if (hasBodyData) {
      const payload = CreateSponsorSchema.parse(req.body) as Omit<CreateSponsorType, 'teamId'>;
      await sponsorService.updateAccountSponsor(accountId, sponsorId, {
        ...payload,
      });
    } else {
      await sponsorService.getSponsor(accountId, sponsorId);
    }

    if (req.file) {
      await handleSponsorPhotoUpload(req, accountId, sponsorId);
    }

    const response = await sponsorService.getSponsor(accountId, sponsorId);
    res.json(response);
  }),
);

router.delete(
  '/:accountId/sponsors/:sponsorId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.sponsors.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { sponsorId } = extractBigIntParams(req.params, 'sponsorId');

    await sponsorService.deleteSponsor(accountId, sponsorId);

    res.status(204).send();
  }),
);

export default router;
