'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
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
  Delete as DeleteIcon,
  ErrorOutline as ErrorOutlineIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  TaskAlt as TaskAltIcon,
  VisibilityOutlined as ViewDetailsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { createEmailService } from '../../../services/emailService';
import type { EmailListResponse, EmailRecord, EmailStatus } from '../../../types/emails/email';
import { formatDateTime } from '../../../utils/dateUtils';
import { MetricCard, StatusChip, formatRate } from './EmailHistoryShared';
import EmailDetailDialog from '../../dialogs/EmailDetailDialog';
import DeleteEmailDialog from '../../dialogs/DeleteEmailDialog';

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

  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [emailPendingDelete, setEmailPendingDelete] = useState<EmailRecord | null>(null);

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

    filteredEmails.forEach((email) => {
      totalRecipients += email.totalRecipients;
      successful += email.successfulDeliveries;
      failed += email.failedDeliveries;
    });

    const deliverability = totalRecipients > 0 ? (successful / totalRecipients) * 100 : 0;

    return {
      totalRecipients,
      successful,
      failed,
      deliverability,
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

  const handleCloseDetail = useCallback(() => {
    setSelectedEmail(null);
  }, []);

  const handleOpenDetail = useCallback((email: EmailRecord) => {
    setActionError(null);
    setSelectedEmail(email);
  }, []);

  const handleOpenDeleteDialog = useCallback((email: EmailRecord) => {
    setActionError(null);
    setEmailPendingDelete(email);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setEmailPendingDelete(null);
  }, []);

  const handleEmailDeleted = useCallback(
    (emailId: string) => {
      setEmails((prev) => prev.filter((item) => item.id !== emailId));
      setSelectedEmail((current) => (current?.id === emailId ? null : current));
      setActionError(null);
      fetchEmails();
    },
    [fetchEmails],
  );

  if (!accountId) {
    return null;
  }

  return (
    <Box>
      {showHeader && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="text.primary">
            Email History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review sent messages, delivery outcomes, and queue activity for your organization.
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
          icon={<ScheduleIcon fontSize="small" />}
          label="Queue health"
          value={`${queueSummary.active} active`}
          helper={`${queueSummary.scheduled} scheduled • ${queueSummary.sending} sending • ${queueSummary.failed} failed`}
          color="warning"
        />
      </Stack>

      <Card variant="outlined">
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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmails.map((email) => (
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
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          <Tooltip title="View details">
                            <span>
                              <IconButton size="small" onClick={() => handleOpenDetail(email)}>
                                <ViewDetailsIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete email">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteDialog(email)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
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
        open={Boolean(selectedEmail)}
        accountId={accountId}
        email={selectedEmail}
        onClose={handleCloseDetail}
        onError={setActionError}
      />
      <DeleteEmailDialog
        open={Boolean(emailPendingDelete)}
        accountId={accountId}
        email={emailPendingDelete}
        onClose={handleCloseDeleteDialog}
        onDeleted={handleEmailDeleted}
        onError={setActionError}
      />
    </Box>
  );
};

export default EmailHistoryPanel;
