'use client';

import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
} from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { listAccountAnnouncements } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import type { AnnouncementType, AnnouncementListType } from '@draco/shared-schemas';
import { unwrapApiResult } from '@/utils/apiResult';
import AnnouncementDetailDialog from '@/components/announcements/AnnouncementDetailDialog';
import { formatDateTime } from '@/utils/dateUtils';
import WidgetShell from '@/components/ui/WidgetShell';

const AccountAnnouncementsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const apiClient = useApiClient();

  const [announcements, setAnnouncements] = React.useState<AnnouncementType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState<AnnouncementType | null>(
    null,
  );

  React.useEffect(() => {
    if (!accountId) {
      setAnnouncements([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listAccountAnnouncements({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const payload = unwrapApiResult<AnnouncementListType>(
          result,
          'Failed to load account announcements',
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
        const message = err instanceof Error ? err.message : 'Failed to load account announcements';
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
  }, [accountId, apiClient]);

  const handleAnnouncementSelect = (announcement: AnnouncementType) => {
    setSelectedAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  if (!accountId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Account Announcements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review all announcements shared with your organization.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <WidgetShell
          title="Announcements"
          subtitle="Review all announcements shared with your organization."
          accent="secondary"
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : announcements.length === 0 ? (
            <Alert severity="info">No announcements have been posted yet.</Alert>
          ) : (
            <List disablePadding>
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
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <Typography variant="h6">{announcement.title}</Typography>
                      {announcement.isSpecial ? (
                        <Chip label="Special" color="secondary" size="small" sx={{ ml: 1 }} />
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
        </WidgetShell>
      </Container>

      <AnnouncementDetailDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        loading={false}
        error={null}
        announcement={selectedAnnouncement}
        fallbackTitle={selectedAnnouncement?.title}
        sourceLabel="Account Announcement"
        publishedAt={selectedAnnouncement?.publishedAt}
        isSpecial={selectedAnnouncement?.isSpecial}
      />
    </main>
  );
};

export default AccountAnnouncementsPage;
