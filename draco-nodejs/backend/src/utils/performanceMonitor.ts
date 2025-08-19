import { QueryMetrics, ConnectionPoolMetrics, databaseConfig } from '../config/database.js';
import { DateUtils } from './dateUtils.js';

interface PerformanceStats {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  maxDuration: number;
  queryPatterns: Map<string, QueryPattern>;
}

interface QueryPattern {
  pattern: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  slowCount: number;
}

class PerformanceMonitor {
  private queryHistory: QueryMetrics[] = [];
  private readonly maxHistorySize = 1000;
  private startTime = Date.now();

  // Store query metrics
  recordQuery(metrics: QueryMetrics): void {
    this.queryHistory.push(metrics);

    // Keep history size manageable
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
    }

    // Log slow queries immediately
    if (metrics.duration > databaseConfig.slowQueryThreshold) {
      this.logSlowQuery(metrics);
    }
  }

  // Get performance statistics
  getStats(timeWindowMs?: number): PerformanceStats {
    const now = Date.now();
    const windowStart = timeWindowMs ? now - timeWindowMs : this.startTime;

    const relevantQueries = this.queryHistory.filter((q) => q.timestamp.getTime() >= windowStart);

    if (relevantQueries.length === 0) {
      return this.getEmptyStats();
    }

    const durations = relevantQueries.map((q) => q.duration).sort((a, b) => a - b);
    const slowQueries = relevantQueries.filter(
      (q) => q.duration > databaseConfig.slowQueryThreshold,
    );

    return {
      totalQueries: relevantQueries.length,
      slowQueries: slowQueries.length,
      averageDuration: this.calculateAverage(durations),
      p50Duration: this.calculatePercentile(durations, 0.5),
      p95Duration: this.calculatePercentile(durations, 0.95),
      p99Duration: this.calculatePercentile(durations, 0.99),
      maxDuration: Math.max(...durations),
      queryPatterns: this.analyzeQueryPatterns(relevantQueries),
    };
  }

  // Get slow queries from recent history
  getSlowQueries(count = 10): QueryMetrics[] {
    return this.queryHistory
      .filter((q) => q.duration > databaseConfig.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  // Get query patterns analysis
  private analyzeQueryPatterns(queries: QueryMetrics[]): Map<string, QueryPattern> {
    const patterns = new Map<string, QueryPattern>();

    queries.forEach((query) => {
      const pattern = this.extractQueryPattern(query.query);

      if (patterns.has(pattern)) {
        const existing = patterns.get(pattern)!;
        existing.count++;
        existing.totalDuration += query.duration;
        existing.averageDuration = existing.totalDuration / existing.count;
        if (query.duration > databaseConfig.slowQueryThreshold) {
          existing.slowCount++;
        }
      } else {
        patterns.set(pattern, {
          pattern,
          count: 1,
          totalDuration: query.duration,
          averageDuration: query.duration,
          slowCount: query.duration > databaseConfig.slowQueryThreshold ? 1 : 0,
        });
      }
    });

    return patterns;
  }

  // Extract a pattern from SQL query for grouping
  private extractQueryPattern(query: string): string {
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  // Calculate percentile
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * percentile) - 1;
    return values[Math.max(0, index)];
  }

  // Calculate average
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Log slow query with details
  private logSlowQuery(metrics: QueryMetrics): void {
    const { duration, query, timestamp, model, operation } = metrics;

    console.warn(`
🐌 SLOW QUERY DETECTED
├─ Duration: ${duration.toFixed(2)}ms (threshold: ${databaseConfig.slowQueryThreshold}ms)
├─ Time: ${DateUtils.formatDateTimeForResponse(timestamp)}
├─ Model: ${model || 'Unknown'}
├─ Operation: ${operation || 'Unknown'}
├─ Query: ${query.substring(0, 200)}${query.length > 200 ? '...' : ''}
└─ Recommendation: Consider adding indexes or optimizing this query
    `);
  }

  // Get empty stats structure
  private getEmptyStats(): PerformanceStats {
    return {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      maxDuration: 0,
      queryPatterns: new Map(),
    };
  }

  // Reset monitoring data
  reset(): void {
    this.queryHistory = [];
    this.startTime = Date.now();
  }

  // Check if system is experiencing performance issues
  isPerformanceDegraded(): boolean {
    const recentStats = this.getStats(300000); // Last 5 minutes

    if (recentStats.totalQueries < 10) {
      return false; // Not enough data
    }

    // Check if more than 10% of queries are slow
    const slowQueryRatio = recentStats.slowQueries / recentStats.totalQueries;

    // Check if p95 is significantly higher than threshold
    const p95Degraded = recentStats.p95Duration > databaseConfig.slowQueryThreshold * 2;

    return slowQueryRatio > 0.1 || p95Degraded;
  }

  // Get health status
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    metrics: PerformanceStats;
  } {
    const stats = this.getStats(300000); // Last 5 minutes

    if (stats.totalQueries === 0) {
      return {
        status: 'healthy',
        message: 'No recent database activity',
        metrics: stats,
      };
    }

    const slowQueryRatio = stats.slowQueries / stats.totalQueries;

    if (slowQueryRatio > 0.2 || stats.p99Duration > databaseConfig.slowQueryThreshold * 5) {
      return {
        status: 'critical',
        message: `High percentage of slow queries (${(slowQueryRatio * 100).toFixed(1)}%)`,
        metrics: stats,
      };
    }

    if (slowQueryRatio > 0.1 || stats.p95Duration > databaseConfig.slowQueryThreshold * 2) {
      return {
        status: 'warning',
        message: `Elevated query times detected`,
        metrics: stats,
      };
    }

    return {
      status: 'healthy',
      message: 'Database performance is normal',
      metrics: stats,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function to get connection pool metrics (simulated for now)
export const getConnectionPoolMetrics = (): ConnectionPoolMetrics => {
  // In a real implementation, this would get actual metrics from Prisma
  // For now, we'll return simulated data
  return {
    activeConnections: Math.floor(Math.random() * databaseConfig.connectionLimit),
    idleConnections: Math.floor(Math.random() * (databaseConfig.connectionLimit / 2)),
    totalConnections: databaseConfig.connectionLimit,
    pendingRequests: Math.floor(Math.random() * 5),
  };
};
