import { PrismaClient } from '@prisma/client';
import { databaseConfig, buildConnectionUrl } from '../config/database.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';

// Declare global variable for PrismaClient instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Build the connection URL with pool configuration
const baseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ezrecsports';
const connectionUrl = buildConnectionUrl(baseUrl, databaseConfig);

// Create a singleton PrismaClient instance with enhanced configuration
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: databaseConfig.logLevel,
  });

// Note: We're using Prisma middleware instead of event handlers for better TypeScript support

// Add Prisma middleware for performance tracking (safe for test mocks)
prisma.$use?.(async (params, next) => {
  const startTime = Date.now();

  try {
    const result = await next(params);
    const duration = Date.now() - startTime;

    // Record the query metrics in performance monitor
    performanceMonitor.recordQuery({
      duration,
      query: `${params.model}.${params.action}`,
      timestamp: new Date(),
      params: params.args,
      model: params.model,
      operation: params.action,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Record failed query
    performanceMonitor.recordQuery({
      duration,
      query: `FAILED: ${params.model}.${params.action}`,
      timestamp: new Date(),
      params: params.args,
      model: params.model,
      operation: params.action,
    });

    throw error;
  }
});

// In development, store the instance on globalThis to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handling (safe for test mocks)
process.on('beforeExit', async () => {
  await prisma.$disconnect?.();
});

// Handle SIGINT and SIGTERM for graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect?.();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect?.();
  process.exit(0);
});

export default prisma;
