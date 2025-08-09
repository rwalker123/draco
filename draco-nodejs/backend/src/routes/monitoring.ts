import { Router, Request, Response } from 'express';
import { performanceMonitor, getConnectionPoolMetrics } from '../utils/performanceMonitor.js';
import { databaseConfig } from '../config/database.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Get comprehensive system health status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, warning, critical]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                 performance:
 *                   type: object
 *                 uptime:
 *                   type: number
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connectivity
    await prisma.$queryRaw`SELECT 1 as connectivity_test`;
    const dbLatency = Date.now() - startTime;

    // Get performance metrics
    const healthStatus = performanceMonitor.getHealthStatus();
    const connectionPool = getConnectionPoolMetrics();

    // Calculate uptime
    const uptime = process.uptime();

    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: uptime,
      database: {
        status: 'connected',
        latency: dbLatency,
        connectionPool: {
          ...connectionPool,
          configuration: {
            maxConnections: databaseConfig.connectionLimit,
            timeout: databaseConfig.poolTimeout,
            slowQueryThreshold: databaseConfig.slowQueryThreshold,
          },
        },
      },
      performance: {
        status: healthStatus.status,
        message: healthStatus.message,
        queries: healthStatus.metrics,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Set appropriate HTTP status based on health
    const statusCode =
      healthStatus.status === 'critical' ? 503 : healthStatus.status === 'warning' ? 200 : 200;

    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Database connectivity failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/monitoring/performance:
 *   get:
 *     summary: Get detailed performance metrics
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: window
 *         schema:
 *           type: integer
 *         description: Time window in minutes (default 5)
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/performance', (req: Request, res: Response) => {
  try {
    const windowMinutes = parseInt(req.query.window as string) || 5;
    const windowMs = windowMinutes * 60 * 1000;

    const stats = performanceMonitor.getStats(windowMs);
    const slowQueries = performanceMonitor.getSlowQueries(10);
    const connectionPool = getConnectionPoolMetrics();

    // Convert Map to object for JSON serialization
    const queryPatterns = Object.fromEntries(stats.queryPatterns);

    res.json({
      timeWindow: `${windowMinutes} minutes`,
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: stats.totalQueries,
        slowQueries: stats.slowQueries,
        slowQueryPercentage:
          stats.totalQueries > 0
            ? ((stats.slowQueries / stats.totalQueries) * 100).toFixed(2)
            : '0.00',
        averageDuration: parseFloat(stats.averageDuration.toFixed(2)),
      },
      percentiles: {
        p50: parseFloat(stats.p50Duration.toFixed(2)),
        p95: parseFloat(stats.p95Duration.toFixed(2)),
        p99: parseFloat(stats.p99Duration.toFixed(2)),
        max: parseFloat(stats.maxDuration.toFixed(2)),
      },
      connectionPool,
      slowQueries: slowQueries.map((q) => ({
        duration: parseFloat(q.duration.toFixed(2)),
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        timestamp: q.timestamp,
        model: q.model,
        operation: q.operation,
      })),
      queryPatterns,
      configuration: {
        slowQueryThreshold: databaseConfig.slowQueryThreshold,
        loggingEnabled: databaseConfig.enableQueryLogging,
      },
    });
  } catch (error) {
    console.error('Performance metrics failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/monitoring/slow-queries:
 *   get:
 *     summary: Get recent slow queries
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of queries to return (default 20)
 *     responses:
 *       200:
 *         description: List of slow queries
 */
router.get('/slow-queries', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const slowQueries = performanceMonitor.getSlowQueries(limit);

    res.json({
      timestamp: new Date().toISOString(),
      threshold: databaseConfig.slowQueryThreshold,
      count: slowQueries.length,
      queries: slowQueries.map((q) => ({
        duration: parseFloat(q.duration.toFixed(2)),
        query: q.query,
        timestamp: q.timestamp,
        model: q.model,
        operation: q.operation,
        params: q.params,
      })),
    });
  } catch (error) {
    console.error('Slow queries retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve slow queries',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/monitoring/connection-pool:
 *   get:
 *     summary: Get connection pool status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Connection pool metrics
 */
router.get('/connection-pool', (req: Request, res: Response) => {
  try {
    const metrics = getConnectionPoolMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
      configuration: {
        maxConnections: databaseConfig.connectionLimit,
        timeout: databaseConfig.poolTimeout,
      },
      utilization: {
        active: ((metrics.activeConnections / metrics.totalConnections) * 100).toFixed(1),
        idle: ((metrics.idleConnections / metrics.totalConnections) * 100).toFixed(1),
      },
      recommendations: getConnectionPoolRecommendations(metrics),
    });
  } catch (error) {
    console.error('Connection pool metrics failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve connection pool metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function for connection pool recommendations
function getConnectionPoolRecommendations(metrics: {
  activeConnections: number;
  totalConnections: number;
  pendingRequests: number;
}): string[] {
  const recommendations: string[] = [];

  const utilizationRate = metrics.activeConnections / metrics.totalConnections;

  if (utilizationRate > 0.9) {
    recommendations.push('Consider increasing connection pool size - high utilization detected');
  }

  if (metrics.pendingRequests > 5) {
    recommendations.push('High number of pending requests - consider optimizing query performance');
  }

  if (utilizationRate < 0.2 && metrics.totalConnections > 5) {
    recommendations.push('Low connection utilization - consider reducing pool size');
  }

  if (recommendations.length === 0) {
    recommendations.push('Connection pool configuration appears optimal');
  }

  return recommendations;
}

/**
 * @swagger
 * /api/monitoring/reset:
 *   post:
 *     summary: Reset performance monitoring data
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Monitoring data reset successfully
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    performanceMonitor.reset();

    res.json({
      message: 'Performance monitoring data reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Reset monitoring data failed:', error);
    res.status(500).json({
      error: 'Failed to reset monitoring data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/monitoring/config:
 *   get:
 *     summary: Get current monitoring configuration
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Current monitoring configuration
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      configuration: {
        connectionLimit: databaseConfig.connectionLimit,
        poolTimeout: databaseConfig.poolTimeout,
        slowQueryThreshold: databaseConfig.slowQueryThreshold,
        enableQueryLogging: databaseConfig.enableQueryLogging,
        logLevel: databaseConfig.logLevel,
        environment: process.env.NODE_ENV || 'development',
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    console.error('Get config failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
