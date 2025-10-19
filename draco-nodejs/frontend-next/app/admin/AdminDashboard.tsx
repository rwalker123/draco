'use client';

import React from 'react';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import GroupsIcon from '@mui/icons-material/Groups';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InsightsIcon from '@mui/icons-material/Insights';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimelineIcon from '@mui/icons-material/Timeline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useApiClient } from '@/hooks/useApiClient';
import {
  fetchAdminAnalyticsSummary,
  type AdminAnalyticsSummary,
} from '@/services/adminAnalyticsService';
import { formatDateTime } from '@/utils/dateUtils';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'secondary';
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  helper,
  color = 'primary',
}) => {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 220 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              bgcolor: (theme) => theme.palette[color].main,
              color: (theme) => theme.palette[color].contrastText,
              width: 42,
              height: 42,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {helper && (
              <Typography variant="caption" color="text.secondary">
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const getStatusChipColor = (status: 'healthy' | 'warning' | 'critical') => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};

const PHOTO_EVENT_LABELS: Record<'submission_failure' | 'quota_violation' | 'email_error', string> =
  {
    submission_failure: 'Submission failure',
    quota_violation: 'Quota violation',
    email_error: 'Email error',
  };

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminAnalyticsSummary(apiClient);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load administrator analytics.');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const data = await fetchAdminAnalyticsSummary(apiClient);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh analytics.');
    } finally {
      setRefreshing(false);
    }
  }, [apiClient]);

  const topStorageAccounts = useMemo(() => summary?.accounts.topStorageAccounts ?? [], [summary]);
  const emailAccounts = useMemo(() => summary?.email.perAccount ?? [], [summary]);
  const photoCounters = summary?.photos.counters ?? {
    submissionFailures: 0,
    quotaViolations: 0,
    emailErrors: 0,
  };
  const totalPhotoIssues =
    photoCounters.submissionFailures + photoCounters.quotaViolations + photoCounters.emailErrors;
  const photoEvents = useMemo(() => summary?.photos.recent ?? [], [summary]);
  const slowQueries = useMemo(
    () => summary?.monitoring.performance.slowQueries?.slice(0, 5) ?? [],
    [summary],
  );

  if (!hasRole('Administrator')) {
    return (
      <main className="min-h-screen bg-background">
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </Alert>
      </main>
    );
  }

  if (loading && !summary) {
    return (
      <main className="min-h-screen bg-background">
        <Stack spacing={2} alignItems="center" sx={{ mt: 8 }}>
          <CircularProgress color="primary" />
          <Typography color="text.secondary">Loading administrator analytics…</Typography>
        </Stack>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Administrator Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform-wide operational health, storage consumption, and communication trends.
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh analytics">
          <span>
            <IconButton color="primary" onClick={() => void handleRefresh()} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Analytics are currently unavailable</AlertTitle>
          {error}
        </Alert>
      )}

      {summary && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Platform Snapshot
            </Typography>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
              <MetricCard
                icon={<GroupsIcon />}
                label="Total accounts"
                value={formatNumber(summary.accounts.total)}
                helper={`${formatNumber(summary.accounts.withEmailActivity)} with recent email activity`}
                color="primary"
              />
              <MetricCard
                icon={<MailOutlineIcon />}
                label="Emails processed"
                value={formatNumber(summary.email.totalEmails)}
                helper={`${formatNumber(summary.email.totalRecipients)} recipients reached`}
                color="info"
              />
              <MetricCard
                icon={<StorageIcon />}
                label="Attachment storage"
                value={formatBytes(summary.storage.totalAttachmentBytes)}
                helper={`${formatNumber(summary.storage.totalAttachments)} stored files`}
                color="secondary"
              />
              <MetricCard
                icon={<InsightsIcon />}
                label="Delivery success"
                value={formatPercentage(summary.email.deliverySuccessRate)}
                helper={`Open ${formatPercentage(summary.email.openRate)} • Click ${formatPercentage(summary.email.clickRate)}`}
                color="success"
              />
              <MetricCard
                icon={<PhotoCameraIcon />}
                label="Photo issues"
                value={formatNumber(totalPhotoIssues)}
                helper={`Failures ${formatNumber(photoCounters.submissionFailures)} • Quota ${formatNumber(photoCounters.quotaViolations)} • Email ${formatNumber(photoCounters.emailErrors)}`}
                color={totalPhotoIssues > 0 ? 'warning' : 'secondary'}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Generated at {formatDateTime(summary.generatedAt)}
            </Typography>
          </Paper>

          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3} alignItems="stretch">
            <Paper sx={{ p: 3, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <StorageIcon fontSize="small" />
                <Typography variant="h6">Top storage consumers</Typography>
              </Stack>
              {topStorageAccounts.length > 0 ? (
                <Table size="small" aria-label="Top account storage usage">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell align="right">Stored data</TableCell>
                      <TableCell align="right">Attachments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topStorageAccounts.map((account) => (
                      <TableRow key={account.accountId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{account.accountName}</TableCell>
                        <TableCell align="right">{formatBytes(account.attachmentBytes)}</TableCell>
                        <TableCell align="right">{formatNumber(account.attachmentCount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No attachment storage has been recorded yet.
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <MailOutlineIcon fontSize="small" />
                <Typography variant="h6">Email throughput by account</Typography>
              </Stack>
              {emailAccounts.length > 0 ? (
                <Table size="small" aria-label="Email performance by account">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell align="right">Emails</TableCell>
                      <TableCell align="right">Recipients</TableCell>
                      <TableCell align="right">Delivery</TableCell>
                      <TableCell align="right">Opens</TableCell>
                      <TableCell align="right">Clicks</TableCell>
                      <TableCell>Last sent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emailAccounts.map((account) => (
                      <TableRow key={account.accountId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{account.accountName}</TableCell>
                        <TableCell align="right">{formatNumber(account.emailCount)}</TableCell>
                        <TableCell align="right">{formatNumber(account.totalRecipients)}</TableCell>
                        <TableCell align="right">
                          {formatPercentage(account.deliverySuccessRate)}
                        </TableCell>
                        <TableCell align="right">{formatPercentage(account.openRate)}</TableCell>
                        <TableCell align="right">{formatPercentage(account.clickRate)}</TableCell>
                        <TableCell>
                          {account.lastSentAt ? formatDateTime(account.lastSentAt) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No email activity has been recorded yet.
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <PhotoCameraIcon fontSize="small" />
                <Typography variant="h6">Photo submission alerts</Typography>
              </Stack>
              {photoEvents.length > 0 ? (
                <Table size="small" aria-label="Recent photo submission issues">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {photoEvents.map((event, index) => (
                      <TableRow key={`${event.timestamp}-${index}`} hover>
                        <TableCell>{formatDateTime(event.timestamp)}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {PHOTO_EVENT_LABELS[event.type]}
                        </TableCell>
                        <TableCell>{event.accountId ?? '—'}</TableCell>
                        <TableCell>{event.teamId ?? '—'}</TableCell>
                        <TableCell>{event.detail?.trim() ? event.detail : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent photo submission issues have been reported.
                </Typography>
              )}
            </Paper>
          </Stack>

          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TimelineIcon fontSize="small" />
              <Typography variant="h6">System health</Typography>
              <Chip
                size="small"
                color={getStatusChipColor(summary.monitoring.health.status)}
                icon={
                  summary.monitoring.health.status === 'healthy' ? (
                    <CheckCircleOutlineIcon />
                  ) : summary.monitoring.health.status === 'warning' ? (
                    <WarningAmberIcon />
                  ) : (
                    <ErrorOutlineIcon />
                  )
                }
                label={summary.monitoring.health.status.toUpperCase()}
                sx={{ ml: 1 }}
              />
            </Stack>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              divider={<Divider orientation="vertical" flexItem />}
              useFlexGap
            >
              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Database connectivity
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {summary.monitoring.health.database.status === 'connected'
                    ? 'Operational'
                    : 'Unavailable'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latency {summary.monitoring.health.database.latency.toFixed(1)} ms • Active
                  connections {summary.monitoring.health.database.connectionPool.activeConnections}/
                  {summary.monitoring.health.database.connectionPool.totalConnections}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Query volume (last {summary.monitoring.performance.timeWindow})
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatNumber(summary.monitoring.performance.summary.totalQueries)} queries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatNumber(summary.monitoring.performance.summary.slowQueries)} slow • P95{' '}
                  {summary.monitoring.performance.percentiles.p95.toFixed(2)} ms
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Environment
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {summary.monitoring.health.environment}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime {formatNumber(Math.floor(summary.monitoring.health.uptime / 3600))} hours
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent slow queries
            </Typography>
            {slowQueries.length > 0 ? (
              <Table size="small" aria-label="Slow queries">
                <TableHead>
                  <TableRow>
                    <TableCell>Duration (ms)</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Observed</TableCell>
                    <TableCell>Query sample</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowQueries.map((query, index) => (
                    <TableRow key={`${query.timestamp}-${index}`}>
                      <TableCell>{query.duration.toFixed(2)}</TableCell>
                      <TableCell>{query.model ?? '—'}</TableCell>
                      <TableCell>{query.operation ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(query.timestamp)}</TableCell>
                      <TableCell>
                        <Tooltip title={query.query} placement="top-start">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              maxWidth: 260,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {query.query}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No slow queries have been recorded in the current window.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Signed-in administrator
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Username:</strong> {user?.userName ?? 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {user?.contact?.email ?? 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>User ID:</strong> {user?.userId ?? 'Unknown'}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      )}

      {refreshing && summary && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Refreshing analytics…
          </Typography>
        </Stack>
      )}
    </main>
  );
};

export default AdminDashboard;
