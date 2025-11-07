'use client';

import React from 'react';
import NextLink from 'next/link';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import WidgetShell from '../ui/WidgetShell';
import { formatDateTime } from '../../utils/dateUtils';
import { sanitizeRichContent } from '../../utils/sanitization';

export interface SpecialAnnouncementCard {
  id: string;
  title: string;
  publishedAt: string;
  accountId: string;
  teamId?: string;
  visibility: 'account' | 'team';
  body?: string;
  sourceLabel?: string;
  heading?: string;
  isSpecial?: boolean;
}

export interface SpecialAnnouncementsWidgetProps {
  announcements: SpecialAnnouncementCard[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  accent?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  showSourceLabels?: boolean;
}

const SpecialAnnouncementsWidget: React.FC<SpecialAnnouncementsWidgetProps> = ({
  announcements,
  loading = false,
  error = null,
  title = 'Announcements',
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  accent = 'secondary',
  showSourceLabels = true,
}) => {
  if (!loading && !error && announcements.length === 0) {
    return null;
  }

  const actions = viewAllHref ? (
    <Button component={NextLink} href={viewAllHref} size="small">
      {viewAllLabel}
    </Button>
  ) : undefined;

  return (
    <WidgetShell title={title} subtitle={subtitle} accent={accent} actions={actions}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: announcements.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
            },
          }}
        >
          {announcements.map((announcement) => {
            const safeBody = announcement.body ? sanitizeRichContent(announcement.body) : '';
            const showSourceLabel = showSourceLabels && Boolean(announcement.sourceLabel);
            const titleMarginTop = showSourceLabel || announcement.heading ? 0.5 : 1;

            return (
              <Card key={announcement.id} variant="outlined">
                <CardContent>
                  {showSourceLabel ? (
                    <Typography variant="overline" color="secondary">
                      {announcement.sourceLabel}
                    </Typography>
                  ) : null}
                  {announcement.heading ? (
                    <Typography variant="subtitle2" color="text.primary">
                      {announcement.heading}
                    </Typography>
                  ) : null}
                  <Typography variant="h6" sx={{ mt: titleMarginTop, mb: 0.5 }}>
                    {announcement.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: safeBody ? 1.5 : 0 }}
                  >
                    {formatDateTime(announcement.publishedAt)}
                  </Typography>
                  {safeBody ? (
                    <Box
                      sx={{
                        '& p': { mb: 1 },
                        '&:last-child p:last-of-type': { mb: 0 },
                        color: 'text.primary',
                      }}
                      dangerouslySetInnerHTML={{ __html: safeBody }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </WidgetShell>
  );
};

export default SpecialAnnouncementsWidget;
