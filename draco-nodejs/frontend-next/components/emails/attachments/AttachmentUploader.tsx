'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  LinearProgress,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Refresh as RetryIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Archive as ArchiveIcon,
  GridView as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  InsertDriveFile as FileIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import {
  EmailAttachment,
  AttachmentConfig,
  DEFAULT_ATTACHMENT_CONFIG,
  formatFileSize,
  getFileCategory,
  validateAttachments,
} from '../../../types/emails/attachments';
import { uploadEmailAttachment } from '../../../utils/emailUtils';

interface AttachmentUploaderProps {
  attachments: EmailAttachment[];
  onAttachmentsChange: (attachments: EmailAttachment[]) => void;
  config?: AttachmentConfig;
  disabled?: boolean;
  showPreview?: boolean;
  compact?: boolean;
}

/**
 * Get icon for file category
 */
function getFileIcon(category: string, status: EmailAttachment['status']) {
  const getColor = () => {
    if (status === 'error') return 'error' as const;
    if (status === 'uploaded') return 'success' as const;
    return 'action' as const;
  };

  const iconProps = {
    fontSize: 'small' as const,
    color: getColor(),
  };

  switch (category) {
    case 'document':
      return <DocumentIcon {...iconProps} />;
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'spreadsheet':
      return <SpreadsheetIcon {...iconProps} />;
    case 'presentation':
      return <PresentationIcon {...iconProps} />;
    case 'archive':
      return <ArchiveIcon {...iconProps} />;
    default:
      return <FileIcon {...iconProps} />;
  }
}

/**
 * Get status icon for attachment
 */
function getStatusIcon(status: EmailAttachment['status']) {
  switch (status) {
    case 'uploaded':
      return <CheckIcon color="success" fontSize="small" />;
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />;
    case 'uploading':
      return <LinearProgress sx={{ width: 16, height: 4 }} />;
    default:
      return null;
  }
}

/**
 * AttachmentUploader - File attachment upload component for email composition
 */
export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onAttachmentsChange,
  config = DEFAULT_ATTACHMENT_CONFIG,
  disabled = false,
  showPreview = true,
  compact = false,
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Calculate current state
  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const uploadingCount = attachments.filter((att) => att.status === 'uploading').length;
  const errorCount = attachments.filter((att) => att.status === 'error').length;

  // Handle file selection
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Add files function
  const addFiles = useCallback(
    async (files: File[]) => {
      // Validate files
      const validation = validateAttachments(files, attachments, config);

      if (!validation.isValid) {
        // Show validation errors
        console.error('File validation errors:', validation.errors);
        return;
      }

      setUploading(true);

      // Create attachment objects
      const newAttachments: EmailAttachment[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        lastModified: file.lastModified,
      }));

      // Add to state immediately
      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsChange(updatedAttachments);

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachment = newAttachments[i];

        try {
          // Update status to uploading
          const uploadingAttachments = updatedAttachments.map((att) =>
            att.id === attachment.id
              ? { ...att, status: 'uploading' as const, uploadProgress: 0 }
              : att,
          );
          onAttachmentsChange(uploadingAttachments);

          // Upload file
          const result = await uploadEmailAttachment(file, token || '', (progress: number) => {
            // Update progress
            const progressAttachments = uploadingAttachments.map((att) =>
              att.id === attachment.id ? { ...att, uploadProgress: progress } : att,
            );
            onAttachmentsChange(progressAttachments);
          });

          // Update with success
          const successAttachments = uploadingAttachments.map((att) =>
            att.id === attachment.id
              ? {
                  ...att,
                  status: 'uploaded' as const,
                  uploadProgress: 100,
                  url: result.url,
                  previewUrl: result.previewUrl,
                }
              : att,
          );
          onAttachmentsChange(successAttachments);
        } catch (error) {
          // Update with error
          const errorAttachments = updatedAttachments.map((att) =>
            att.id === attachment.id
              ? {
                  ...att,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : att,
          );
          onAttachmentsChange(errorAttachments);
        }
      }

      setUploading(false);
    },
    [attachments, config, onAttachmentsChange, token],
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      await addFiles(files);

      // Clear input for next selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles],
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled) {
        setDragOver(true);
      }
    },
    [disabled],
  );

  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);

      if (disabled) return;

      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) return;

      await addFiles(files);
    },
    [disabled, addFiles],
  );

  // Remove attachment
  const removeAttachment = useCallback(
    (id: string) => {
      const updated = attachments.filter((att) => att.id !== id);
      onAttachmentsChange(updated);
    },
    [attachments, onAttachmentsChange],
  );

  // Retry upload
  const retryUpload = useCallback(
    async (id: string) => {
      const attachment = attachments.find((att) => att.id === id);
      if (!attachment || attachment.status !== 'error') return;

      // Find original file (not possible from state, would need file cache)
      // For now, just reset status and let user re-add
      removeAttachment(id);
    },
    [attachments, removeAttachment],
  );

  // Clear all attachments
  const clearAll = useCallback(() => {
    onAttachmentsChange([]);
  }, [onAttachmentsChange]);

  return (
    <Box>
      {/* Upload Zone */}
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 2 : 3,
          border: dragOver ? 2 : 1,
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderStyle: dragOver ? 'dashed' : 'solid',
          backgroundColor: dragOver ? 'primary.50' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'primary.50',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? handleFileSelect : undefined}
      >
        <Stack spacing={2} alignItems="center">
          <UploadIcon
            sx={{
              fontSize: compact ? 32 : 48,
              color: dragOver ? 'primary.main' : 'text.secondary',
            }}
          />

          <Box textAlign="center">
            <Typography variant={compact ? 'body2' : 'body1'} gutterBottom>
              {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </Typography>

            {!compact && (
              <Typography variant="caption" color="text.secondary">
                Maximum {config.maxFiles} files, {formatFileSize(config.maxFileSize || 0)} per file
              </Typography>
            )}
          </Box>

          {!compact && (
            <Button
              variant="outlined"
              startIcon={<AttachIcon />}
              disabled={disabled || uploading}
              onClick={(e) => {
                e.stopPropagation();
                handleFileSelect();
              }}
            >
              Choose Files
            </Button>
          )}
        </Stack>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={config.allowedTypes?.join(',') || '*'}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Uploading {uploadingCount} file{uploadingCount !== 1 ? 's' : ''}...
          </Typography>
        </Box>
      )}

      {/* Validation Errors */}
      {errorCount > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {errorCount} attachment{errorCount !== 1 ? 's' : ''} failed to upload. Check the files
          below and retry if needed.
        </Alert>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && showPreview && (
        <Box sx={{ mt: 2 }}>
          {!compact && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">Attachments ({attachments.length})</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={formatFileSize(totalSize)}
                  size="small"
                  color={totalSize > (config.maxTotalSize || Infinity) ? 'error' : 'default'}
                />
                {attachments.length > 0 && (
                  <Button size="small" color="error" onClick={clearAll}>
                    Clear All
                  </Button>
                )}
              </Stack>
            </Stack>
          )}

          <List dense={compact}>
            {attachments.map((attachment, index) => {
              const category = getFileCategory(attachment.name);
              const statusIcon = getStatusIcon(attachment.status);

              return (
                <Box key={attachment.id}>
                  <ListItem sx={{ px: 1 }}>
                    <ListItemIcon>{getFileIcon(category, attachment.status)}</ListItemIcon>

                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {attachment.name}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(attachment.size)}
                          </Typography>
                          {attachment.status === 'uploading' &&
                            attachment.uploadProgress !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(attachment.uploadProgress)}%
                              </Typography>
                            )}
                          {attachment.status === 'error' && attachment.error && (
                            <Tooltip title={attachment.error}>
                              <WarningIcon color="error" fontSize="small" />
                            </Tooltip>
                          )}
                        </Stack>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {statusIcon}

                        {attachment.status === 'error' && (
                          <IconButton
                            size="small"
                            onClick={() => retryUpload(attachment.id)}
                            color="primary"
                          >
                            <RetryIcon fontSize="small" />
                          </IconButton>
                        )}

                        <IconButton
                          size="small"
                          onClick={() => removeAttachment(attachment.id)}
                          color="error"
                          disabled={attachment.status === 'uploading'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {/* Upload progress bar for individual files */}
                  {attachment.status === 'uploading' && attachment.uploadProgress !== undefined && (
                    <Box sx={{ px: 3, pb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={attachment.uploadProgress}
                        sx={{ height: 4 }}
                      />
                    </Box>
                  )}

                  {index < attachments.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        </Box>
      )}

      {/* Compact summary */}
      {compact && attachments.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {attachments.length} attachment{attachments.length !== 1 ? 's' : ''} •{' '}
            {formatFileSize(totalSize)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
