import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../utils/performanceMonitor.js';
import { databaseConfig } from '../config/database.js';

// Extend Express Request to include timing and query tracking
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
      queryCount?: number;
      queryDuration?: number;
    }
  }
}

// Generate a unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Middleware to track request timing and database queries
export const queryLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for health checks and static assets
  if (
    req.path === '/health' ||
    req.path.startsWith('/uploads/') ||
    req.path.startsWith('/apidocs/')
  ) {
    return next();
  }

  // Initialize request tracking
  req.startTime = Date.now();
  req.requestId = generateRequestId();
  req.queryCount = 0;
  req.queryDuration = 0;

  // Override the response end to log request completion
  const originalEnd = res.end.bind(res);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (...args: any[]) {
    const duration = Date.now() - (req.startTime || Date.now());
    const isSlowRequest = duration > 2000; // 2 seconds threshold for slow requests

    // Log request summary if enabled
    if (
      databaseConfig.enableQueryLogging &&
      (isSlowRequest || process.env.NODE_ENV === 'development')
    ) {
      const logLevel = isSlowRequest ? 'SLOW REQUEST' : 'REQUEST';
      const emoji = isSlowRequest ? '🐌' : '⚡';

      console.log(`${emoji} [${logLevel}] ${req.requestId} - ${req.method} ${req.path}`);
      console.log(`├─ Duration: ${duration}ms`);
      console.log(`├─ Status: ${res.statusCode}`);
      console.log(`├─ DB Queries: ${req.queryCount || 0}`);
      console.log(`└─ DB Duration: ${(req.queryDuration || 0).toFixed(2)}ms`);

      if (isSlowRequest) {
        console.warn(`⚠️  Request exceeded 2s threshold - consider optimization`);
      }
    }

    // Call the original end method
    return originalEnd(...args);
  };

  next();
};

// Middleware to track specific route performance
export const routePerformanceTracker = (routeName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Override response end to track route-specific metrics
    const originalEnd = res.end.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;

      // Track route performance if it's slow
      if (duration > 1000) {
        // 1 second threshold for route tracking
        console.warn(`🚀 [SLOW ROUTE] ${routeName}`);
        console.warn(`├─ Route: ${req.method} ${req.path}`);
        console.warn(`├─ Duration: ${duration}ms`);
        console.warn(`├─ Request ID: ${req.requestId}`);
        console.warn(`└─ Consider caching or optimization`);
      }

      return originalEnd(...args);
    };

    next();
  };
};

// Database health check middleware
export const databaseHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Only run on health check endpoint
  if (req.path !== '/health') {
    return next();
  }

  try {
    const startTime = Date.now();

    // Import prisma here to avoid circular dependencies
    const { default: prisma } = await import('../lib/prisma.js');

    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as health_check`;

    const dbLatency = Date.now() - startTime;
    const healthStatus = performanceMonitor.getHealthStatus();

    // Add database metrics to the response
    req.databaseHealth = {
      status: 'connected',
      latency: dbLatency,
      performance: healthStatus,
      connectionPool: {
        configured: databaseConfig.connectionLimit,
        timeout: databaseConfig.poolTimeout,
      },
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    req.databaseHealth = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  next();
};

// Extend Request interface for database health
declare global {
  namespace Express {
    interface Request {
      databaseHealth?: {
        status: string;
        latency?: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        performance?: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectionPool?: any;
        error?: string;
      };
    }
  }
}
