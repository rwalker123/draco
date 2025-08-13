'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Box, Typography, Button, Stack, alpha, useTheme } from '@mui/material';
import { CloudUpload as UploadIcon, AttachFile as AttachIcon } from '@mui/icons-material';

import { AttachmentConfig } from '../../../types/emails/attachments';

export interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  config: AttachmentConfig;
  disabled?: boolean;
  compact?: boolean;
  accept?: string[];
  className?: string;
}

/**
 * FileUploadZone - Drag and drop file upload interface
 * Supports both drag-drop and click-to-select file upload
 */
export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  config,
  disabled = false,
  compact = false,
  accept = [],
  className,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input to allow selecting the same file again
      if (event.target) {
        event.target.value = '';
      }
    },
    [onFilesSelected],
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, onFilesSelected],
  );

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Format accepted file types for display
  const acceptedTypesText = React.useMemo(() => {
    if (!accept || accept.length === 0) return 'All file types';

    const extensions = accept
      .filter((type) => type.startsWith('.'))
      .map((ext) => ext.toUpperCase())
      .slice(0, 3);

    if (extensions.length === 0) return 'All file types';
    if (extensions.length <= 3) return extensions.join(', ');

    return `${extensions.slice(0, 2).join(', ')} and ${accept.length - 2} more`;
  }, [accept]);

  // Format max file size for display
  const maxSizeText = React.useMemo(() => {
    if (!config.maxFileSize) return 'No size limit';
    const sizeInMB = config.maxFileSize / (1024 * 1024);
    return `${sizeInMB}MB max per file`;
  }, [config.maxFileSize]);

  return (
    <Box className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop zone */}
      <Box
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragOver ? 'primary.main' : disabled ? 'action.disabled' : 'divider',
          borderRadius: 2,
          p: compact ? 2 : 4,
          bgcolor: isDragOver
            ? alpha(theme.palette.primary.main, 0.05)
            : disabled
              ? 'action.hover'
              : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          textAlign: 'center',
          position: 'relative',
          ...(!disabled && {
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            },
          }),
        }}
      >
        <Stack spacing={compact ? 1 : 2} alignItems="center">
          {/* Upload icon */}
          <UploadIcon
            sx={{
              fontSize: compact ? 32 : 48,
              color: isDragOver ? 'primary.main' : disabled ? 'action.disabled' : 'action.active',
            }}
          />

          {/* Main text */}
          <Typography
            variant={compact ? 'body2' : 'h6'}
            color={disabled ? 'text.disabled' : 'text.primary'}
            fontWeight="medium"
          >
            {isDragOver
              ? 'Drop files here'
              : compact
                ? 'Drop files or click to upload'
                : 'Drag and drop files here, or click to select'}
          </Typography>

          {/* File restrictions */}
          {!compact && (
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {acceptedTypesText}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {maxSizeText} • Up to {config.maxFiles || 'unlimited'} files
              </Typography>
            </Stack>
          )}

          {/* Browse button */}
          {!isDragOver && (
            <Button
              variant="outlined"
              startIcon={<AttachIcon />}
              size={compact ? 'small' : 'medium'}
              disabled={disabled}
              sx={{ mt: compact ? 1 : 2 }}
            >
              Browse Files
            </Button>
          )}
        </Stack>

        {/* Overlay for drag state */}
        {isDragOver && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              border: 2,
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              zIndex: 1,
            }}
          />
        )}
      </Box>

      {/* Compact file restrictions */}
      {compact && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {acceptedTypesText} • {maxSizeText} • Up to {config.maxFiles || 'unlimited'} files
        </Typography>
      )}
    </Box>
  );
};
