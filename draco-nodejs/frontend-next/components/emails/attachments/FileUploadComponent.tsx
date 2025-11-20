'use client';

import React, { useCallback } from 'react';
import {
  Box,
  Stack,
  Alert,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  LinearProgress,
  IconButton,
  alpha,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  Refresh as RetryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  CloudUpload as UploadingIcon,
  Close as RemoveIcon,
} from '@mui/icons-material';

import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from './hooks/useFileUpload';
import { useEmailCompose } from '../compose/EmailComposeProvider';
import {
  AttachmentConfig,
  DEFAULT_ATTACHMENT_CONFIG,
  EmailAttachment,
} from '../../../types/emails/attachments';

// Memoized AttachmentItem component to prevent unnecessary re-renders
interface AttachmentItemProps {
  attachment: EmailAttachment;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}

const AttachmentItem = React.memo<AttachmentItemProps>(
  ({ attachment, onRetry, onCancel, onRemove }) => {
    const theme = useTheme();
    const isUploading = attachment.status === 'uploading';
    const isError = attachment.status === 'error';
    const isUploaded = attachment.status === 'uploaded';
    const errorBg = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.18 : 0.08);
    const removeHoverBg = alpha(
      theme.palette.error.main,
      theme.palette.mode === 'dark' ? 0.2 : 0.1,
    );

    return (
      <Box
        sx={{
          p: 1.5,
          border: 1,
          borderColor: isError ? 'error.main' : 'divider',
          borderRadius: 1,
          bgcolor: isError ? errorBg : 'background.paper',
        }}
      >
        {/* File info row */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: isUploading ? 1 : 0 }}>
          {/* Status icon */}
          <Box sx={{ minWidth: 20 }}>
            {isUploaded && <SuccessIcon fontSize="small" color="success" />}
            {isError && <ErrorIcon fontSize="small" color="error" />}
            {isUploading && <UploadingIcon fontSize="small" color="primary" />}
          </Box>

          {/* File name */}
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isUploading ? 'medium' : 'normal',
            }}
          >
            {attachment.name}
          </Typography>

          {/* File size */}
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {(attachment.size / 1024 / 1024).toFixed(1)} MB
          </Typography>

          {/* Action buttons */}
          <Stack direction="row" spacing={0.5}>
            {isError && (
              <>
                <IconButton
                  size="small"
                  onClick={() => onRetry(attachment.id)}
                  title="Retry upload"
                >
                  <RetryIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onCancel(attachment.id)}
                  title="Cancel upload"
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {isUploading && (
              <IconButton
                size="small"
                onClick={() => onCancel(attachment.id)}
                title="Cancel upload"
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            )}
            {/* Remove button - available for all attachments */}
            <IconButton
              size="small"
              onClick={() => onRemove(attachment.id)}
              title="Remove attachment"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'error.main',
                  bgcolor: removeHoverBg,
                },
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Progress bar for uploading files */}
        {isUploading && (
          <Box>
            <LinearProgress
              variant="determinate"
              value={attachment.uploadProgress || 0}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Uploading... {Math.round(attachment.uploadProgress || 0)}%
            </Typography>
          </Box>
        )}

        {/* Error message */}
        {isError && attachment.error && (
          <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
            {attachment.error}
          </Typography>
        )}
      </Box>
    );
  },
);

// Set display name for React DevTools
AttachmentItem.displayName = 'AttachmentItem';

export interface FileUploadComponentProps {
  accountId: string;
  config?: AttachmentConfig;
  showPreview?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onAttachmentsChange?: (attachments: EmailAttachment[]) => void;
  onError?: (error: Error) => void;
}

/**
 * FileUploadComponent - Complete file upload system with drag-drop and progress tracking
 */
export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  accountId: _accountId,
  config = DEFAULT_ATTACHMENT_CONFIG,
  showPreview = true,
  compact = false,
  disabled = false,
  onAttachmentsChange,
  onError,
}) => {
  const { actions } = useEmailCompose();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    attachments,
    isUploading,
    errors,
    addFiles,
    removeAttachment,
    retryUpload,
    cancelUpload,
  } = useFileUpload({
    config,
    onAttachmentsChange: useCallback(
      (newAttachments: EmailAttachment[]) => {
        // Update EmailCompose context
        actions.updateAttachments(newAttachments);
        onAttachmentsChange?.(newAttachments);
      },
      [actions, onAttachmentsChange],
    ),
    onError,
  });

  // Handle file selection
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (disabled) return;
      await addFiles(files);
    },
    [disabled, addFiles],
  );

  // Handle retry
  const handleRetryUpload = useCallback(
    async (id: string) => {
      await retryUpload(id);
    },
    [retryUpload],
  );

  // Handle cancel
  const handleCancelUpload = useCallback(
    (id: string) => {
      cancelUpload(id);
    },
    [cancelUpload],
  );

  // Handle remove attachment
  const handleRemoveAttachment = useCallback(
    (id: string) => {
      removeAttachment(id);
    },
    [removeAttachment],
  );

  const hasAttachments = attachments.length > 0;

  return (
    <Box>
      {/* Upload errors */}
      {errors.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" variant="outlined">
              {error}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Main content area - responsive layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: !hasAttachments ? 'column' : 'row' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Attachments section - Mobile: First, Desktop: First (left side, main content) */}
        {showPreview && hasAttachments && (
          <Box
            sx={{
              flex: { xs: '1', md: '2 1 0' }, // Desktop: takes 2/3 of available space
              minWidth: 0, // Prevents flex item from overflowing
              order: { xs: 1, md: 1 }, // Mobile: first, Desktop: first (left)
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: 'fit-content',
                bgcolor: 'background.paper',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <UploadIcon
                  fontSize="small"
                  sx={{ color: isUploading ? 'primary.main' : 'text.secondary' }}
                />
                <Typography variant="subtitle2" fontWeight="medium" color="text.primary">
                  Attachments ({attachments.length})
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5}>
                {attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onRetry={handleRetryUpload}
                    onCancel={handleCancelUpload}
                    onRemove={handleRemoveAttachment}
                  />
                ))}
              </Stack>
            </Paper>
          </Box>
        )}

        {/* Upload zone - Mobile: Second, Desktop: Second (right side, compact) */}
        <Box
          sx={{
            flex: { xs: '1', md: hasAttachments ? '1 0 300px' : '1' }, // Desktop: fixed ~300px width when attachments exist
            minWidth: 0, // Prevents flex item from overflowing
            order: { xs: 2, md: 2 }, // Mobile: second, Desktop: second (right)
          }}
        >
          {/* File upload zone */}
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            config={config}
            disabled={disabled || isUploading}
            compact={compact || (!isMobile && hasAttachments)}
            accept={config.allowedTypes}
          />
        </Box>
      </Box>
    </Box>
  );
};
