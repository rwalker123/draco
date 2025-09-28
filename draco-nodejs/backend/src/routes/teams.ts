import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractSeasonParams, extractTeamParams } from '../utils/paramExtraction.js';
import { upload, handleLogoUpload } from './team-media.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { UpsertTeamSeasonSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });

const routeProtection = ServiceFactory.getRouteProtection();
const teamService = ServiceFactory.getTeamService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams
 * Get all teams for a season
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    teamService.getTeamsBySeasonId(seasonId, accountId).then((teams) => {
      res.json(teams);
    });
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/league
 * Get league information for a team season
 */
router.get(
  '/:teamSeasonId/league',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    teamService.getLeagueInfo(teamSeasonId, seasonId, accountId).then((leagueInfo) => {
      res.json(leagueInfo);
    });
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Get a single team season's info
 */
router.get(
  '/:teamSeasonId',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    teamService
      .getTeamSeasonDetails(teamSeasonId, seasonId, accountId)
      .then((teamSeasonDetails) => {
        res.json(teamSeasonDetails);
      });
  }),
);

/**
 
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Update team information (name and logo)
 */
router.put(
  '/:teamSeasonId',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('logo')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
          success: false,
          message: message,
        });
      } else {
        next();
      }
    });
  },
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
    const updateData = UpsertTeamSeasonSchema.parse(req.body);

    // Update team season
    const updatedTeam = await teamService.updateTeamSeason(
      teamSeasonId,
      seasonId,
      accountId,
      updateData,
    );

    // Handle logo upload if provided
    if (req.file) {
      // Get the teamId from the updated team
      const teamId = BigInt(updatedTeam.teamId);
      await handleLogoUpload(req, accountId, teamId);
    }

    res.json(updatedTeam);
  }),
);

export default router;
