import { Prisma } from '@prisma/client';
import os from 'node:os';

export interface DatabaseConfig {
  connectionLimit: number;
  poolTimeout: number;
  slowQueryThreshold: number;
  enableQueryLogging: boolean;
  logLevel: Prisma.LogLevel[];
}

export interface QueryMetrics {
  duration: number;
  query: string;
  timestamp: Date;
  params?: unknown;
  model?: string;
  operation?: string;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  pendingRequests: number;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableQueryLogging = process.env.ENABLE_QUERY_LOGGING === 'true';

  // Calculate optimal connection limit based on CPU cores
  const defaultConnectionLimit = Math.max(
    parseInt(process.env.CONNECTION_POOL_SIZE || '0') || os.cpus().length * 2 + 1,
    5,
  );

  // Configure log levels based on environment and query logging preference
  const logLevel: Prisma.LogLevel[] = isDevelopment
    ? enableQueryLogging
      ? ['query', 'error', 'warn', 'info']
      : ['error', 'warn', 'info']
    : enableQueryLogging
      ? ['query', 'error', 'warn']
      : ['error', 'warn'];

  return {
    connectionLimit: defaultConnectionLimit,
    poolTimeout: parseInt(process.env.POOL_TIMEOUT_SECONDS || '20'),
    slowQueryThreshold: parseInt(
      process.env.SLOW_QUERY_THRESHOLD_MS || (isProduction ? '500' : '1000'),
    ),
    enableQueryLogging,
    logLevel,
  };
};

export const buildConnectionUrl = (baseUrl: string, config: DatabaseConfig): string => {
  const url = new URL(baseUrl);

  // Add connection pool parameters
  url.searchParams.set('connection_limit', config.connectionLimit.toString());
  url.searchParams.set('pool_timeout', config.poolTimeout.toString());

  // Add PostgreSQL specific optimizations
  if (!url.searchParams.has('schema')) {
    url.searchParams.set('schema', 'public');
  }

  // Connection management settings
  url.searchParams.set('pgbouncer', 'true');
  url.searchParams.set('connect_timeout', '10');
  url.searchParams.set('socket_timeout', '30');

  return url.toString();
};

export const databaseConfig = getDatabaseConfig();

export const formatQueryLog = (query: QueryMetrics): string => {
  const { duration, query: sql, timestamp, model, operation } = query;
  const durationMs = duration.toFixed(2);
  const isSlowQuery = duration > databaseConfig.slowQueryThreshold;

  const logLevel = isSlowQuery ? 'SLOW QUERY' : 'QUERY';
  const modelOp = model && operation ? `${model}.${operation}` : 'RAW';

  return `[${logLevel}] ${timestamp.toISOString()} - ${modelOp} (${durationMs}ms): ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`;
};

export const isSlowQuery = (duration: number): boolean => {
  return duration > databaseConfig.slowQueryThreshold;
};
