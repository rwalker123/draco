import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfScoreService = ServiceFactory.getGolfScoreService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId, contactId } = extractBigIntParams(req.params, 'seasonId', 'contactId');
    const scores = await golfScoreService.getPlayerSeasonScores(contactId, seasonId);
    res.json(scores);
  }),
);

export default router;
