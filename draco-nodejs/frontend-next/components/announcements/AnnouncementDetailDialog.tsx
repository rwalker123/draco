'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { AnnouncementType } from '@draco/shared-schemas';
import { formatDateTime } from '../../utils/dateUtils';
import { sanitizeRichContent } from '../../utils/sanitization';

interface AnnouncementDetailDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error?: string | null;
  announcement?: AnnouncementType | null;
  fallbackTitle?: string;
  sourceLabel?: string;
  publishedAt?: string;
  isSpecial?: boolean;
}

const AnnouncementDetailDialog: React.FC<AnnouncementDetailDialogProps> = ({
  open,
  onClose,
  loading,
  error,
  announcement,
  fallbackTitle,
  sourceLabel,
  publishedAt,
  isSpecial,
}) => {
  const title = announcement?.title ?? fallbackTitle ?? 'Announcement Details';
  const publishedAtValue = announcement?.publishedAt ?? publishedAt ?? '';
  const formattedDate =
    publishedAtValue && publishedAtValue.length > 0 ? formatDateTime(publishedAtValue) : null;
  const specialFlag = announcement?.isSpecial ?? isSpecial ?? false;
  const bodyContent = React.useMemo(
    () => sanitizeRichContent(announcement?.body ?? ''),
    [announcement?.body],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        ) : announcement ? (
          <Stack spacing={1.5}>
            {sourceLabel ? (
              <Typography variant="subtitle2" color="text.secondary">
                {sourceLabel}
              </Typography>
            ) : null}
            {formattedDate ? (
              <Typography variant="body2" color="text.secondary">
                {formattedDate}
              </Typography>
            ) : null}
            {specialFlag ? (
              <Typography variant="overline" color="secondary">
                Special Announcement
              </Typography>
            ) : null}
            {bodyContent ? (
              <Box
                sx={{
                  '& p': { mb: 1.5 },
                  '& ul': { pl: 3, mb: 1.5 },
                  '& ol': { pl: 3, mb: 1.5 },
                }}
                dangerouslySetInnerHTML={{ __html: bodyContent }}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                No additional content provided.
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Announcement details are unavailable.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnouncementDetailDialog;
