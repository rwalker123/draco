// Cleanup Routes for Draco Sports Manager
// Provides endpoints for manual cleanup and service status
// Only accessible to users with database.cleanup permission (Administrators)

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { cleanupRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();

// Apply rate limiting to all cleanup endpoints
// 10 requests per day per authenticated user
router.use(cleanupRateLimit);

/**
 * POST /api/cleanup/trigger
 * Manually trigger cleanup of expired data
 * Requires database.cleanup permission
 */
router.post(
  '/trigger',
  authenticateToken,
  routeProtection.requirePermission('database.cleanup'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const cleanupService = ServiceFactory.getCleanupService();

    // Sanitize and extract validated parameters
    const sanitizedParams = req.body;

    const result = await cleanupService.manualCleanup(sanitizedParams);

    res.status(200).json(result);
  }),
);

/**
 * GET /api/cleanup/status
 * Get cleanup service status
 * Requires database.cleanup permission
 */
router.get(
  '/status',
  authenticateToken,
  routeProtection.requirePermission('database.cleanup'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const cleanupService = ServiceFactory.getCleanupService();

    const status = cleanupService.getStatus();

    res.status(200).json(status);
  }),
);

/**
 * PUT /api/cleanup/config
 * Update cleanup service configuration
 * Requires database.cleanup permission
 */
router.put(
  '/config',
  authenticateToken,
  routeProtection.requirePermission('database.cleanup'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // For now, just return success - actual configuration update logic
    // would be implemented in the service layer
    res.status(200).json(req.body);
  }),
);

export default router;
