'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Archive as ArchiveIcon,
  GridView as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import {
  EmailAttachment,
  formatFileSize,
  getFileCategory,
} from '../../../types/emails/attachments';

interface AttachmentPreviewProps {
  attachments: EmailAttachment[];
  onRemove?: (id: string) => void;
  onDownload?: (attachment: EmailAttachment) => void;
  onPreview?: (attachment: EmailAttachment) => void;
  readOnly?: boolean;
  compact?: boolean;
  maxDisplayCount?: number;
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
 * AttachmentPreview - Read-only display of email attachments
 */
export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
  onDownload,
  onPreview,
  readOnly = false,
  compact = false,
  maxDisplayCount,
}) => {
  if (attachments.length === 0) {
    return null;
  }

  const displayAttachments = maxDisplayCount ? attachments.slice(0, maxDisplayCount) : attachments;
  const hiddenCount = attachments.length - displayAttachments.length;
  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);

  // Handle download
  const handleDownload = (attachment: EmailAttachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else if (attachment.url) {
      // Default download behavior
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.click();
    }
  };

  // Handle preview
  const handlePreview = (attachment: EmailAttachment) => {
    if (onPreview) {
      onPreview(attachment);
    } else if (attachment.previewUrl) {
      // Default preview behavior - open in new window
      window.open(attachment.previewUrl, '_blank');
    }
  };

  if (compact) {
    return (
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {displayAttachments.map((attachment) => {
            const category = getFileCategory(attachment.name);

            return (
              <Chip
                key={attachment.id}
                icon={getFileIcon(category, attachment.status)}
                label={`${attachment.name} (${formatFileSize(attachment.size)})`}
                variant="outlined"
                size="small"
                onDelete={!readOnly && onRemove ? () => onRemove(attachment.id) : undefined}
                onClick={() => attachment.url && handleDownload(attachment)}
                sx={{
                  cursor: attachment.url ? 'pointer' : 'default',
                  maxWidth: '200px',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            );
          })}

          {hiddenCount > 0 && (
            <Chip label={`+${hiddenCount} more`} size="small" color="primary" variant="outlined" />
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''} •{' '}
          {formatFileSize(totalSize)}
        </Typography>
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="medium">
            Attachments ({attachments.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(totalSize)}
          </Typography>
        </Stack>

        <List dense sx={{ py: 0 }}>
          {displayAttachments.map((attachment) => {
            const category = getFileCategory(attachment.name);
            const isUploaded = attachment.status === 'uploaded';
            const hasError = attachment.status === 'error';

            return (
              <ListItem
                key={attachment.id}
                sx={{
                  px: 0,
                  opacity: hasError ? 0.6 : 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getFileIcon(category, attachment.status)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: hasError ? 'normal' : 'medium',
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

                      {hasError && attachment.error && (
                        <Tooltip title={attachment.error}>
                          <ErrorIcon color="error" sx={{ fontSize: 14 }} />
                        </Tooltip>
                      )}

                      {isUploaded && <CheckIcon color="success" sx={{ fontSize: 14 }} />}
                    </Stack>
                  }
                />

                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0.5}>
                    {/* Preview button for images and PDFs */}
                    {isUploaded && attachment.previewUrl && (
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => handlePreview(attachment)}>
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Download button */}
                    {isUploaded && attachment.url && (
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(attachment)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Remove button */}
                    {!readOnly && onRemove && (
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemove(attachment.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {hiddenCount > 0 && (
          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              and {hiddenCount} more attachment{hiddenCount !== 1 ? 's' : ''}...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
