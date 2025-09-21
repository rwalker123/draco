import { Router, Request, Response } from 'express';
import { asyncHandler } from './utils/asyncHandler.js';
import { extractSeasonParams } from '../utils/paramExtraction.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router({ mergeParams: true });
const statisticsService = ServiceFactory.getStatisticsService();

// Get league standings for a season (public endpoint)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const grouped = req.query.grouped === 'true';

    if (grouped) {
      const groupedStandings = await statisticsService.getGroupedStandings(accountId, seasonId);

      res.json({
        success: true,
        data: {
          leagues: groupedStandings.leagues.map((league) => ({
            ...league,
            leagueId: league.leagueId.toString(),
            divisions: league.divisions.map((division) => ({
              ...division,
              divisionId: division.divisionId?.toString() || null,
              teams: division.teams.map((team) => ({
                ...team,
                teamId: team.teamId.toString(),
                leagueId: team.leagueId.toString(),
                divisionId: team.divisionId?.toString() || null,
              })),
            })),
          })),
        },
      });
    } else {
      const standings = await statisticsService.getStandings(accountId, seasonId);

      res.json({
        success: true,
        data: standings.map((team) => ({
          ...team,
          teamId: team.teamId.toString(),
          leagueId: team.leagueId.toString(),
          divisionId: team.divisionId?.toString() || null,
        })),
      });
    }
  }),
);

export default router;
