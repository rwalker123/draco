import { performanceMonitor } from '../performanceMonitor';
import { QueryMetrics } from '../../config/database';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset performance monitor before each test
    performanceMonitor.reset();
  });

  describe('recordQuery', () => {
    it('should record a query successfully', () => {
      const queryMetrics: QueryMetrics = {
        duration: 150,
        query: 'SELECT * FROM users WHERE id = $1',
        timestamp: new Date(),
        model: 'User',
        operation: 'findUnique',
      };

      performanceMonitor.recordQuery(queryMetrics);
      const stats = performanceMonitor.getStats();

      expect(stats.totalQueries).toBe(1);
      expect(stats.averageDuration).toBe(150);
      expect(stats.slowQueries).toBe(0);
    });

    it('should identify slow queries correctly', () => {
      const slowQuery: QueryMetrics = {
        duration: 2000, // 2 seconds - definitely slow
        query: 'SELECT * FROM large_table',
        timestamp: new Date(),
        model: 'LargeTable',
        operation: 'findMany',
      };

      performanceMonitor.recordQuery(slowQuery);
      const stats = performanceMonitor.getStats();

      expect(stats.totalQueries).toBe(1);
      expect(stats.slowQueries).toBe(1);
      expect(stats.maxDuration).toBe(2000);
    });

    it('should track multiple queries and calculate percentiles', () => {
      const queries = [
        { duration: 100 },
        { duration: 200 },
        { duration: 300 },
        { duration: 400 },
        { duration: 500 },
      ];

      queries.forEach((query, index) => {
        performanceMonitor.recordQuery({
          duration: query.duration,
          query: `Query ${index}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      });

      const stats = performanceMonitor.getStats();

      expect(stats.totalQueries).toBe(5);
      expect(stats.averageDuration).toBe(300);
      expect(stats.p50Duration).toBe(300);
      expect(stats.maxDuration).toBe(500);
    });
  });

  describe('getStats', () => {
    it('should return empty stats when no queries recorded', () => {
      const stats = performanceMonitor.getStats();

      expect(stats.totalQueries).toBe(0);
      expect(stats.slowQueries).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.p50Duration).toBe(0);
      expect(stats.p95Duration).toBe(0);
      expect(stats.p99Duration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.queryPatterns.size).toBe(0);
    });

    it('should respect time window filtering', async () => {
      // Add an old query
      const oldQuery: QueryMetrics = {
        duration: 100,
        query: 'Old query',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        model: 'Old',
        operation: 'old',
      };

      // Add a recent query
      const recentQuery: QueryMetrics = {
        duration: 200,
        query: 'Recent query',
        timestamp: new Date(),
        model: 'Recent',
        operation: 'recent',
      };

      performanceMonitor.recordQuery(oldQuery);
      performanceMonitor.recordQuery(recentQuery);

      // Get stats for last 5 minutes only
      const recentStats = performanceMonitor.getStats(5 * 60 * 1000);
      const allStats = performanceMonitor.getStats();

      expect(allStats.totalQueries).toBe(2);
      expect(recentStats.totalQueries).toBe(1);
      expect(recentStats.averageDuration).toBe(200);
    });
  });

  describe('getSlowQueries', () => {
    it('should return slow queries sorted by duration', () => {
      const queries = [
        { duration: 500 }, // not slow
        { duration: 1500 }, // slow
        { duration: 2500 }, // very slow
        { duration: 800 }, // not slow
        { duration: 1200 }, // slow
      ];

      queries.forEach((query, index) => {
        performanceMonitor.recordQuery({
          duration: query.duration,
          query: `Query ${index}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      });

      const slowQueries = performanceMonitor.getSlowQueries();

      expect(slowQueries).toHaveLength(3);
      expect(slowQueries[0].duration).toBe(2500); // Sorted by duration descending
      expect(slowQueries[1].duration).toBe(1500);
      expect(slowQueries[2].duration).toBe(1200);
    });

    it('should limit the number of returned slow queries', () => {
      // Add many slow queries
      for (let i = 0; i < 20; i++) {
        performanceMonitor.recordQuery({
          duration: 1500 + i * 10,
          query: `Slow query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      const slowQueries = performanceMonitor.getSlowQueries(5);
      expect(slowQueries).toHaveLength(5);
    });
  });

  describe('isPerformanceDegraded', () => {
    it('should detect performance degradation with high slow query ratio', () => {
      // Add many slow queries
      for (let i = 0; i < 8; i++) {
        performanceMonitor.recordQuery({
          duration: 1500, // slow
          query: `Slow query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      // Add few fast queries
      for (let i = 0; i < 2; i++) {
        performanceMonitor.recordQuery({
          duration: 100, // fast
          query: `Fast query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      // 80% slow queries should be considered degraded (> 10% threshold)
      expect(performanceMonitor.isPerformanceDegraded()).toBe(true);
    });

    it('should not detect degradation with good performance', () => {
      // Add many fast queries
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordQuery({
          duration: 100, // fast
          query: `Fast query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      expect(performanceMonitor.isPerformanceDegraded()).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status for good performance', () => {
      // Add some fast queries
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordQuery({
          duration: 200,
          query: `Query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      const health = performanceMonitor.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.message).toContain('normal');
    });

    it('should return warning status for elevated query times', () => {
      // Add queries with some slow ones
      for (let i = 0; i < 8; i++) {
        performanceMonitor.recordQuery({
          duration: 500, // ok
          query: `Query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      for (let i = 0; i < 2; i++) {
        performanceMonitor.recordQuery({
          duration: 1500, // slow
          query: `Slow query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      const health = performanceMonitor.getHealthStatus();

      expect(health.status).toBe('warning');
      expect(health.message).toContain('Elevated');
    });

    it('should return critical status for very poor performance', () => {
      // Add many slow queries
      for (let i = 0; i < 7; i++) {
        performanceMonitor.recordQuery({
          duration: 1500, // slow
          query: `Slow query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      for (let i = 0; i < 3; i++) {
        performanceMonitor.recordQuery({
          duration: 200, // fast
          query: `Fast query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      const health = performanceMonitor.getHealthStatus();

      expect(health.status).toBe('critical');
      expect(health.message).toContain('High percentage');
    });
  });

  describe('reset', () => {
    it('should clear all monitoring data', () => {
      // Add some queries
      for (let i = 0; i < 5; i++) {
        performanceMonitor.recordQuery({
          duration: 200,
          query: `Query ${i}`,
          timestamp: new Date(),
          model: 'Test',
          operation: 'test',
        });
      }

      expect(performanceMonitor.getStats().totalQueries).toBe(5);

      performanceMonitor.reset();

      expect(performanceMonitor.getStats().totalQueries).toBe(0);
    });
  });
});
