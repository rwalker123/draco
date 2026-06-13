import { Router, Request, Response, NextFunction } from 'express';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { sendCsvDownload } from '../utils/csvResponse.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
const teamStatsService = ServiceFactory.getTeamStatsService();
const csvExportService = ServiceFactory.getCsvExportService();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const teams = await teamStatsService.getAllTimeTeams(accountId);
    res.json(teams);
  }),
);

router.get(
  '/:teamId/batting-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, teamId } = extractBigIntParams(req.params, 'accountId', 'teamId');
    const stats = await teamStatsService.getAllTimeTeamBattingStats(teamId, accountId);
    res.json(stats);
  }),
);

router.get(
  '/:teamId/batting-stats/export',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, teamId } = extractBigIntParams(req.params, 'accountId', 'teamId');
    const stats = await teamStatsService.getAllTimeTeamBattingStats(teamId, accountId);
    const result = await csvExportService.exportBattingStatistics(
      stats,
      'all-time-team-batting-statistics',
    );
    sendCsvDownload(res, result.fileName, result.buffer);
  }),
);

router.get(
  '/:teamId/pitching-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, teamId } = extractBigIntParams(req.params, 'accountId', 'teamId');
    const stats = await teamStatsService.getAllTimeTeamPitchingStats(teamId, accountId);
    res.json(stats);
  }),
);

router.get(
  '/:teamId/pitching-stats/export',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, teamId } = extractBigIntParams(req.params, 'accountId', 'teamId');
    const stats = await teamStatsService.getAllTimeTeamPitchingStats(teamId, accountId);
    const result = await csvExportService.exportPitchingStatistics(
      stats,
      'all-time-team-pitching-statistics',
    );
    sendCsvDownload(res, result.fileName, result.buffer);
  }),
);

export default router;
