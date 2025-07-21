import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { StatisticsService } from '../services/statisticsService';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);
const statisticsService = new StatisticsService(prisma);

// Get league standings for a season
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const seasonId = BigInt(req.params.seasonId);

      const standings = await statisticsService.getStandings(accountId, seasonId);

      res.json({
        success: true,
        data: standings.map((team) => ({
          ...team,
          teamId: team.teamId.toString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching standings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch standings',
      });
    }
  },
);

export default router;
