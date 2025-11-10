import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  AccountSettingState,
  SignRosterMemberSchema,
  UpdateRosterMemberSchema,
} from '@draco/shared-schemas';
import { AuthorizationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const rosterService = ServiceFactory.getRosterService();
const accountSettingsService = ServiceFactory.getAccountSettingsService();

const isSettingEnabled = (settings: AccountSettingState[], key: string): boolean =>
  settings.some((setting) => setting.definition.key === key && Boolean(setting.effectiveValue));

const isTrackGamesPlayedEnabled = (settings: AccountSettingState[]): boolean =>
  isSettingEnabled(settings, 'TrackGamesPlayed');

const ensureRosterCardEnabled = (settings: AccountSettingState[]): void => {
  if (!isSettingEnabled(settings, 'ShowRosterCard')) {
    throw new AuthorizationError('Printable roster card is disabled for this account.');
  }
};

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Get all roster members for a team season
 */
router.get(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const accountSettings = await accountSettingsService.getAccountSettings(accountId);
    const trackGamesPlayed = isTrackGamesPlayedEnabled(accountSettings);

    const rosterMembers = await rosterService.getTeamRosterMembers(
      teamSeasonId,
      seasonId,
      accountId,
      trackGamesPlayed,
    );

    res.json(rosterMembers);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster-public
 * Get public-safe roster members (names, jersey numbers, photos only)
 */
router.get(
  '/:teamSeasonId/roster-public',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const accountSettings = await accountSettingsService.getAccountSettings(accountId);
    const trackGamesPlayed = isTrackGamesPlayedEnabled(accountSettings);

    const rosterMembers = await rosterService.getPublicTeamRoster(
      teamSeasonId,
      seasonId,
      accountId,
      trackGamesPlayed,
    );

    res.json(rosterMembers);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster-card
 * Get printable roster card data
 */
router.get(
  '/:teamSeasonId/roster-card',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const accountSettings = await accountSettingsService.getAccountSettings(accountId);
    ensureRosterCardEnabled(accountSettings);

    const rosterCard = await rosterService.getTeamRosterCard(accountId, seasonId, teamSeasonId);
    res.json(rosterCard);
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
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(100, Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1));
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
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Add a player to the team roster
 */
router.post(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const addPlayerData = SignRosterMemberSchema.parse(req.body);
    const rosterMember = await rosterService.addPlayerToRoster(
      teamSeasonId,
      seasonId,
      accountId,
      addPlayerData,
    );

    res.status(201).json(rosterMember);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Update roster member information (player number, waiver status, driver's license, first year)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    const updateData = UpdateRosterMemberSchema.parse(req.body);

    const updatedRosterMember = await rosterService.updateRosterMember(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
      updateData,
    );

    res.json(updatedRosterMember);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/release
 * Release a player from the team (set inactive = true)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/release',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/activate
 * Reactivate a released player (set inactive = false)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/activate',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Permanently delete a player from the roster (with warning)
 */
router.delete(
  '/:teamSeasonId/roster/:rosterMemberId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, rosterMemberId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'rosterMemberId',
    );

    await rosterService.deleteRosterMember(rosterMemberId, teamSeasonId, seasonId, accountId);

    res.json(true);
  }),
);

export default router;
