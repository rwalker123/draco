'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';
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
  const resolvedTeamMetadata = teamMetadata ?? EMPTY_TEAM_METADATA;
  const teamIdsKey = (teamIds ?? EMPTY_TEAM_IDS).join(',');
  const apiClient = useApiClient();
  const [announcements, setAnnouncements] = useState<SpecialAnnouncementCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;

    const controller = new AbortController();
    const currentTeamIds = teamIdsKey ? teamIdsKey.split(',') : [];

    const fetchAnnouncements = async () => {
      try {
        setError(null);

        let accountAnnouncementsNormalized: SpecialAnnouncementCard[] = [];

        if (showAccountAnnouncements) {
          const accountResult = await listAccountAnnouncements({
            client: apiClient,
            path: { accountId },
            signal: controller.signal,
            throwOnError: false,
          });

          if (controller.signal.aborted) return;

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

        const teamAnnouncementPromises = currentTeamIds.map(async (teamId) => {
          const result = await listTeamAnnouncements({
            client: apiClient,
            path: { accountId, teamId },
            signal: controller.signal,
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
        if (controller.signal.aborted) return;
        const teamAnnouncementsFlattened = teamAnnouncementsArrays.flat();

        const allAnnouncements = [
          ...accountAnnouncementsNormalized,
          ...teamAnnouncementsFlattened,
        ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        setAnnouncements(allAnnouncements);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      }
    };

    void fetchAnnouncements();

    return () => {
      controller.abort();
    };
  }, [accountId, teamIdsKey, resolvedTeamMetadata, showAccountAnnouncements, apiClient]);

  if (announcements.length === 0 && !error) {
    return null;
  }

  const actions = viewAllHref ? (
    <Button component={NextLink} href={viewAllHref} size="small">
      {viewAllLabel}
    </Button>
  ) : undefined;

  return (
    <WidgetShell title={title} subtitle={subtitle} accent={accent} actions={actions}>
      {error ? (
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
