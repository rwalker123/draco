import { ConnectionPoolMetrics, databaseConfig } from '../config/database.js';
import {
  MonitoringResponseFormatter,
  MonitoringHealthResponse,
  MonitoringPerformanceResponse,
  MonitoringSlowQueriesResponse,
  MonitoringConnectionPoolResponse,
  MonitoringResetResponse,
  MonitoringConfigResponse,
} from '../responseFormatters/index.js';
import { performanceMonitor, getConnectionPoolMetrics } from '../utils/performanceMonitor.js';
import { IMonitoringRepository, RepositoryFactory } from '../repositories/index.js';

export class MonitoringService {
  private readonly monitoringRepository: IMonitoringRepository;

  constructor() {
    this.monitoringRepository = RepositoryFactory.getMonitoringRepository();
  }

  async getHealthOverview(): Promise<{ statusCode: number; body: MonitoringHealthResponse }> {
    const startTime = Date.now();
    const connectivityResult = await this.monitoringRepository.testDatabaseConnectivity();
    const dbLatency = Date.now() - startTime;

    const healthStatus = performanceMonitor.getHealthStatus();
    const connectionPool = getConnectionPoolMetrics();

    const body = MonitoringResponseFormatter.formatHealthResponse({
      timestamp: new Date(),
      uptimeSeconds: process.uptime(),
      connectionPool,
      databaseConfig,
      healthStatus,
      dbLatency,
      connectivityResult,
      environment: process.env.NODE_ENV || 'development',
    });

    const statusCode = healthStatus.status === 'critical' ? 503 : 200;

    return { statusCode, body };
  }

  async getPerformanceMetrics(windowMinutes: number): Promise<MonitoringPerformanceResponse> {
    const windowMs = windowMinutes * 60 * 1000;
    const stats = performanceMonitor.getStats(windowMs);
    const slowQueries = performanceMonitor.getSlowQueries(10);
    const connectionPool = getConnectionPoolMetrics();

    return MonitoringResponseFormatter.formatPerformanceResponse({
      windowMinutes,
      stats,
      slowQueries,
      connectionPool,
      databaseConfig,
      timestamp: new Date(),
    });
  }

  async getSlowQueries(limit: number): Promise<MonitoringSlowQueriesResponse> {
    const slowQueries = performanceMonitor.getSlowQueries(limit);

    return MonitoringResponseFormatter.formatSlowQueriesResponse({
      slowQueries,
      databaseConfig,
      timestamp: new Date(),
    });
  }

  async getConnectionPoolDetails(): Promise<MonitoringConnectionPoolResponse> {
    const metrics = getConnectionPoolMetrics();
    const recommendations = this.buildConnectionPoolRecommendations(metrics);

    return MonitoringResponseFormatter.formatConnectionPoolResponse({
      timestamp: new Date(),
      metrics,
      databaseConfig,
      recommendations,
    });
  }

  async resetMonitoringData(): Promise<MonitoringResetResponse> {
    performanceMonitor.reset();

    return MonitoringResponseFormatter.formatResetResponse({
      message: 'Performance monitoring data reset successfully',
      timestamp: new Date(),
    });
  }

  async getMonitoringConfiguration(): Promise<MonitoringConfigResponse> {
    return MonitoringResponseFormatter.formatConfigResponse({
      timestamp: new Date(),
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
  }

  private buildConnectionPoolRecommendations(metrics: ConnectionPoolMetrics): string[] {
    if (metrics.totalConnections <= 0) {
      return ['Connection pool metrics are unavailable'];
    }

    const recommendations: string[] = [];
    const utilizationRate = metrics.activeConnections / metrics.totalConnections;

    if (utilizationRate > 0.9) {
      recommendations.push('Consider increasing connection pool size - high utilization detected');
    }

    if (metrics.pendingRequests > 5) {
      recommendations.push(
        'High number of pending requests - consider optimizing query performance',
      );
    }

    if (utilizationRate < 0.2 && metrics.totalConnections > 5) {
      recommendations.push('Low connection utilization - consider reducing pool size');
    }

    if (recommendations.length === 0) {
      recommendations.push('Connection pool configuration appears optimal');
    }

    return recommendations;
  }
}
