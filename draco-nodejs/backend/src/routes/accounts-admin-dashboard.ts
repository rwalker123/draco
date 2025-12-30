import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const adminDashboardService = ServiceFactory.getAdminDashboardService();

/**
 * GET /api/accounts/:accountId/admin/dashboard-summary
 * Get aggregated counts for admin dashboard cards
 */
router.get(
  '/:accountId/admin/dashboard-summary',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.dashboard.view'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const summary = await adminDashboardService.getDashboardSummary(BigInt(accountId));
    res.json(summary);
  }),
);

export default router;
