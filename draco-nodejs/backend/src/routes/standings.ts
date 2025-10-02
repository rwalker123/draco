import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractSeasonParams } from '../utils/paramExtraction.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { StandingsLeagueType, StandingsTeamType } from '@draco/shared-schemas';

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

      const result: StandingsLeagueType[] = groupedStandings.leagues.map((league) => ({
        league: { id: league.leagueId.toString(), name: league.leagueName },
        divisions: league.divisions.map((division) => ({
          division: {
            id: division.divisionId?.toString() || '',
            division: {
              id: division.divisionId?.toString() || '',
              name: division.divisionName || '',
            },
            priority: division.divisionPriority || 0,
          },
          teams: division.teams.map((team) => ({
            team: { id: team.teamId.toString(), name: team.teamName },
            w: team.w,
            l: team.l,
            t: team.t,
            pct: team.pct,
            gb: team.gb,
            divisionRecord: team.divisionRecord
              ? {
                  w: team.divisionRecord.w,
                  l: team.divisionRecord.l,
                  t: team.divisionRecord.t,
                }
              : undefined,
          })),
        })),
      }));

      res.json(result);
    } else {
      const standings = await statisticsService.getStandings(accountId, seasonId);

      const result: StandingsTeamType[] = standings.map((team) => ({
        team: { id: team.teamId.toString(), name: team.teamName },
        w: team.w,
        l: team.l,
        t: team.t,
        pct: team.pct,
        gb: team.gb,
        league: team.leagueId ? { id: team.leagueId.toString(), name: team.leagueName } : undefined,
        division: team.divisionId
          ? { id: team.divisionId.toString(), name: team.divisionName || '' }
          : undefined,
        divisionRecord: team.divisionRecord
          ? {
              w: team.divisionRecord.w,
              l: team.divisionRecord.l,
              t: team.divisionRecord.t,
            }
          : undefined,
      }));

      res.json(result);
    }
  }),
);

export default router;
