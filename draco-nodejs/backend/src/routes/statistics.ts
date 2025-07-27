import { Router, Request, Response } from 'express';
import { StatisticsService } from '../services/statisticsService';
import prisma from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../utils/customErrors';

const router = Router({ mergeParams: true });
const statisticsService = new StatisticsService(prisma);

// Get configured leader categories for an account (public endpoint)
router.get(
  '/leader-categories',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = BigInt(req.params.accountId);

    const categories = await statisticsService.getLeaderCategories(accountId);

    res.json({
      success: true,
      data: categories,
    });
  }),
);

// Get batting statistics for a league (public endpoint)
router.get(
  '/batting/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = BigInt(req.params.accountId);
    const leagueId = BigInt(req.params.leagueId);

    const filters = {
      leagueId,
      divisionId: req.query.divisionId ? BigInt(req.query.divisionId as string) : undefined,
      isHistorical: req.query.historical === 'true',
      sortField: (req.query.sortBy as string) || 'avg',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50,
      minAB: req.query.minAB ? parseInt(req.query.minAB as string) : 10,
    };

    const battingStats = await statisticsService.getBattingStats(accountId, filters);

    res.json({
      success: true,
      data: battingStats.map((stat) => ({
        ...stat,
        playerId: stat.playerId.toString(),
      })),
    });
  }),
);

// Get pitching statistics for a league (public endpoint)
router.get(
  '/pitching/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = BigInt(req.params.accountId);
    const leagueId = BigInt(req.params.leagueId);

    const filters = {
      leagueId,
      divisionId: req.query.divisionId ? BigInt(req.query.divisionId as string) : undefined,
      isHistorical: req.query.historical === 'true',
      sortField: (req.query.sortBy as string) || 'era',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50,
      minIP: req.query.minIP ? parseFloat(req.query.minIP as string) : 1.0,
    };

    const pitchingStats = await statisticsService.getPitchingStats(accountId, filters);

    res.json({
      success: true,
      data: pitchingStats.map((stat) => ({
        ...stat,
        playerId: stat.playerId.toString(),
      })),
    });
  }),
);

// Get statistical leaders (public endpoint)
router.get(
  '/leaders/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = BigInt(req.params.accountId);
    const category = req.query.category as string;

    if (!category) {
      throw new ValidationError('Category parameter is required');
    }

    const filters = {
      leagueId: BigInt(req.params.leagueId),
      divisionId: req.query.divisionId ? BigInt(req.query.divisionId as string) : undefined,
      isHistorical: req.query.historical === 'true',
    };

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const leaders = await statisticsService.getLeaders(accountId, category, filters, limit);

    res.json({
      success: true,
      data: leaders.map((leader) => ({
        ...leader,
        playerId: leader.playerId.toString(),
      })),
    });
  }),
);

export default router;
