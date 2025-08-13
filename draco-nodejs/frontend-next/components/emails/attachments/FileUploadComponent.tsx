'use client';

import React, { useCallback } from 'react';
import { Box, Stack, Alert, Collapse, Paper, Typography, Divider } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

import { FileUploadZone } from './FileUploadZone';
import { FileUploadProgress } from './FileUploadProgress';
import { StorageQuotaIndicator } from './StorageQuotaIndicator';
import { useFileUpload } from './hooks/useFileUpload';
import { useEmailCompose } from '../compose/EmailComposeProvider';
import {
  AttachmentConfig,
  DEFAULT_ATTACHMENT_CONFIG,
  EmailAttachment,
} from '../../../types/emails/attachments';

export interface FileUploadComponentProps {
  accountId: string;
  config?: AttachmentConfig;
  showQuota?: boolean;
  showProgress?: boolean;
  showPreview?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onAttachmentsChange?: (attachments: EmailAttachment[]) => void;
  onError?: (error: Error) => void;
}

/**
 * FileUploadComponent - Complete file upload system with drag-drop, progress, and quota management
 */
export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  accountId,
  config = DEFAULT_ATTACHMENT_CONFIG,
  showQuota = true,
  showProgress = true,
  showPreview = true,
  compact = false,
  disabled = false,
  onAttachmentsChange,
  onError,
}) => {
  const { actions } = useEmailCompose();

  const {
    attachments,
    isUploading,
    errors,
    addFiles,
    // removeAttachment, // Available for future use
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

  // Handle attachment removal (unused but available for future use)
  // const handleRemoveAttachment = useCallback((id: string) => {
  //   removeAttachment(id);
  //   actions.removeAttachment(id);
  // }, [removeAttachment, actions]);

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

  const hasActiveUploads = attachments.some(
    (att) => att.status === 'uploading' || att.status === 'pending',
  );

  const hasAttachments = attachments.length > 0;

  return (
    <Box>
      {/* Storage quota indicator */}
      {showQuota && (
        <StorageQuotaIndicator
          accountId={accountId}
          compact={compact}
          showDetails={!compact}
          onQuotaExceeded={() => {
            onError?.(new Error('Storage quota exceeded. Please free up space.'));
          }}
        />
      )}

      {/* Upload errors */}
      {errors.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" variant="outlined">
              {error}
            </Alert>
          ))}
        </Stack>
      )}

      {/* File upload zone */}
      <Box sx={{ mt: 2 }}>
        <FileUploadZone
          onFilesSelected={handleFilesSelected}
          config={config}
          disabled={disabled || isUploading}
          compact={compact}
          accept={config.allowedTypes}
        />
      </Box>

      {/* Upload progress */}
      <Collapse in={showProgress && hasActiveUploads}>
        <FileUploadProgress
          attachments={attachments}
          onCancel={handleCancelUpload}
          onRetry={handleRetryUpload}
          compact={compact}
          collapsible={!compact}
        />
      </Collapse>

      {/* Attachment preview */}
      {showPreview && hasAttachments && (
        <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <UploadIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight="medium">
              Attachments ({attachments.length})
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1}>
            {attachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {attachment.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(attachment.size / 1024 / 1024).toFixed(1)} MB
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      attachment.status === 'uploaded'
                        ? 'success.main'
                        : attachment.status === 'error'
                          ? 'error.main'
                          : 'text.secondary'
                    }
                  >
                    {attachment.status}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
