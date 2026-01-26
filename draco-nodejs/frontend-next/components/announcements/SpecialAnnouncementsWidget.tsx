'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import WidgetShell from '../ui/WidgetShell';
import RichTextContent from '../common/RichTextContent';
import { formatDateTime } from '../../utils/dateUtils';
import { sanitizeRichContent } from '../../utils/sanitization';
import { useApiClient } from '../../hooks/useApiClient';
import { listAccountAnnouncements, listTeamAnnouncements } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../utils/apiResult';

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
  accountId: string;
  teamIds?: string[];
  teamMetadata?: Record<string, { name: string; leagueName?: string }>;
  showAccountAnnouncements?: boolean;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  accent?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  showSourceLabels?: boolean;
}

const EMPTY_TEAM_IDS: string[] = [];
const EMPTY_TEAM_METADATA: Record<string, { name: string; leagueName?: string }> = {};

const SpecialAnnouncementsWidget: React.FC<SpecialAnnouncementsWidgetProps> = ({
  accountId,
  teamIds,
  teamMetadata,
  showAccountAnnouncements = true,
  title = 'Announcements',
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  accent = 'secondary',
  showSourceLabels = true,
}) => {
  const resolvedTeamIds = teamIds ?? EMPTY_TEAM_IDS;
  const resolvedTeamMetadata = teamMetadata ?? EMPTY_TEAM_METADATA;
  const apiClient = useApiClient();
  const [announcements, setAnnouncements] = useState<SpecialAnnouncementCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;

    let ignore = false;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);

        let accountAnnouncementsNormalized: SpecialAnnouncementCard[] = [];

        if (showAccountAnnouncements) {
          const accountResult = await listAccountAnnouncements({
            client: apiClient,
            path: { accountId },
            throwOnError: false,
          });

          if (ignore) return;

          const accountData = unwrapApiResult(
            accountResult,
            'Failed to load account announcements',
          );

          accountAnnouncementsNormalized = (accountData.announcements ?? [])
            .filter((a) => a.isSpecial)
            .map((a) => ({
              ...a,
              sourceLabel: 'Account Announcement',
            }));
        }

        const teamAnnouncementPromises = resolvedTeamIds.map(async (teamId) => {
          const result = await listTeamAnnouncements({
            client: apiClient,
            path: { accountId, teamId },
            throwOnError: false,
          });

          const data = unwrapApiResult(result, 'Failed to load team announcements');

          const metadata = resolvedTeamMetadata[teamId];
          const teamName = metadata?.name ?? 'Team';
          const leagueName = metadata?.leagueName;
          const sourceLabel = `${teamName} Announcement`;
          const heading =
            leagueName && leagueName !== 'Unknown League' ? `${leagueName} ${teamName}` : teamName;

          return (data.announcements ?? [])
            .filter((a) => a.isSpecial)
            .map((a) => ({
              ...a,
              sourceLabel,
              heading,
            }));
        });

        const teamAnnouncementsArrays = await Promise.all(teamAnnouncementPromises);
        const teamAnnouncementsFlattened = teamAnnouncementsArrays.flat();

        const allAnnouncements = [
          ...accountAnnouncementsNormalized,
          ...teamAnnouncementsFlattened,
        ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        if (!ignore) {
          setAnnouncements(allAnnouncements);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load announcements');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchAnnouncements();

    return () => {
      ignore = true;
    };
  }, [accountId, resolvedTeamIds, resolvedTeamMetadata, showAccountAnnouncements, apiClient]);

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
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ mt: titleMarginTop, mb: 0.5 }}
                  >
                    {announcement.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: safeBody ? 1.5 : 0 }}
                  >
                    {formatDateTime(announcement.publishedAt)}
                  </Typography>
                  {safeBody ? <RichTextContent html={safeBody} sanitize={false} /> : null}
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
