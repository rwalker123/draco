import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfRosterService = ServiceFactory.getGolfRosterService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET /api/accounts/{accountId}/seasons/{seasonId}/golf/substitutes
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const subs = await golfRosterService.getSubstitutesForSeason(seasonId);
    res.json(subs);
  }),
);

export default router;
