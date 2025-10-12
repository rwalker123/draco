'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ErrorOutline as ErrorOutlineIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  ShowChart as ShowChartIcon,
  TaskAlt as TaskAltIcon,
  VisibilityOutlined as ViewDetailsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { deleteAccountEmail } from '@draco/shared-api-client';
import { createEmailService } from '../../../services/emailService';
import type {
  AttachmentDetails,
  EmailListResponse,
  EmailRecord,
  EmailRecipientStatus,
  EmailStatus,
} from '../../../types/emails/email';
import { formatDateTime } from '../../../utils/dateUtils';
import { assertNoApiError } from '../../../utils/apiResult';

const STATUS_LABELS: Record<EmailStatus, string> = {
  draft: 'Draft',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
  scheduled: 'Scheduled',
  partial: 'Partial',
};

const STATUS_COLORS: Record<
  EmailStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  draft: 'default',
  sending: 'info',
  sent: 'success',
  failed: 'error',
  scheduled: 'secondary',
  partial: 'warning',
};

type StatusFilter = 'all' | EmailStatus;

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Sending', value: 'sending' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Partial', value: 'partial' },
  { label: 'Failed', value: 'failed' },
  { label: 'Draft', value: 'draft' },
];

const RECIPIENT_STATUS_LABELS: Record<EmailRecipientStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  delivered: 'Delivered',
  bounced: 'Bounced',
  failed: 'Failed',
  opened: 'Opened',
  clicked: 'Clicked',
};

const RECIPIENT_STATUS_COLORS: Record<
  EmailRecipientStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  pending: 'default',
  sent: 'info',
  delivered: 'success',
  bounced: 'warning',
  failed: 'error',
  opened: 'secondary',
  clicked: 'primary',
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  helper,
  color = 'primary',
}) => {
  const backgroundColor = color === 'default' ? 'grey.100' : `${color}.light`;
  const foregroundColor = color === 'default' ? 'grey.800' : `${color}.dark`;

  return (
    <Card sx={{ flex: '1 1 240px', minWidth: 240 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: backgroundColor,
              color: foregroundColor,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
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

const StatusChip: React.FC<{ status: EmailStatus }> = ({ status }) => (
  <Chip
    label={STATUS_LABELS[status] ?? status}
    color={STATUS_COLORS[status]}
    size="small"
    variant="outlined"
  />
);

const RecipientStatusChip: React.FC<{ status: EmailRecipientStatus }> = ({ status }) => (
  <Chip
    label={RECIPIENT_STATUS_LABELS[status] ?? status}
    color={RECIPIENT_STATUS_COLORS[status]}
    size="small"
    variant="outlined"
  />
);

const formatRate = (value: number): string => `${value.toFixed(1)}%`;

interface EmailDetailDialogProps {
  open: boolean;
  summary: EmailRecord | null;
  email: EmailRecord | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onDownloadAttachment: (attachment: AttachmentDetails) => void;
}

const EmailDetailDialog: React.FC<EmailDetailDialogProps> = ({
  open,
  summary,
  email,
  loading,
  error,
  onClose,
  onRetry,
  onDownloadAttachment,
}) => {
  const recipients = email?.recipients ?? summary?.recipients ?? [];
  const attachments = email?.attachments ?? summary?.attachments ?? [];
  const effectiveStatus = (email?.status ?? summary?.status ?? 'draft') as EmailStatus;

  const detailAnalytics = useMemo(() => {
    if (!email) {
      const totalRecipients = summary?.totalRecipients ?? 0;
      const successfulDeliveries = summary?.successfulDeliveries ?? 0;
      const failedDeliveries = summary?.failedDeliveries ?? 0;
      const openRate =
        totalRecipients > 0 ? ((summary?.openCount ?? 0) / totalRecipients) * 100 : 0;
      const clickRate =
        totalRecipients > 0 ? ((summary?.clickCount ?? 0) / totalRecipients) * 100 : 0;

      return {
        totalRecipients,
        successfulDeliveries,
        failedDeliveries,
        openRate,
        clickRate,
      };
    }

    const totalRecipients = email.totalRecipients;
    const successfulDeliveries = email.successfulDeliveries;
    const failedDeliveries = email.failedDeliveries;
    const openRate = totalRecipients > 0 ? (email.openCount / totalRecipients) * 100 : 0;
    const clickRate = totalRecipients > 0 ? (email.clickCount / totalRecipients) * 100 : 0;

    return {
      totalRecipients,
      successfulDeliveries,
      failedDeliveries,
      openRate,
      clickRate,
    };
  }, [email, summary]);

  const bodyPreview = email?.bodyHtml || summary?.bodyHtml || summary?.bodyText;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {summary?.subject ?? 'Email details'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {summary?.createdAt ? `Created ${formatDateTime(summary.createdAt)}` : 'Details'}
          </Typography>
        </Box>
        <StatusChip status={effectiveStatus} />
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading delivery history…
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={onRetry}>Retry</Button>}>
            <AlertTitle>Unable to load email</AlertTitle>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
            <MetricCard
              icon={<PeopleIcon fontSize="small" />}
              label="Recipients"
              value={`${detailAnalytics.totalRecipients}`}
              helper={`${detailAnalytics.successfulDeliveries} delivered • ${detailAnalytics.failedDeliveries} failed`}
              color="primary"
            />
            <MetricCard
              icon={<TaskAltIcon fontSize="small" />}
              label="Deliverability"
              value={
                detailAnalytics.totalRecipients > 0
                  ? formatRate(
                      (detailAnalytics.successfulDeliveries / detailAnalytics.totalRecipients) *
                        100,
                    )
                  : '0.0%'
              }
              helper="Successful deliveries"
              color="success"
            />
            <MetricCard
              icon={<ShowChartIcon fontSize="small" />}
              label="Engagement"
              value={`${formatRate(detailAnalytics.openRate)} open • ${formatRate(detailAnalytics.clickRate)} click`}
              helper="Open and click rates"
              color="info"
            />
          </Stack>

          {bodyPreview && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Message preview
                </Typography>
                <Box
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    maxHeight: 320,
                    overflowY: 'auto',
                    '& h1, & h2, & h3, & h4, & h5, & h6': { fontSize: '1rem' },
                    '& p': { mb: 1.5 },
                  }}
                  dangerouslySetInnerHTML={{ __html: bodyPreview }}
                />
              </CardContent>
            </Card>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recipient delivery status
            </Typography>
            {recipients.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tracked recipients for this email.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell>Delivered</TableCell>
                      <TableCell>Opened</TableCell>
                      <TableCell>Clicked</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.id} hover>
                        <TableCell>{recipient.emailAddress}</TableCell>
                        <TableCell>{recipient.contactName ?? '—'}</TableCell>
                        <TableCell>{recipient.recipientType ?? '—'}</TableCell>
                        <TableCell>
                          <RecipientStatusChip status={recipient.status} />
                        </TableCell>
                        <TableCell>
                          {recipient.sentAt ? formatDateTime(recipient.sentAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {recipient.deliveredAt ? formatDateTime(recipient.deliveredAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {recipient.openedAt ? formatDateTime(recipient.openedAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {recipient.clickedAt ? formatDateTime(recipient.clickedAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {recipient.bounceReason || recipient.errorMessage || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Attachments
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {attachments.map((attachment) => (
                  <Button
                    key={attachment.id}
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFileIcon fontSize="small" />}
                    onClick={() => onDownloadAttachment(attachment)}
                  >
                    {attachment.originalName ?? attachment.filename}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EmailHistoryPanelProps {
  accountId: string;
  showHeader?: boolean;
}

const EmailHistoryPanel: React.FC<EmailHistoryPanelProps> = ({ accountId, showHeader = true }) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const emailService = useMemo(() => createEmailService(token, apiClient), [token, apiClient]);

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paginationInfo, setPaginationInfo] = useState<EmailListResponse['pagination'] | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailRecord | null>(null);
  const [deletingEmailIds, setDeletingEmailIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailPendingDelete, setEmailPendingDelete] = useState<EmailRecord | null>(null);

  const detailCacheRef = useRef<Map<string, EmailRecord>>(new Map());

  const fetchEmails = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      const statusQuery = statusFilter === 'all' ? undefined : statusFilter;
      const response = await emailService.listEmails(accountId, page, pageSize, statusQuery);

      setEmails(response.emails);
      setPaginationInfo(response.pagination);
    } catch (err) {
      console.error('Failed to load email history:', err);
      setLoadError('Unable to load email history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountId, emailService, page, pageSize, statusFilter]);

  useEffect(() => {
    if (!accountId || !token) return;
    fetchEmails();
  }, [accountId, token, fetchEmails]);

  useEffect(() => {
    if (paginationInfo && page > paginationInfo.totalPages && paginationInfo.totalPages > 0) {
      setPage(paginationInfo.totalPages);
    }
  }, [paginationInfo, page]);

  const filteredEmails = useMemo(() => {
    if (!searchTerm) {
      return emails;
    }

    const term = searchTerm.toLowerCase().trim();
    return emails.filter((email) => {
      const subjectMatch = email.subject.toLowerCase().includes(term);
      const templateMatch = email.templateId?.toLowerCase().includes(term) ?? false;
      const createdByMatch = (email.createdByUserId ?? '').toLowerCase().includes(term);
      return subjectMatch || templateMatch || createdByMatch;
    });
  }, [emails, searchTerm]);

  const analytics = useMemo(() => {
    let totalRecipients = 0;
    let successful = 0;
    let failed = 0;
    let open = 0;
    let clicks = 0;

    filteredEmails.forEach((email) => {
      totalRecipients += email.totalRecipients;
      successful += email.successfulDeliveries;
      failed += email.failedDeliveries;
      open += email.openCount;
      clicks += email.clickCount;
    });

    const deliverability = totalRecipients > 0 ? (successful / totalRecipients) * 100 : 0;
    const openRate = totalRecipients > 0 ? (open / totalRecipients) * 100 : 0;
    const clickRate = totalRecipients > 0 ? (clicks / totalRecipients) * 100 : 0;

    return {
      totalRecipients,
      successful,
      failed,
      open,
      clicks,
      deliverability,
      openRate,
      clickRate,
    };
  }, [filteredEmails]);

  const queueSummary = useMemo(() => {
    const sending = filteredEmails.filter((email) => email.status === 'sending').length;
    const scheduled = filteredEmails.filter((email) => email.status === 'scheduled').length;
    const drafts = filteredEmails.filter((email) => email.status === 'draft').length;
    const partial = filteredEmails.filter((email) => email.status === 'partial').length;
    const failed = filteredEmails.filter((email) => email.status === 'failed').length;

    const active = sending + scheduled;

    return { sending, scheduled, drafts, partial, failed, active };
  }, [filteredEmails]);

  const totalPages = paginationInfo?.totalPages ?? 1;
  const totalEmails = paginationInfo?.total ?? filteredEmails.length;

  const handleStatusChange = (event: SelectChangeEvent<StatusFilter>) => {
    const value = event.target.value as StatusFilter;
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchEmails();
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError(null);
    setSelectedEmail(null);
    setEmailDetail(null);
  };

  const openDetail = async (email: EmailRecord) => {
    setSelectedEmail(email);
    setEmailDetail(null);
    setDetailOpen(true);
    setDetailError(null);

    const cached = detailCacheRef.current.get(email.id);
    if (cached) {
      setEmailDetail(cached);
      return;
    }

    try {
      setDetailLoading(true);
      const detail = await emailService.getEmail(accountId, email.id);
      detailCacheRef.current.set(email.id, detail);
      setEmailDetail(detail);
    } catch (err) {
      console.error('Failed to load email detail:', err);
      setDetailError('Unable to load detailed delivery data.');
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetail = () => {
    if (selectedEmail) {
      openDetail(selectedEmail);
    }
  };

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setEmailPendingDelete(null);
  }, []);

  const handleDeleteEmail = useCallback(
    async (email: EmailRecord) => {
      if (!accountId || deletingEmailIds.has(email.id)) {
        return;
      }

      setActionError(null);
      setDeletingEmailIds((prev) => {
        const next = new Set(prev);
        next.add(email.id);
        return next;
      });

      try {
        const result = await deleteAccountEmail({
          client: apiClient,
          path: { accountId, emailId: email.id },
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to delete email.');

        setEmails((prev) => prev.filter((item) => item.id !== email.id));
        detailCacheRef.current.delete(email.id);

        if (selectedEmail?.id === email.id) {
          setDetailOpen(false);
          setDetailLoading(false);
          setDetailError(null);
          setSelectedEmail(null);
          setEmailDetail(null);
        }

        await fetchEmails();
      } catch (err) {
        console.error('Failed to delete email:', err);
        setActionError('Unable to delete email. Please try again.');
      } finally {
        setDeletingEmailIds((prev) => {
          const next = new Set(prev);
          next.delete(email.id);
          return next;
        });
        closeDeleteDialog();
      }
    },
    [accountId, apiClient, closeDeleteDialog, deletingEmailIds, fetchEmails, selectedEmail],
  );

  const handleDownloadAttachment = async (attachment: AttachmentDetails) => {
    if (!selectedEmail) {
      return;
    }

    try {
      const blob = await emailService.downloadAttachment(
        accountId,
        selectedEmail.id,
        attachment.id,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName ?? attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      setDetailError('Unable to download attachment. Please try again.');
    }
  };

  if (!accountId) {
    return null;
  }

  return (
    <Box>
      {showHeader && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Email History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review sent messages, delivery outcomes, and engagement metrics for your organization.
          </Typography>
        </Box>
      )}

      <Stack
        direction={{ xs: 'column', xl: 'row' }}
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        <MetricCard
          icon={<HistoryIcon fontSize="small" />}
          label="Emails on record"
          value={`${totalEmails}`}
          helper={`Page ${page} of ${totalPages || 1}`}
          color="primary"
        />
        <MetricCard
          icon={<TaskAltIcon fontSize="small" />}
          label="Deliverability"
          value={formatRate(analytics.deliverability)}
          helper={`${analytics.successful} successful • ${analytics.failed} failed`}
          color="success"
        />
        <MetricCard
          icon={<ShowChartIcon fontSize="small" />}
          label="Engagement"
          value={`${formatRate(analytics.openRate)} open • ${formatRate(analytics.clickRate)} click`}
          helper={`${analytics.open} opens • ${analytics.clicks} clicks`}
          color="info"
        />
        <MetricCard
          icon={<ScheduleIcon fontSize="small" />}
          label="Queue health"
          value={`${queueSummary.active} active`}
          helper={`${queueSummary.scheduled} scheduled • ${queueSummary.sending} sending • ${queueSummary.failed} failed`}
          color="warning"
        />
      </Stack>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <TextField
              fullWidth
              placeholder="Search by subject, template, or author"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { xs: '100%', md: 360 } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={handleStatusChange}>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Rows per page</InputLabel>
                <Select
                  value={pageSize.toString()}
                  label="Rows per page"
                  onChange={handlePageSizeChange}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size.toString()}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip title="Refresh">
                <span>
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {loadError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              <AlertTitle>Unable to load email history</AlertTitle>
              {loadError}
            </Alert>
          )}

          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}

          {filteredEmails.length === 0 && !loading && !loadError ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                No emails match the current filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adjust your filters or send a new campaign to see results here.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Sent</TableCell>
                    <TableCell align="right">Recipients</TableCell>
                    <TableCell align="right">Delivered</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell align="right">Open rate</TableCell>
                    <TableCell align="right">Click rate</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmails.map((email) => {
                    const openRate =
                      email.totalRecipients > 0
                        ? (email.openCount / email.totalRecipients) * 100
                        : 0;
                    const clickRate =
                      email.totalRecipients > 0
                        ? (email.clickCount / email.totalRecipients) * 100
                        : 0;
                    const isDeleting = deletingEmailIds.has(email.id);

                    return (
                      <TableRow key={email.id} hover>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {email.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {email.templateId ? `Template #${email.templateId}` : 'Custom email'}
                            </Typography>
                            {email.createdByUserId && (
                              <Typography variant="caption" color="text.secondary">
                                Author: {email.createdByUserId}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={email.status} />
                        </TableCell>
                        <TableCell>
                          {email.createdAt ? formatDateTime(email.createdAt) : '—'}
                        </TableCell>
                        <TableCell>{email.sentAt ? formatDateTime(email.sentAt) : '—'}</TableCell>
                        <TableCell align="right">{email.totalRecipients}</TableCell>
                        <TableCell align="right">{email.successfulDeliveries}</TableCell>
                        <TableCell align="right">{email.failedDeliveries}</TableCell>
                        <TableCell align="right">{formatRate(openRate)}</TableCell>
                        <TableCell align="right">{formatRate(clickRate)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="View details">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openDetail(email)}
                                  disabled={isDeleting}
                                >
                                  <ViewDetailsIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete email">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setEmailPendingDelete(email);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={isDeleting}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                disabled={loading}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <EmailDetailDialog
        open={detailOpen}
        onClose={closeDetail}
        summary={selectedEmail}
        email={emailDetail}
        loading={detailLoading}
        error={detailError}
        onRetry={retryDetail}
        onDownloadAttachment={handleDownloadAttachment}
      />
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Email</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {emailPendingDelete?.subject ?? 'this email'}
            </Typography>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteDialog}
            disabled={emailPendingDelete ? deletingEmailIds.has(emailPendingDelete.id) : false}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => emailPendingDelete && handleDeleteEmail(emailPendingDelete)}
            disabled={!emailPendingDelete || deletingEmailIds.has(emailPendingDelete.id)}
            startIcon={
              emailPendingDelete && deletingEmailIds.has(emailPendingDelete.id) ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailHistoryPanel;
