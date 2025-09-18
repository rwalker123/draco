import { Router, Request, Response } from 'express';
import { SeasonManagerService, SeasonManagerFilters } from '../services/seasonManagerService.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { RouteProtection } from '../middleware/routeProtection.js';
import { RoleService } from '../services/roleService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const seasonManagerService = new SeasonManagerService(prisma);
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

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

    const managers = await seasonManagerService.getSeasonManagers(accountId, seasonId, filters);

    // Build lookup maps efficiently - O(n) instead of O(n*m)
    const leagueNames: Record<string, string> = {};
    const teamNames: Record<string, string> = {};

    for (const manager of managers) {
      for (const team of manager.allTeams) {
        leagueNames[team.leagueSeasonId] = team.leagueName;
        teamNames[team.teamSeasonId] = team.teamName;
      }
    }

    res.json({
      managers,
      leagueNames,
      teamNames,
    });
  }),
);

export default router;
