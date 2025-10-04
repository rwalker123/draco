import { ConnectionPoolMetrics, DatabaseConfig, QueryMetrics } from '../config/database.js';
import { DateUtils } from '../utils/dateUtils.js';
import { dbMonitoringConnectivityResult } from '../repositories/index.js';

interface PerformanceQueryPattern {
  pattern: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  slowCount: number;
}

interface PerformanceStats {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  maxDuration: number;
  queryPatterns: Map<string, PerformanceQueryPattern>;
}

interface PerformanceHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: PerformanceStats;
}

export interface MonitoringHealthResponse {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'unavailable';
    latency: number;
    connectionPool: {
      activeConnections: number;
      idleConnections: number;
      totalConnections: number;
      pendingRequests: number;
      configuration: {
        maxConnections: number;
        timeout: number;
        slowQueryThreshold: number;
      };
    };
  };
  performance: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    queries: PerformanceStats;
  };
  environment: string;
}

export interface MonitoringPerformanceResponse {
  timeWindow: string;
  timestamp: string;
  summary: {
    totalQueries: number;
    slowQueries: number;
    slowQueryPercentage: string;
    averageDuration: number;
  };
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  connectionPool: ConnectionPoolMetrics;
  slowQueries: Array<{
    duration: number;
    query: string;
    timestamp: Date;
    model?: string;
    operation?: string;
  }>;
  queryPatterns: Record<
    string,
    {
      pattern: string;
      count: number;
      totalDuration: number;
      averageDuration: number;
      slowCount: number;
    }
  >;
  configuration: {
    slowQueryThreshold: number;
    loggingEnabled: boolean;
  };
}

export interface MonitoringSlowQueriesResponse {
  timestamp: string;
  threshold: number;
  count: number;
  queries: Array<{
    duration: number;
    query: string;
    timestamp: Date;
    model?: string;
    operation?: string;
    params?: unknown;
  }>;
}

export interface MonitoringConnectionPoolResponse {
  timestamp: string;
  metrics: ConnectionPoolMetrics;
  configuration: {
    maxConnections: number;
    timeout: number;
  };
  utilization: {
    active: string;
    idle: string;
  };
  recommendations: string[];
}

export interface MonitoringResetResponse {
  message: string;
  timestamp: string;
}

export interface MonitoringConfigResponse {
  timestamp: string;
  configuration: {
    connectionLimit: number;
    poolTimeout: number;
    slowQueryThreshold: number;
    enableQueryLogging: boolean;
    logLevel: string[];
    environment: string;
  };
  systemInfo: {
    nodeVersion: string;
    platform: NodeJS.Platform;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export class MonitoringResponseFormatter {
  static formatHealthResponse(params: {
    timestamp: Date;
    uptimeSeconds: number;
    connectionPool: ConnectionPoolMetrics;
    databaseConfig: DatabaseConfig;
    healthStatus: PerformanceHealthStatus;
    dbLatency: number;
    connectivityResult: dbMonitoringConnectivityResult;
    environment: string;
  }): MonitoringHealthResponse {
    const { connectionPool, databaseConfig, healthStatus, dbLatency, connectivityResult } = params;

    const isConnected = connectivityResult.connectivity_test === 1;

    return {
      status: healthStatus.status,
      timestamp: DateUtils.formatDateTimeForResponse(params.timestamp),
      uptime: params.uptimeSeconds,
      database: {
        status: isConnected ? 'connected' : 'unavailable',
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
      environment: params.environment,
    };
  }

  static formatPerformanceResponse(params: {
    windowMinutes: number;
    stats: PerformanceStats;
    slowQueries: QueryMetrics[];
    connectionPool: ConnectionPoolMetrics;
    databaseConfig: DatabaseConfig;
    timestamp: Date;
  }): MonitoringPerformanceResponse {
    const { windowMinutes, stats, slowQueries, connectionPool, databaseConfig, timestamp } = params;

    const slowQueryPercentage = stats.totalQueries
      ? ((stats.slowQueries / stats.totalQueries) * 100).toFixed(2)
      : '0.00';

    const queryPatterns = Object.fromEntries(stats.queryPatterns);

    return {
      timeWindow: `${windowMinutes} minutes`,
      timestamp: DateUtils.formatDateTimeForResponse(timestamp),
      summary: {
        totalQueries: stats.totalQueries,
        slowQueries: stats.slowQueries,
        slowQueryPercentage,
        averageDuration: Number(stats.averageDuration.toFixed(2)),
      },
      percentiles: {
        p50: Number(stats.p50Duration.toFixed(2)),
        p95: Number(stats.p95Duration.toFixed(2)),
        p99: Number(stats.p99Duration.toFixed(2)),
        max: Number(stats.maxDuration.toFixed(2)),
      },
      connectionPool,
      slowQueries: slowQueries.map((query) => ({
        duration: Number(query.duration.toFixed(2)),
        query: query.query.substring(0, 100) + (query.query.length > 100 ? '...' : ''),
        timestamp: query.timestamp,
        model: query.model,
        operation: query.operation,
      })),
      queryPatterns,
      configuration: {
        slowQueryThreshold: databaseConfig.slowQueryThreshold,
        loggingEnabled: databaseConfig.enableQueryLogging,
      },
    };
  }

  static formatSlowQueriesResponse(params: {
    slowQueries: QueryMetrics[];
    databaseConfig: DatabaseConfig;
    timestamp: Date;
  }): MonitoringSlowQueriesResponse {
    const { slowQueries, databaseConfig, timestamp } = params;

    return {
      timestamp: DateUtils.formatDateTimeForResponse(timestamp),
      threshold: databaseConfig.slowQueryThreshold,
      count: slowQueries.length,
      queries: slowQueries.map((query) => ({
        duration: Number(query.duration.toFixed(2)),
        query: query.query,
        timestamp: query.timestamp,
        model: query.model,
        operation: query.operation,
        params: query.params,
      })),
    };
  }

  static formatConnectionPoolResponse(params: {
    timestamp: Date;
    metrics: ConnectionPoolMetrics;
    databaseConfig: DatabaseConfig;
    recommendations: string[];
  }): MonitoringConnectionPoolResponse {
    const { timestamp, metrics, databaseConfig, recommendations } = params;

    const totalConnections = metrics.totalConnections || 1;

    return {
      timestamp: DateUtils.formatDateTimeForResponse(timestamp),
      metrics,
      configuration: {
        maxConnections: databaseConfig.connectionLimit,
        timeout: databaseConfig.poolTimeout,
      },
      utilization: {
        active: ((metrics.activeConnections / totalConnections) * 100).toFixed(1),
        idle: ((metrics.idleConnections / totalConnections) * 100).toFixed(1),
      },
      recommendations,
    };
  }

  static formatResetResponse(params: {
    timestamp: Date;
    message: string;
  }): MonitoringResetResponse {
    const { timestamp, message } = params;

    return {
      message,
      timestamp: DateUtils.formatDateTimeForResponse(timestamp),
    };
  }

  static formatConfigResponse(params: {
    timestamp: Date;
    configuration: MonitoringConfigResponse['configuration'];
    systemInfo: MonitoringConfigResponse['systemInfo'];
  }): MonitoringConfigResponse {
    const { timestamp, configuration, systemInfo } = params;

    return {
      timestamp: DateUtils.formatDateTimeForResponse(timestamp),
      configuration,
      systemInfo,
    };
  }
}
