import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { extractSeasonParams, extractTeamParams } from '../utils/paramExtraction';
import { TeamRequestValidator } from '../utils/teamValidators';
import { TeamResponseFormatter } from '../utils/responseFormatters';
import { upload, handleLogoUpload } from './team-media';
import { ServiceFactory } from '../lib/serviceFactory';

const router = Router({ mergeParams: true });

const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams
 * Get all teams for a season
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const teamService = ServiceFactory.getTeamService();

    const teams = await teamService.getTeamsBySeasonId(seasonId, accountId);
    const response = TeamResponseFormatter.formatTeamsListResponse(teams);

    res.json(response);
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
      const teamService = ServiceFactory.getTeamService();

      const leagueInfo = await teamService.getLeagueInfo(teamSeasonId, seasonId, accountId);
      const response = TeamResponseFormatter.formatLeagueInfoResponse(leagueInfo);

      res.json(response);
    } catch (error) {
      console.error('League route error:', error);
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Get a single team season's info
 */
router.get(
  '/:teamSeasonId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
      const teamService = ServiceFactory.getTeamService();

      const teamSeasonDetails = await teamService.getTeamSeasonDetails(
        teamSeasonId,
        seasonId,
        accountId,
      );
      const response = TeamResponseFormatter.formatTeamDetailsResponse(teamSeasonDetails);

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
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
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
      const updateData = TeamRequestValidator.validateTeamUpdateRequest(req);

      // Update team season
      const teamService = ServiceFactory.getTeamService();
      const updatedTeam = await teamService.updateTeamSeason(
        teamSeasonId,
        seasonId,
        accountId,
        updateData,
      );

      // Handle logo upload if provided
      let logoUrl = null;
      if (req.file) {
        // Get the teamId from the updated team
        const teamId = BigInt(updatedTeam.teamId);
        logoUrl = await handleLogoUpload(req, accountId, teamId);
      }

      const response = TeamResponseFormatter.formatTeamUpdateResponse(updatedTeam, logoUrl);
      res.json(response);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

export default router;
