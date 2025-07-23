import { Router, Request, Response } from 'express';
import { StatisticsService } from '../services/statisticsService';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
const statisticsService = new StatisticsService(prisma);

// Get league standings for a season (public endpoint)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = BigInt(req.params.accountId);
    const seasonId = BigInt(req.params.seasonId);
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
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch standings',
    });
  }
});

export default router;
