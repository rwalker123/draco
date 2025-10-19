import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminDashboard from '../AdminDashboard';
import type { AdminAnalyticsSummary } from '@/services/adminAnalyticsService';

let mockFetchSummary: ReturnType<typeof vi.fn>;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', username: 'admin' } }),
}));

vi.mock('@/context/RoleContext', () => ({
  useRole: () => ({
    hasRole: (role: string) => role === 'Administrator',
  }),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => ({}),
}));

vi.mock('@/services/adminAnalyticsService', () => ({
  fetchAdminAnalyticsSummary: (...args: unknown[]) => mockFetchSummary(...args),
}));

const theme = createTheme();

const createSummary = (): AdminAnalyticsSummary => ({
  generatedAt: '2024-01-01T00:00:00.000Z',
  accounts: {
    total: 5,
    withEmailActivity: 3,
    topStorageAccounts: [
      {
        accountId: '42',
        accountName: 'Springfield Tigers',
        attachmentBytes: 1048576,
        attachmentCount: 12,
      },
    ],
  },
  storage: {
    totalAttachmentBytes: 1048576,
    totalAttachments: 12,
    byAccount: [
      {
        accountId: '42',
        accountName: 'Springfield Tigers',
        attachmentBytes: 1048576,
        attachmentCount: 12,
      },
    ],
  },
  email: {
    totalEmails: 20,
    totalRecipients: 200,
    successfulDeliveries: 180,
    failedDeliveries: 5,
    bounceCount: 3,
    openCount: 150,
    clickCount: 45,
    deliverySuccessRate: 90,
    bounceRate: 1.5,
    openRate: 75,
    clickRate: 22.5,
    perAccount: [
      {
        accountId: '42',
        accountName: 'Springfield Tigers',
        emailCount: 20,
        totalRecipients: 200,
        successfulDeliveries: 180,
        failedDeliveries: 5,
        bounceCount: 3,
        openCount: 150,
        clickCount: 45,
        lastSentAt: '2024-01-01T12:00:00.000Z',
        deliverySuccessRate: 90,
        openRate: 75,
        clickRate: 22.5,
      },
    ],
  },
  photos: {
    counters: {
      submissionFailures: 2,
      quotaViolations: 1,
      emailErrors: 1,
    },
    recent: [
      {
        type: 'submission_failure',
        accountId: '42',
        teamId: null,
        submissionId: '100',
        timestamp: '2024-01-01T12:34:56.000Z',
        detail: 'Stage "team-create" failed: Storage unavailable',
      },
    ],
  },
  monitoring: {
    health: {
      status: 'healthy',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 3600,
      environment: 'development',
      database: {
        status: 'connected',
        latency: 12,
        connectionPool: {
          activeConnections: 2,
          idleConnections: 4,
          totalConnections: 6,
          pendingRequests: 0,
          configuration: {
            maxConnections: 10,
            timeout: 30,
            slowQueryThreshold: 200,
          },
        },
      },
      performance: {
        status: 'healthy',
        message: 'All good',
        queries: {
          totalQueries: 100,
          slowQueries: 2,
          averageDuration: 12,
          p50Duration: 8,
          p95Duration: 30,
          p99Duration: 45,
          maxDuration: 60,
          queryPatterns: {},
        },
      },
    },
    performance: {
      timeWindow: '15m',
      timestamp: '2024-01-01T00:00:00.000Z',
      summary: {
        totalQueries: 100,
        slowQueries: 2,
        slowQueryPercentage: '2%',
        averageDuration: 12,
      },
      percentiles: {
        p50: 8,
        p95: 30,
        p99: 45,
        max: 60,
      },
      connectionPool: {
        activeConnections: 2,
        idleConnections: 4,
        totalConnections: 6,
        pendingRequests: 0,
      },
      slowQueries: [],
      queryPatterns: {},
      configuration: {
        slowQueryThreshold: 200,
        loggingEnabled: true,
      },
    },
  },
});

describe('AdminDashboard photo metrics', () => {
  beforeEach(() => {
    mockFetchSummary = vi.fn().mockResolvedValue(createSummary());
  });

  it('renders photo issue metrics and recent events', async () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminDashboard />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Photo submission alerts')).toBeInTheDocument();
    });

    const photoCard = screen.getByText('Photo issues').closest('div');
    expect(photoCard).toBeTruthy();
    expect(photoCard).toHaveTextContent('4');
    expect(screen.getByText('Failures 2 • Quota 1 • Email 1')).toBeInTheDocument();
    expect(screen.getByText('Submission failure')).toBeInTheDocument();
    expect(screen.getByText('Stage "team-create" failed: Storage unavailable')).toBeInTheDocument();
  });
});
