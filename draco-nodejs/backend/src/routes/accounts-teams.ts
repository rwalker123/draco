import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const teamService = ServiceFactory.getTeamService();

/**
 * DELETE /api/accounts/:accountId/teams/:teamId
 * Delete a team definition when it is no longer associated with any seasons.
 */
router.delete(
  '/:teamId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamId } = extractBigIntParams(req.params, 'teamId');

    await teamService.deleteTeam(accountId, teamId);

    res.status(204).end();
  }),
);

export default router;
