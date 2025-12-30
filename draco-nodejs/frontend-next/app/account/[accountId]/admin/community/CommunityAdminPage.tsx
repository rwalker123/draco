'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import CampaignIcon from '@mui/icons-material/Campaign';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import {
  AdminBreadcrumbs,
  AdminSubItemCard,
  type AdminSubItemMetric,
} from '../../../../../components/admin';
import { useAdminDashboardSummary } from '../../../../../hooks/useAdminDashboardSummary';

interface SubItemConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  getMetrics: (
    summary: ReturnType<typeof useAdminDashboardSummary>['summary'],
  ) => AdminSubItemMetric[];
}

const CommunityAdminPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const { summary, loading, error } = useAdminDashboardSummary(accountId || '');

  if (!accountId) {
    return null;
  }

  const subItems: SubItemConfig[] = [
    {
      title: 'Announcements',
      description: 'Create and manage announcements to keep your community informed.',
      icon: <CampaignIcon />,
      href: `/account/${accountId}/announcements/manage`,
      getMetrics: (data) =>
        data ? [{ value: data.community.specialAnnouncementsCount, label: 'special' }] : [],
    },
    {
      title: 'Polls',
      description: 'Create polls to gather feedback and engage with members.',
      icon: <HowToVoteIcon />,
      href: `/account/${accountId}/polls/manage`,
      getMetrics: (data) =>
        data ? [{ value: data.community.activePollsCount, label: 'active' }] : [],
    },
    {
      title: 'Surveys',
      description: 'Design and distribute surveys to collect member insights.',
      icon: <QuizIcon />,
      href: `/account/${accountId}/surveys/manage`,
      getMetrics: (data) =>
        data ? [{ value: data.community.surveysEnabled ? 'Enabled' : 'Disabled', label: '' }] : [],
    },
    {
      title: 'Hall of Fame',
      description: 'Honor outstanding members and their achievements.',
      icon: <EmojiEventsIcon />,
      href: `/account/${accountId}/hall-of-fame/manage`,
      getMetrics: (data) =>
        data ? [{ value: data.community.hallOfFameMembersCount, label: 'members' }] : [],
    },
    {
      title: 'Photo Gallery',
      description: 'Manage photo submissions and curate the community gallery.',
      icon: <PhotoLibraryIcon />,
      href: `/account/${accountId}/photo-gallery/admin`,
      getMetrics: (data) =>
        data
          ? [
              {
                value: data.community.pendingPhotosCount,
                label: 'pending',
                status: data.community.pendingPhotosCount > 0 ? 'warning' : 'default',
              },
            ]
          : [],
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Community Administration
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Engage members through announcements, polls, surveys, and photo galleries.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Community" />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Unable to load summary data. You can still navigate to admin sections.
          </Alert>
        )}

        <Grid container spacing={3}>
          {subItems.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <AdminSubItemCard
                title={item.title}
                description={item.description}
                icon={item.icon}
                href={item.href}
                metrics={item.getMetrics(summary)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </main>
  );
};

export default CommunityAdminPage;
