import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractTeamParams } from '../utils/paramExtraction.js';
import { CreateSponsorSchema, CreateSponsorType } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logoUploadMiddleware } from '../middleware/logoUpload.js';
import { handleSponsorPhotoUpload } from './utils/fileUpload.js';

const router = Router({ mergeParams: true });
const sponsorService = ServiceFactory.getSponsorService();
const routeProtection = ServiceFactory.getRouteProtection();

const attachTeamContext = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.params.teamSeasonId) {
    req.params.teamId = req.params.teamSeasonId;
  }
  next();
};

router.get(
  '/:teamSeasonId/sponsors',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
    const sponsors = await sponsorService.getTeamSponsors(accountId, seasonId, teamSeasonId);
    res.json({ sponsors });
  }),
);

router.post(
  '/:teamSeasonId/sponsors',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requirePermission('team.sponsors.manage'),
  logoUploadMiddleware('photo'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
    const payload = CreateSponsorSchema.parse(req.body) as Omit<CreateSponsorType, 'teamId'>;

    const sponsor = await sponsorService.createTeamSponsor(accountId, seasonId, teamSeasonId, {
      ...payload,
    });

    if (req.file) {
      await handleSponsorPhotoUpload(req, accountId, BigInt(sponsor.id));
    }

    const response = await sponsorService.getTeamSponsor(
      accountId,
      seasonId,
      teamSeasonId,
      BigInt(sponsor.id),
    );
    res.status(201).json(response);
  }),
);

router.put(
  '/:teamSeasonId/sponsors/:sponsorId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requirePermission('team.sponsors.manage'),
  logoUploadMiddleware('photo'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
    const sponsorId = BigInt(req.params.sponsorId);
    const hasBodyData = req.body && Object.keys(req.body).length > 0;

    if (hasBodyData) {
      const payload = CreateSponsorSchema.parse(req.body) as Omit<CreateSponsorType, 'teamId'>;

      await sponsorService.updateTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId, {
        ...payload,
      });
    } else {
      await sponsorService.getTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId);
    }

    if (req.file) {
      await handleSponsorPhotoUpload(req, accountId, sponsorId);
    }

    const response = await sponsorService.getTeamSponsor(
      accountId,
      seasonId,
      teamSeasonId,
      sponsorId,
    );
    res.json(response);
  }),
);

router.delete(
  '/:teamSeasonId/sponsors/:sponsorId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requirePermission('team.sponsors.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
    const sponsorId = BigInt(req.params.sponsorId);

    await sponsorService.deleteTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId);
    res.status(204).send();
  }),
);

export default router;
