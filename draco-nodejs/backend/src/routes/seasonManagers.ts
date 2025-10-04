import { Router, Request, Response } from 'express';
import { SeasonManagerFilters } from '../services/seasonManagerService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  LeagueNameType,
  SeasonManagerListType,
  SeasonManagerType,
  TeamSeasonNameType,
} from '@draco/shared-schemas';

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

    const managersFormatted: SeasonManagerType[] = managers.map((manager) => ({
      contact: {
        id: manager.contactId,
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email || undefined,
        contactDetails: {
          phone1: manager.phone1 || '',
          phone2: manager.phone2 || '',
          phone3: manager.phone3 || '',
        },
      },
      hasValidEmail: manager.hasValidEmail,
      allTeams: manager.allTeams.map((team) => ({
        id: team.teamSeasonId,
        name: team.teamName,
        league: {
          id: team.leagueSeasonId,
          name: team.leagueName,
        },
      })),
    }));

    const leagueNamesFormatted: LeagueNameType[] = Object.entries(leagueNames).map(
      ([id, name]) => ({ id, name }),
    );
    const teamNamesFormatted: TeamSeasonNameType[] = Object.entries(teamNames).map(
      ([id, name]) => ({ id, name }),
    );

    const result: SeasonManagerListType = {
      managers: managersFormatted,
      leagueNames: leagueNamesFormatted,
      teamNames: teamNamesFormatted,
    };

    res.json(result);
  }),
);

export default router;
