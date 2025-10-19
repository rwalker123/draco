import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  AlertColor,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import DenyPhotoSubmissionDialog from './DenyPhotoSubmissionDialog';

export interface PendingPhotoSubmissionsPanelProps {
  contextLabel: string;
  submissions: PhotoSubmissionDetailType[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  processingIds?: ReadonlySet<string>;
  emptyMessage?: string;
  onRefresh: () => Promise<void> | void;
  onApprove: (submissionId: string) => Promise<boolean> | boolean;
  onDeny: (submissionId: string, reason: string) => Promise<boolean> | boolean;
  onClearStatus?: () => void;
}

const buildAssetUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (/^https?:/i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\\/g, '/');
};

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const PendingPhotoSubmissionsPanel: React.FC<PendingPhotoSubmissionsPanelProps> = ({
  contextLabel,
  submissions,
  loading,
  error,
  successMessage,
  processingIds,
  emptyMessage = 'No pending photo submissions right now.',
  onRefresh,
  onApprove,
  onDeny,
  onClearStatus,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSubmission, setDialogSubmission] = useState<PhotoSubmissionDetailType | null>(null);

  const isProcessing = useCallback(
    (submissionId: string) => (processingIds ? processingIds.has(submissionId) : false),
    [processingIds],
  );

  const handleApprove = useCallback(
    async (submissionId: string) => {
      const result = await onApprove(submissionId);
      if (result) {
        setDialogSubmission((current) => (current?.id === submissionId ? null : current));
      }
    },
    [onApprove],
  );

  const handleOpenDeny = useCallback((submission: PhotoSubmissionDetailType) => {
    setDialogSubmission(submission);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (!isProcessing(dialogSubmission?.id ?? '')) {
      setDialogOpen(false);
      setDialogSubmission(null);
    }
  }, [dialogSubmission, isProcessing]);

  const handleConfirmDeny = useCallback(
    async (reason: string) => {
      if (!dialogSubmission) {
        return false;
      }

      const result = await onDeny(dialogSubmission.id, reason);
      if (result) {
        setDialogOpen(false);
        setDialogSubmission(null);
      }

      return result;
    },
    [dialogSubmission, onDeny],
  );

  const hasSubmissions = submissions.length > 0;

  const alertSeverity: AlertColor = useMemo(() => {
    if (error) {
      return 'error';
    }

    return 'success';
  }, [error]);

  const activeSubmissionId = dialogSubmission?.id ?? '';

  return (
    <Box data-testid="pending-photo-submissions-panel">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Pending Photo Submissions</Typography>
        <Button
          onClick={() => {
            void onRefresh();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Review submissions awaiting moderation for {contextLabel}.
      </Typography>

      {(error || successMessage) && (
        <Alert
          severity={alertSeverity}
          sx={{ mb: 3 }}
          onClose={onClearStatus}
          data-testid={error ? 'pending-photo-error' : 'pending-photo-success'}
        >
          {error || successMessage}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" py={6}>
          <CircularProgress role="progressbar" />
        </Box>
      ) : hasSubmissions ? (
        <Grid container spacing={3}>
          {submissions.map((submission) => {
            const thumbnailUrl = buildAssetUrl(submission.thumbnailImagePath);
            const submitterName = [submission.submitter?.firstName, submission.submitter?.lastName]
              .filter(Boolean)
              .join(' ');
            const albumTitle = submission.album?.title ?? 'Unassigned Album';
            const submittedAt = formatDateTime(submission.submittedAt);
            const processing = isProcessing(submission.id);

            return (
              <Grid item xs={12} md={6} key={submission.id}>
                <Card variant="outlined">
                  <CardHeader
                    title={submission.title}
                    subheader={`Submitted ${submittedAt}`}
                    titleTypographyProps={{ variant: 'h6' }}
                    subheaderTypographyProps={{ color: 'text.secondary' }}
                  />
                  <Divider />
                  <CardContent>
                    <Stack direction="column" spacing={2}>
                      {thumbnailUrl ? (
                        <Box
                          component="img"
                          src={thumbnailUrl}
                          alt={`Preview of ${submission.title}`}
                          sx={{
                            width: '100%',
                            height: 180,
                            objectFit: 'cover',
                            borderRadius: 1,
                            bgcolor: 'grey.100',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 180,
                            borderRadius: 1,
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography color="text.secondary">No preview available</Typography>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip label={albumTitle} color="primary" variant="outlined" />
                        {submitterName && (
                          <Chip label={`Submitted by ${submitterName}`} variant="outlined" />
                        )}
                      </Stack>

                      {submission.caption && (
                        <Typography variant="body2" color="text.secondary">
                          {submission.caption}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenDeny(submission)}
                      disabled={processing}
                    >
                      Deny
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        void handleApprove(submission.id);
                      }}
                      disabled={processing}
                      startIcon={processing ? <CircularProgress size={18} /> : undefined}
                    >
                      Approve
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box py={4} textAlign="center">
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      )}

      <DenyPhotoSubmissionDialog
        open={dialogOpen}
        submissionTitle={dialogSubmission?.title}
        loading={isProcessing(activeSubmissionId)}
        error={error && dialogOpen ? error : null}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDeny}
      />
    </Box>
  );
};

export default PendingPhotoSubmissionsPanel;
