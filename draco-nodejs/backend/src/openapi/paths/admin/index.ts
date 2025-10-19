import { RegisterContext } from '../../openapiTypes.js';

const registerAdminAnalyticsEndpoints = ({ registry, z }: RegisterContext) => {
  const accountStorageMetricSchema = z.object({
    accountId: z.string().openapi({ example: '42' }),
    accountName: z.string().openapi({ example: 'Springfield Tigers' }),
    attachmentBytes: z.number().nonnegative().openapi({ example: 1048576 }),
    attachmentCount: z.number().nonnegative().openapi({ example: 12 }),
  });

  const accountEmailMetricSchema = z.object({
    accountId: z.string().openapi({ example: '42' }),
    accountName: z.string().openapi({ example: 'Springfield Tigers' }),
    emailCount: z.number().nonnegative().openapi({ example: 28 }),
    totalRecipients: z.number().nonnegative().openapi({ example: 1850 }),
    successfulDeliveries: z.number().nonnegative().openapi({ example: 1800 }),
    failedDeliveries: z.number().nonnegative().openapi({ example: 12 }),
    bounceCount: z.number().nonnegative().openapi({ example: 5 }),
    openCount: z.number().nonnegative().openapi({ example: 1400 }),
    clickCount: z.number().nonnegative().openapi({ example: 520 }),
    lastSentAt: z.string().datetime().nullable().openapi({ example: '2025-01-15T18:24:00.000Z' }),
    deliverySuccessRate: z.number().min(0).max(100).openapi({ example: 97.3 }),
    openRate: z.number().min(0).max(100).openapi({ example: 75.7 }),
    clickRate: z.number().min(0).max(100).openapi({ example: 28.1 }),
  });

  const monitoringHealthSchema = z.object({
    status: z.enum(['healthy', 'warning', 'critical']),
    timestamp: z.string().openapi({ format: 'date-time' }),
    uptime: z.number().nonnegative(),
    database: z.object({
      status: z.enum(['connected', 'unavailable']),
      latency: z.number().nonnegative(),
      connectionPool: z.object({
        activeConnections: z.number().int().nonnegative(),
        idleConnections: z.number().int().nonnegative(),
        totalConnections: z.number().int().nonnegative(),
        pendingRequests: z.number().int().nonnegative(),
        configuration: z.object({
          maxConnections: z.number().int().nonnegative(),
          timeout: z.number().int().nonnegative(),
          slowQueryThreshold: z.number().int().nonnegative(),
        }),
      }),
    }),
    performance: z.object({
      status: z.enum(['healthy', 'warning', 'critical']),
      message: z.string(),
      queries: z.object({
        totalQueries: z.number().int().nonnegative(),
        slowQueries: z.number().int().nonnegative(),
        averageDuration: z.number().nonnegative(),
        p50Duration: z.number().nonnegative(),
        p95Duration: z.number().nonnegative(),
        p99Duration: z.number().nonnegative(),
        maxDuration: z.number().nonnegative(),
        queryPatterns: z.record(
          z.string(),
          z.object({
            pattern: z.string(),
            count: z.number().int().nonnegative(),
            totalDuration: z.number().nonnegative(),
            averageDuration: z.number().nonnegative(),
            slowCount: z.number().int().nonnegative(),
          }),
        ),
      }),
    }),
    environment: z.string(),
  });

  const monitoringPerformanceSchema = z.object({
    timeWindow: z.string(),
    timestamp: z.string().openapi({ format: 'date-time' }),
    summary: z.object({
      totalQueries: z.number().int().nonnegative(),
      slowQueries: z.number().int().nonnegative(),
      slowQueryPercentage: z.string(),
      averageDuration: z.number().nonnegative(),
    }),
    percentiles: z.object({
      p50: z.number().nonnegative(),
      p95: z.number().nonnegative(),
      p99: z.number().nonnegative(),
      max: z.number().nonnegative(),
    }),
    connectionPool: z.object({
      activeConnections: z.number().int().nonnegative(),
      idleConnections: z.number().int().nonnegative(),
      totalConnections: z.number().int().nonnegative(),
      pendingRequests: z.number().int().nonnegative(),
    }),
    slowQueries: z
      .array(
        z.object({
          duration: z.number().nonnegative(),
          query: z.string(),
          timestamp: z.string().openapi({ format: 'date-time' }),
          model: z.string().optional(),
          operation: z.string().optional(),
        }),
      )
      .openapi({ description: 'Slowest queries observed within the time window.' }),
    queryPatterns: z.record(
      z.string(),
      z.object({
        pattern: z.string(),
        count: z.number().int().nonnegative(),
        totalDuration: z.number().nonnegative(),
        averageDuration: z.number().nonnegative(),
        slowCount: z.number().int().nonnegative(),
      }),
    ),
    configuration: z.object({
      slowQueryThreshold: z.number().nonnegative(),
      loggingEnabled: z.boolean(),
    }),
  });

  const photoEventSchema = z.object({
    type: z.enum(['submission_failure', 'quota_violation', 'email_error']),
    accountId: z.string().nullable(),
    teamId: z.string().nullable(),
    submissionId: z.string().nullable(),
    timestamp: z.string().openapi({ format: 'date-time' }),
    detail: z.string().nullable().optional(),
  });

  const photoMetricsSchema = z.object({
    counters: z.object({
      submissionFailures: z.number().int().nonnegative(),
      quotaViolations: z.number().int().nonnegative(),
      emailErrors: z.number().int().nonnegative(),
    }),
    recent: photoEventSchema
      .array()
      .openapi({ description: 'Recent photo submission issues encountered by the platform.' }),
  });

  const adminAnalyticsSummarySchema = z.object({
    generatedAt: z.string().openapi({ format: 'date-time' }),
    accounts: z.object({
      total: z.number().int().nonnegative(),
      withEmailActivity: z.number().int().nonnegative(),
      topStorageAccounts: accountStorageMetricSchema.array(),
    }),
    storage: z.object({
      totalAttachmentBytes: z.number().nonnegative(),
      totalAttachments: z.number().int().nonnegative(),
      byAccount: accountStorageMetricSchema.array(),
    }),
    email: z.object({
      totalEmails: z.number().int().nonnegative(),
      totalRecipients: z.number().int().nonnegative(),
      successfulDeliveries: z.number().int().nonnegative(),
      failedDeliveries: z.number().int().nonnegative(),
      bounceCount: z.number().int().nonnegative(),
      openCount: z.number().int().nonnegative(),
      clickCount: z.number().int().nonnegative(),
      deliverySuccessRate: z.number().min(0).max(100),
      bounceRate: z.number().min(0).max(100),
      openRate: z.number().min(0).max(100),
      clickRate: z.number().min(0).max(100),
      perAccount: accountEmailMetricSchema.array(),
    }),
    photos: photoMetricsSchema,
    monitoring: z.object({
      health: monitoringHealthSchema,
      performance: monitoringPerformanceSchema,
    }),
  });

  registry.registerPath({
    method: 'get',
    path: '/api/admin/analytics/summary',
    operationId: 'getAdminAnalyticsSummary',
    summary: 'Fetch aggregated administrator analytics for the platform.',
    description:
      'Returns platform-wide metrics covering account storage usage, email delivery outcomes, and current system monitoring status.',
    tags: ['Admin'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Administrator analytics summary.',
        content: {
          'application/json': {
            schema: adminAnalyticsSummarySchema,
          },
        },
      },
      401: {
        description: 'Authentication required.',
      },
      403: {
        description: 'Administrator privileges are required to access analytics.',
      },
    },
  });
};

export default registerAdminAnalyticsEndpoints;
