import { Router, Request, Response } from 'express';
import { SeasonManagerFilters } from '../services/seasonManagerService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router({ mergeParams: true });
const seasonManagerService = ServiceFactory.getSeasonManagerService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET: List all managers for a season
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const { leagueSeasonId, teamSeasonId, search } = req.query;

    // Build filters object
    const filters: SeasonManagerFilters = {};
    if (leagueSeasonId && typeof leagueSeasonId === 'string') {
      filters.leagueSeasonId = leagueSeasonId;
    }
    if (teamSeasonId && typeof teamSeasonId === 'string') {
      filters.teamSeasonId = teamSeasonId;
    }
    if (search && typeof search === 'string') {
      filters.search = search;
    }

    const seasonManagers = await seasonManagerService.getSeasonManagers(
      accountId,
      seasonId,
      filters,
    );

    res.json(seasonManagers);
  }),
);

export default router;
