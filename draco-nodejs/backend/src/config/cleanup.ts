// Cleanup Configuration Factory
// Follows DIP - depends on environment variables, no secrets in code

import { ICleanupConfig } from '../interfaces/cleanupInterfaces.js';

/**
 * Get cleanup configuration based on environment variables
 * All values have sensible defaults for development
 */
export const getCleanupConfig = (): ICleanupConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return {
    // Batch size for processing records (default: 25, max: 100 in production)
    batchSize: Math.min(
      parseInt(process.env.CLEANUP_BATCH_SIZE || '25'),
      isProduction ? 100 : 1000,
    ),

    // Hour of day to run cleanup (0-23, default: 2 AM)
    cleanupHour: Math.max(0, Math.min(23, parseInt(process.env.CLEANUP_HOUR || '2'))),

    // Interval between cleanups in milliseconds (default: 24 hours)
    cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '24') * 60 * 60 * 1000,

    // Number of days after which records expire (default: 45 days)
    expirationDays: Math.max(1, parseInt(process.env.CLEANUP_EXPIRATION_DAYS || '45')),
  };
};

/**
 * Default cleanup configuration for development
 */
export const defaultCleanupConfig: ICleanupConfig = {
  batchSize: 25,
  cleanupHour: 2,
  cleanupIntervalMs: 24 * 60 * 60 * 1000,
  expirationDays: 45,
};

/**
 * Production cleanup configuration with stricter limits
 */
export const productionCleanupConfig: ICleanupConfig = {
  batchSize: 25,
  cleanupHour: 2,
  cleanupIntervalMs: 24 * 60 * 60 * 1000,
  expirationDays: 45,
};

/**
 * Export the main configuration function
 */
export const cleanupConfig = getCleanupConfig();
