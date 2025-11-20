import PrismaPg from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { databaseConfig, buildConnectionUrl } from '../config/database.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';

// Declare global variable for PrismaClient instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Function to create extended Prisma client with performance monitoring
function createExtendedPrismaClient(basePrisma: PrismaClient) {
  return basePrisma.$extends({
    name: 'performance-monitor',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startTime = Date.now();

          try {
            const result = await query(args);
            const duration = Date.now() - startTime;

            // Record the query metrics in performance monitor
            performanceMonitor.recordQuery({
              duration,
              query: `${model}.${operation}`,
              timestamp: new Date(),
              params: args,
              model,
              operation,
            });

            return result;
          } catch (error) {
            const duration = Date.now() - startTime;

            // Record failed query
            performanceMonitor.recordQuery({
              duration,
              query: `FAILED: ${model}.${operation}`,
              timestamp: new Date(),
              params: args,
              model,
              operation,
            });

            throw error;
          }
        },
      },
    },
  });
}

// Type for the extended Prisma client
type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

// Build the connection URL with pool configuration
const baseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ezrecsports';
const connectionUrl = buildConnectionUrl(baseUrl, databaseConfig);
const adapter = new PrismaPg({ connectionString: connectionUrl });

// Create a singleton PrismaClient instance with enhanced configuration
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    adapter,
    log: databaseConfig.logLevel,
  });

// Note: We're using Prisma Client Extensions instead of deprecated middleware for better TypeScript support
// The extended client is available as a named export for specific use cases
export const extendedPrisma = createExtendedPrismaClient(prisma);

// In development, store the base instance on globalThis to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handling (safe for test mocks)
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle SIGINT and SIGTERM for graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export the base PrismaClient as default (for compatibility with existing code)
export default prisma;

// Export types for TypeScript consumers
export type { ExtendedPrismaClient };
