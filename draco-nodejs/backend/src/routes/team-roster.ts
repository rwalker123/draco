import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { RosterService } from '../services/rosterService';
import { asyncHandler } from '../utils/asyncHandler';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction';
import { TeamRequestValidator } from '../utils/teamValidators';
import { RosterResponseFormatter } from '../utils/responseFormatters';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);
const rosterService = new RosterService(prisma);

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

    const rosterMembers = await rosterService.getRosterMembers(teamSeasonId, seasonId, accountId);

    // Get team season info for response
    const teamSeason = await prisma.teamsseason.findFirst({
      where: { id: teamSeasonId },
      select: { id: true, name: true },
    });

    if (!teamSeason) {
      res.status(404).json({ success: false, message: 'Team season not found' });
      return;
    }

    const response = RosterResponseFormatter.formatRosterMembersResponse(teamSeason, rosterMembers);
    res.json(response);
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
      const { full } = TeamRequestValidator.validateQueryParams(req);

      const availablePlayers = await rosterService.getAvailablePlayers(
        teamSeasonId,
        seasonId,
        accountId,
        full,
      );

      const response = RosterResponseFormatter.formatAvailablePlayersResponse(availablePlayers);
      res.json(response);
    } catch (error) {
      next(error);
    }
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
      const addPlayerData = TeamRequestValidator.validateAddPlayerRequest(req);

      const rosterMember = await rosterService.addPlayerToRoster(
        teamSeasonId,
        seasonId,
        accountId,
        addPlayerData,
      );

      const playerName = `${rosterMember.player.contact.firstname} ${rosterMember.player.contact.lastname}`;
      const response = RosterResponseFormatter.formatAddPlayerResponse(rosterMember, playerName);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/update
 * Update roster member information (player number, waiver status, driver's license, first year)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/update',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
        req.params,
        'accountId',
        'seasonId',
        'teamSeasonId',
        'rosterMemberId',
      );

      const updateData = TeamRequestValidator.validateUpdateRosterMemberRequest(req);

      const updatedRosterMember = await rosterService.updateRosterMember(
        rosterMemberId,
        teamSeasonId,
        seasonId,
        accountId,
        updateData,
      );

      const playerName = `${updatedRosterMember.player.contact.firstname} ${updatedRosterMember.player.contact.lastname}`;
      const response = RosterResponseFormatter.formatUpdateRosterMemberResponse(
        updatedRosterMember,
        playerName,
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
        req.params,
        'accountId',
        'seasonId',
        'teamSeasonId',
        'rosterMemberId',
      );

      const releasedPlayer = await rosterService.releasePlayer(
        rosterMemberId,
        teamSeasonId,
        seasonId,
        accountId,
      );

      const playerName = `${releasedPlayer.player.contact.firstname} ${releasedPlayer.player.contact.lastname}`;
      const response = RosterResponseFormatter.formatReleasePlayerResponse(
        releasedPlayer,
        playerName,
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
        req.params,
        'accountId',
        'seasonId',
        'teamSeasonId',
        'rosterMemberId',
      );

      const activatedPlayer = await rosterService.activatePlayer(
        rosterMemberId,
        teamSeasonId,
        seasonId,
        accountId,
      );

      const playerName = `${activatedPlayer.player.contact.firstname} ${activatedPlayer.player.contact.lastname}`;
      const response = RosterResponseFormatter.formatActivatePlayerResponse(
        activatedPlayer,
        playerName,
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const response = RosterResponseFormatter.formatDeletePlayerResponse(playerName);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
