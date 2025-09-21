import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateRosterMemberSchema, SignRosterMemberSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const rosterService = ServiceFactory.getRosterService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Get all roster members for a team season
 */
router.get(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const rosterMembers = await rosterService.getTeamRosterMembers(
      teamSeasonId,
      seasonId,
      accountId,
    );

    res.json(rosterMembers);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/available-players
 * Get all available players (not on any team in this season) for adding to roster
 */
router.get(
  '/:teamSeasonId/available-players',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    // Parse query parameters with defaults and validation
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = Math.min(100, parseInt(String(req.query.limit || '50'), 10) || 50);
    const firstName = req.query.firstName ? String(req.query.firstName).trim() : undefined;
    const lastName = req.query.lastName ? String(req.query.lastName).trim() : undefined;

    const availablePlayers = await rosterService.getAvailablePlayers(
      teamSeasonId,
      seasonId,
      accountId,
      page,
      limit,
      firstName,
      lastName,
    );

    res.json(availablePlayers);
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Add a player to the team roster
 */
router.post(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const addPlayerData = SignRosterMemberSchema.parse(req.body);
    const rosterMember = await rosterService.addPlayerToRoster(
      teamSeasonId,
      seasonId,
      accountId,
      addPlayerData,
    );

    res.status(201).json(rosterMember);
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Update roster member information (player number, waiver status, driver's license, first year)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    const updateData = CreateRosterMemberSchema.parse(req.body);

    const updatedRosterMember = await rosterService.updateRosterMember(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
      updateData,
    );

    res.json(updatedRosterMember);
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/release
 * Release a player from the team (set inactive = true)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/release',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    const inactive = true;
    const releasedPlayer = await rosterService.releaseOrActivatePlayer(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
      inactive,
    );

    res.json(releasedPlayer);
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/activate
 * Reactivate a released player (set inactive = false)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/activate',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    const inactive = false;
    const activatedPlayer = await rosterService.releaseOrActivatePlayer(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
      inactive,
    );

    res.json(activatedPlayer);
  },
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Permanently delete a player from the roster (with warning)
 */
router.delete(
  '/:teamSeasonId/roster/:rosterMemberId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    const { playerName } = await rosterService.deleteRosterMember(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
    );

    res.json(`Player "${playerName}" has been permanently deleted from the roster`);
  },
);

export default router;
