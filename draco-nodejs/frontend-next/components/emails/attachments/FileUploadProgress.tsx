'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  IconButton,
  Collapse,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RetryIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  CloudUpload as UploadingIcon,
} from '@mui/icons-material';

import { EmailAttachment } from '../../../types/emails/attachments';

export interface FileUploadProgressProps {
  attachments: EmailAttachment[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  _onRemove?: (id: string) => void;
  compact?: boolean;
  collapsible?: boolean;
  showCompleted?: boolean;
}

/**
 * FileUploadProgress - Progress tracking for file uploads
 * Shows upload status, progress bars, and action buttons
 */
export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  attachments,
  onCancel,
  onRetry,
  _onRemove,
  compact = false,
  collapsible = true,
  showCompleted = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter attachments based on settings
  const displayAttachments = React.useMemo(() => {
    if (showCompleted) return attachments;
    return attachments.filter(
      (att) => att.status === 'uploading' || att.status === 'pending' || att.status === 'error',
    );
  }, [attachments, showCompleted]);

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    const uploadingAttachments = attachments.filter(
      (att) => att.status === 'uploading' || att.status === 'pending',
    );

    if (uploadingAttachments.length === 0) return 100;

    const totalProgress = uploadingAttachments.reduce(
      (sum, att) => sum + (att.uploadProgress || 0),
      0,
    );

    return Math.round(totalProgress / uploadingAttachments.length);
  }, [attachments]);

  // Statistics
  const stats = React.useMemo(() => {
    const completed = attachments.filter((att) => att.status === 'uploaded').length;
    const uploading = attachments.filter((att) => att.status === 'uploading').length;
    const pending = attachments.filter((att) => att.status === 'pending').length;
    const failed = attachments.filter((att) => att.status === 'error').length;

    return { completed, uploading, pending, failed, total: attachments.length };
  }, [attachments]);

  const hasActiveUploads = stats.uploading > 0 || stats.pending > 0;

  // Handle collapse toggle
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get status icon and color
  const getStatusIcon = (status: EmailAttachment['status']) => {
    switch (status) {
      case 'uploaded':
        return <SuccessIcon fontSize="small" color="success" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'uploading':
        return <UploadingIcon fontSize="small" color="primary" />;
      default:
        return <UploadingIcon fontSize="small" color="action" />;
    }
  };

  const getStatusColor = (status: EmailAttachment['status']) => {
    switch (status) {
      case 'uploaded':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (displayAttachments.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      {/* Header with overall progress */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                Upload Progress
              </Typography>
              {collapsible && (
                <IconButton size="small" onClick={handleToggleCollapse}>
                  {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
                </IconButton>
              )}
            </Stack>

            {/* Overall progress bar */}
            {hasActiveUploads && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {overallProgress}% complete
                </Typography>
              </Box>
            )}

            {/* Status summary */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {stats.completed > 0 && (
                <Chip
                  label={`${stats.completed} completed`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {stats.uploading > 0 && (
                <Chip
                  label={`${stats.uploading} uploading`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {stats.pending > 0 && (
                <Chip
                  label={`${stats.pending} pending`}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
              {stats.failed > 0 && (
                <Chip
                  label={`${stats.failed} failed`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Individual file progress */}
      <Collapse in={!isCollapsed}>
        <Divider />
        <Box sx={{ p: 2, pt: 1 }}>
          <Stack spacing={compact ? 1 : 2}>
            {displayAttachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  p: compact ? 1 : 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.default',
                }}
              >
                <Stack spacing={1}>
                  {/* File info */}
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {getStatusIcon(attachment.status)}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        noWrap
                        title={attachment.name}
                      >
                        {attachment.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(attachment.size)}
                      </Typography>
                    </Box>

                    <Chip
                      label={attachment.status}
                      size="small"
                      color={
                        getStatusColor(attachment.status) as
                          | 'success'
                          | 'error'
                          | 'primary'
                          | 'default'
                      }
                      variant="outlined"
                    />

                    {/* Action buttons */}
                    <Stack direction="row" spacing={0.5}>
                      {attachment.status === 'uploading' && onCancel && (
                        <IconButton
                          size="small"
                          onClick={() => onCancel(attachment.id)}
                          title="Cancel upload"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}

                      {attachment.status === 'error' && onRetry && (
                        <IconButton
                          size="small"
                          onClick={() => onRetry(attachment.id)}
                          title="Retry upload"
                          color="primary"
                        >
                          <RetryIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  {/* Progress bar for uploading files */}
                  {attachment.status === 'uploading' && (
                    <Box>
                      <LinearProgress
                        variant="determinate"
                        value={attachment.uploadProgress || 0}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {attachment.uploadProgress || 0}%
                      </Typography>
                    </Box>
                  )}

                  {/* Error message */}
                  {attachment.status === 'error' && attachment.error && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {attachment.error}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};
