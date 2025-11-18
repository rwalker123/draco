import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  AlertColor,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SxProps,
  type Theme,
  Paper,
} from '@mui/material';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import DenyPhotoSubmissionDialog from './DenyPhotoSubmissionDialog';
import WidgetShell from '../ui/WidgetShell';
import { alpha, useTheme } from '@mui/material/styles';
import type { PhotoAlbumOption } from './PhotoSubmissionForm';

const THUMBNAIL_MAX_WIDTH = 320;

export interface PendingPhotoSubmissionsPanelProps {
  contextLabel: string;
  submissions: PhotoSubmissionDetailType[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  processingIds?: ReadonlySet<string>;
  emptyMessage?: string;
  onRefresh: () => Promise<void> | void;
  onApprove: (submissionId: string, albumId: string | null) => Promise<boolean> | boolean;
  onDeny: (submissionId: string, reason: string) => Promise<boolean> | boolean;
  onClearStatus?: () => void;
  containerSx?: SxProps<Theme>;
  albumOptions?: PhotoAlbumOption[];
  isTeamContext?: boolean;
}

// Match common permission-denied phrases (US/UK spellings and variations like authorize/authorise).
const permissionDeniedPattern = /(permission|authori[sz](?:e|ation|ed|ing)?|forbid|denied)/i;

const isPermissionDeniedError = (message: string | null): boolean =>
  Boolean(message && permissionDeniedPattern.test(message));

const buildAssetUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (/^https?:/i.test(path)) {
    return path;
  }

  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }

  return `/uploads/${normalized}`;
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
  onRefresh: _onRefresh,
  onApprove,
  onDeny,
  onClearStatus,
  containerSx,
  albumOptions,
  isTeamContext = false,
}) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSubmission, setDialogSubmission] = useState<PhotoSubmissionDetailType | null>(null);
  const [albumSelectionOverrides, setAlbumSelectionOverrides] = useState<
    Record<string, string | null>
  >({});
  const NO_ALBUM_VALUE = '__none__';

  const tileStyles = useMemo(() => {
    const baseColor = theme.palette.primary.main;
    const surface = theme.palette.widget.surface;
    const highlightStart = alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12);
    const highlightMid = alpha(surface, theme.palette.mode === 'dark' ? 0.92 : 0.98);
    const highlightEnd = alpha(surface, theme.palette.mode === 'dark' ? 0.85 : 0.94);
    const overlay = `radial-gradient(circle at 18% 22%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.28 : 0.16)} 0%, ${alpha(baseColor, 0)} 55%),
      radial-gradient(circle at 78% 28%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12)} 0%, ${alpha(baseColor, 0)} 58%),
      radial-gradient(circle at 48% 82%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.18 : 0.1)} 0%, ${alpha(baseColor, 0)} 70%)`;

    return {
      background: `linear-gradient(135deg, ${highlightStart} 0%, ${highlightMid} 42%, ${highlightEnd} 100%)`,
      overlay,
      border: theme.palette.widget.border,
      shadow: theme.shadows[theme.palette.mode === 'dark' ? 10 : 3],
      detailBackdrop: alpha(
        theme.palette.text.primary,
        theme.palette.mode === 'dark' ? 0.18 : 0.06,
      ),
    };
  }, [theme]);

  const isProcessing = useCallback(
    (submissionId: string) => (processingIds ? processingIds.has(submissionId) : false),
    [processingIds],
  );

  const handleApprove = useCallback(
    async (submissionId: string, albumId: string | null) => {
      const result = await onApprove(submissionId, albumId);
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

  const resolvedAlbumOptions = useMemo<PhotoAlbumOption[]>(() => {
    if (!albumOptions || albumOptions.length === 0) {
      return [];
    }

    const entries = new Map<string, PhotoAlbumOption>();
    albumOptions.forEach((option) => {
      const key = option.id ?? '__default__';
      entries.set(key, {
        id: option.id ?? null,
        title: option.title,
        teamId: option.teamId ?? null,
      });
    });

    return Array.from(entries.values());
  }, [albumOptions]);

  const contextAlbumOptions = useMemo<PhotoAlbumOption[]>(() => {
    if (resolvedAlbumOptions.length === 0) {
      return [];
    }

    if (isTeamContext) {
      const teamAlbums = resolvedAlbumOptions.filter((option) => option.teamId);
      return teamAlbums.length > 0 ? teamAlbums : resolvedAlbumOptions;
    }

    return resolvedAlbumOptions.filter((option) => !option.teamId);
  }, [resolvedAlbumOptions, isTeamContext]);

  const nullAlbumLabel = useMemo(() => {
    const option = contextAlbumOptions.find((item) => item.id === null);
    return option?.title ?? 'No Album (Main Gallery)';
  }, [contextAlbumOptions]);

  const fallbackAlbumId = contextAlbumOptions[0]?.id ?? null;

  const allowedAlbumIds = useMemo(
    () => new Set(contextAlbumOptions.map((option) => option.id ?? null)),
    [contextAlbumOptions],
  );

  const albumSelections = useMemo(() => {
    const next: Record<string, string | null> = {};
    submissions.forEach((submission) => {
      const override = albumSelectionOverrides[submission.id];
      const baseSelection = override ?? submission.album?.id ?? null;
      next[submission.id] = allowedAlbumIds.has(baseSelection ?? null)
        ? (baseSelection ?? null)
        : (fallbackAlbumId ?? null);
    });
    return next;
  }, [albumSelectionOverrides, submissions, allowedAlbumIds, fallbackAlbumId]);

  const getSelectedAlbumId = (submission: PhotoSubmissionDetailType): string | null => {
    const selected = albumSelections[submission.id];
    if (typeof selected !== 'undefined') {
      return selected;
    }

    const defaultSelection = submission.album?.id ?? null;
    return allowedAlbumIds.has(defaultSelection ?? null)
      ? (defaultSelection ?? null)
      : (fallbackAlbumId ?? null);
  };

  const handleAlbumSelectionChange = (submissionId: string, value: string) => {
    setAlbumSelectionOverrides((previous) => ({
      ...previous,
      [submissionId]: value === NO_ALBUM_VALUE ? null : value,
    }));
  };

  const alertSeverity: AlertColor = useMemo(() => {
    if (error) {
      return 'error';
    }

    return 'success';
  }, [error]);

  const shouldHidePanel = useMemo(() => {
    if (loading) {
      return false;
    }

    if (submissions.length === 0 && !error && !successMessage) {
      return true;
    }

    if (submissions.length > 0) {
      return false;
    }

    return isPermissionDeniedError(error);
  }, [error, loading, submissions.length, successMessage]);

  if (shouldHidePanel) {
    return null;
  }

  const activeSubmissionId = dialogSubmission?.id ?? '';

  const widgetSx: SxProps<Theme> = [
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },
    ...(Array.isArray(containerSx) ? containerSx : containerSx ? [containerSx] : []),
  ];

  const showAlbumSelect = !isTeamContext && contextAlbumOptions.length > 1;

  const shellTitle = (
    <Typography variant="h6" fontWeight={700} color="text.primary">
      Pending Photo Submissions
    </Typography>
  );

  const shellSubtitle = (
    <Typography variant="body2" color="text.secondary">
      Review submissions awaiting moderation for {contextLabel}.
    </Typography>
  );

  return (
    <WidgetShell
      data-testid="pending-photo-submissions-panel"
      title={shellTitle}
      subtitle={shellSubtitle}
      accent="secondary"
      sx={widgetSx}
    >
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 3,
          }}
        >
          {submissions.map((submission) => {
            const thumbnailUrl = buildAssetUrl(submission.thumbnailImagePath);
            const submitterName = [submission.submitter?.firstName, submission.submitter?.lastName]
              .filter(Boolean)
              .join(' ');
            const albumTitle = submission.album?.title ?? 'Unassigned Album';
            const submittedAt = formatDateTime(submission.submittedAt);
            const processing = isProcessing(submission.id);
            const selectedAlbumId = getSelectedAlbumId(submission);
            const selectValue = selectedAlbumId ?? NO_ALBUM_VALUE;
            return (
              <Box key={submission.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                  variant="outlined"
                  sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: THUMBNAIL_MAX_WIDTH,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: tileStyles.border,
                    boxShadow: tileStyles.shadow,
                    background: tileStyles.background,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    p: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      backgroundImage: tileStyles.overlay,
                      opacity: theme.palette.mode === 'dark' ? 0.7 : 0.55,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                        {submission.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submitted {submittedAt}
                      </Typography>
                    </Box>
                    <Divider sx={{ borderColor: tileStyles.border, opacity: 0.6 }} />
                    <Stack direction="column" spacing={2}>
                      <Box
                        sx={{
                          width: '100%',
                          borderRadius: 1.5,
                          bgcolor: tileStyles.detailBackdrop,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          minHeight: 120,
                        }}
                      >
                        {thumbnailUrl ? (
                          <Box
                            component="img"
                            src={thumbnailUrl}
                            alt={`Preview of ${submission.title}`}
                            loading="lazy"
                            sx={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: 220,
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <Typography color="text.secondary">No preview available</Typography>
                        )}
                      </Box>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        flexWrap="wrap"
                      >
                        {showAlbumSelect ? (
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id={`album-select-${submission.id}`}>Album</InputLabel>
                            <Select
                              labelId={`album-select-${submission.id}`}
                              label="Album"
                              value={selectValue}
                              onChange={(event) =>
                                handleAlbumSelectionChange(submission.id, event.target.value)
                              }
                            >
                              {contextAlbumOptions.map((option) => (
                                <MenuItem
                                  key={option.id ?? '__default__'}
                                  value={option.id ?? NO_ALBUM_VALUE}
                                >
                                  {option.id === null ? nullAlbumLabel : option.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip label={albumTitle} color="primary" variant="outlined" />
                        )}
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
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
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
                          void handleApprove(submission.id, selectedAlbumId ?? null);
                        }}
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={18} /> : undefined}
                      >
                        Approve
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            );
          })}
        </Box>
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
    </WidgetShell>
  );
};

export default PendingPhotoSubmissionsPanel;
