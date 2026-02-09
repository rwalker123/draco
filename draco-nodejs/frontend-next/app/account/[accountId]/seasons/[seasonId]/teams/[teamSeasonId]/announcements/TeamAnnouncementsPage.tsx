'use client';

import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useApiClient } from '@/hooks/useApiClient';
import { listTeamAnnouncements } from '@draco/shared-api-client';
import type { AnnouncementType, AnnouncementListType } from '@draco/shared-schemas';
import { unwrapApiResult } from '@/utils/apiResult';
import { useTeamResourceHeader } from '@/hooks/useTeamHandoutHeader';
import TeamHandoutPageLayout from '@/components/handouts/TeamHandoutPageLayout';
import AnnouncementDetailDialog from '@/components/announcements/AnnouncementDetailDialog';
import { formatDateTime } from '@/utils/dateUtils';

const TeamAnnouncementsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const apiClient = useApiClient();

  const {
    teamHeader,
    loading: headerLoading,
    error: headerError,
    notMember,
  } = useTeamResourceHeader({
    accountId,
    seasonId,
    teamSeasonId,
  });
  const resolvedTeamId = teamHeader?.teamId ?? null;

  const [announcements, setAnnouncements] = React.useState<AnnouncementType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState<AnnouncementType | null>(
    null,
  );

  React.useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId || notMember) {
      setAnnouncements([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!resolvedTeamId) {
      return;
    }

    const controller = new AbortController();

    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listTeamAnnouncements({
          client: apiClient,
          path: { accountId, teamId: resolvedTeamId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const payload = unwrapApiResult<AnnouncementListType>(
          result,
          'Failed to load team announcements',
        );
        const sorted = payload.announcements
          .slice()
          .sort(
            (a: AnnouncementType, b: AnnouncementType) =>
              new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          );
        setAnnouncements(sorted);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load team announcements';
        setError(message);
        setAnnouncements([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchAnnouncements();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, resolvedTeamId, apiClient, notMember]);

  const handleAnnouncementSelect = (announcement: AnnouncementType) => {
    setSelectedAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const breadcrumbHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  return (
    <>
      <TeamHandoutPageLayout
        accountId={accountId}
        teamHeader={teamHeader}
        loading={headerLoading}
        error={headerError}
        notAuthorized={notMember}
        notAuthorizedMessage="Team announcements are only available to team members."
        title={`${teamHeader?.teamName ?? 'Team'} Announcements`}
        breadcrumbHref={breadcrumbHref}
        currentLabel="Announcements"
      >
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : announcements.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            This team has not posted any announcements yet.
          </Alert>
        ) : (
          <List>
            {announcements.map((announcement) => (
              <ListItem
                key={announcement.id}
                disablePadding
                sx={{ mb: 1, borderRadius: 1, overflow: 'hidden' }}
              >
                <ListItemButton
                  onClick={() => handleAnnouncementSelect(announcement)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Typography variant="h6">{announcement.title}</Typography>
                    {announcement.isSpecial ? (
                      <Chip label="Special" color="secondary" size="small" />
                    ) : null}
                  </Box>
                  <ListItemText
                    secondary={formatDateTime(announcement.publishedAt)}
                    secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </TeamHandoutPageLayout>

      <AnnouncementDetailDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        loading={false}
        error={null}
        announcement={selectedAnnouncement}
        fallbackTitle={selectedAnnouncement?.title}
        sourceLabel={`${teamHeader?.teamName ?? 'Team'} Announcement`}
        publishedAt={selectedAnnouncement?.publishedAt}
        isSpecial={selectedAnnouncement?.isSpecial}
      />
    </>
  );
};

export default TeamAnnouncementsPage;
