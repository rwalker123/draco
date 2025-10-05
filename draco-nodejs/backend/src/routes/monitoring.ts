import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { monitoringHealthRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const monitoringService = ServiceFactory.getMonitoringService();
/**
 * GET /api/monitoring/health
 * Provides aggregated health details covering database connectivity, performance, and uptime.
 */
router.get(
  '/health',
  monitoringHealthRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { statusCode, body } = await monitoringService.getHealthOverview();

    res.status(statusCode).json(body);
  }),
);

/**
 * GET /api/monitoring/performance
 * Returns recent performance metrics, optionally scoped by a time window.
 */
router.get(
  '/performance',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const windowMinutes = parseInt(req.query.window as string) || 5;
    const response = await monitoringService.getPerformanceMetrics(windowMinutes);

    res.json(response);
  }),
);

/**
 * GET /api/monitoring/slow-queries
 * Lists recent slow database queries with optional limits.
 */
router.get(
  '/slow-queries',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const response = await monitoringService.getSlowQueries(limit);

    res.json(response);
  }),
);

/**
 * GET /api/monitoring/connection-pool
 * Reports current database connection pool utilization and recommendations.
 */
router.get(
  '/connection-pool',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const response = await monitoringService.getConnectionPoolDetails();

    res.json(response);
  }),
);

/**
 * POST /api/monitoring/reset
 * Clears collected monitoring statistics.
 */
router.post(
  '/reset',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const response = await monitoringService.resetMonitoringData();

    res.json(response);
  }),
);

/**
 * GET /api/monitoring/config
 * Returns current monitoring configuration values and system metadata.
 */
router.get(
  '/config',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const response = await monitoringService.getMonitoringConfiguration();

    res.json(response);
  }),
);

export default router;
