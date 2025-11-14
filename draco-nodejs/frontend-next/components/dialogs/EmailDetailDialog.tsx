'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import { createEmailService } from '../../services/emailService';
import type { AttachmentDetails, EmailRecord, EmailStatus } from '../../types/emails/email';
import { formatDateTime } from '../../utils/dateUtils';
import {
  MetricCard,
  RecipientStatusChip,
  StatusChip,
  formatRate,
} from '../emails/history/EmailHistoryShared';
import RichTextContent from '../common/RichTextContent';

interface EmailDetailDialogProps {
  open: boolean;
  accountId: string;
  email: EmailRecord | null;
  onClose: () => void;
  onError?: (error: string) => void;
}

const EmailDetailDialog: React.FC<EmailDetailDialogProps> = ({
  open,
  accountId,
  email,
  onClose,
  onError,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const emailService = useMemo(() => createEmailService(token, apiClient), [token, apiClient]);

  const [detail, setDetail] = useState<EmailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const detailCacheRef = useRef<Map<string, EmailRecord>>(new Map());

  useEffect(() => {
    detailCacheRef.current.clear();
    setRetryCounter(0);
  }, [accountId]);

  useEffect(() => {
    if (!open || !email) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cached = detailCacheRef.current.get(email.id);
    if (cached) {
      setDetail(cached);
      return;
    }

    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await emailService.getEmail(accountId, email.id);
        if (cancelled) {
          return;
        }
        detailCacheRef.current.set(email.id, result);
        setDetail(result);
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load email detail:', err);
        const message = 'Unable to load detailed delivery data.';
        setError(message);
        onError?.(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [open, email, accountId, emailService, onError, retryCounter]);

  const handleRetry = useCallback(() => {
    if (!email) {
      return;
    }
    detailCacheRef.current.delete(email.id);
    setRetryCounter((prev) => prev + 1);
  }, [email]);

  const handleDownloadAttachment = useCallback(
    async (attachment: AttachmentDetails) => {
      if (!email) {
        return;
      }

      try {
        const targetEmail = detail ?? email;
        const blob = await emailService.downloadAttachment(
          accountId,
          targetEmail.id,
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
        const message = 'Unable to download attachment. Please try again.';
        setError(message);
        onError?.(message);
      }
    },
    [accountId, detail, email, emailService, onError],
  );

  const summary = email;
  const recipients = detail?.recipients ?? summary?.recipients ?? [];
  const attachments = detail?.attachments ?? summary?.attachments ?? [];
  const effectiveStatus = (detail?.status ?? summary?.status ?? 'draft') as EmailStatus;

  const detailAnalytics = useMemo(() => {
    const source = detail ?? summary;
    if (!source) {
      return {
        totalRecipients: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        deliverability: 0,
      };
    }

    const totalRecipients = source.totalRecipients;
    const successfulDeliveries = source.successfulDeliveries;
    const failedDeliveries = source.failedDeliveries;
    const deliverability = totalRecipients > 0 ? (successfulDeliveries / totalRecipients) * 100 : 0;

    return {
      totalRecipients,
      successfulDeliveries,
      failedDeliveries,
      deliverability,
    };
  }, [detail, summary]);

  const bodyPreview = detail?.bodyHtml || summary?.bodyHtml || summary?.bodyText;

  return (
    <Dialog open={open && Boolean(summary)} onClose={onClose} maxWidth="lg" fullWidth>
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
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={<Button onClick={handleRetry}>Retry</Button>}
          >
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
              value={formatRate(detailAnalytics.deliverability)}
              helper="Successful deliveries"
              color="success"
            />
          </Stack>

          {bodyPreview && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Message preview
                </Typography>
                <RichTextContent
                  html={bodyPreview}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
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
                    onClick={() => handleDownloadAttachment(attachment)}
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

export default EmailDetailDialog;
