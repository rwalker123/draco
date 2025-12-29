'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import ArticleIcon from '@mui/icons-material/Article';
import ShareIcon from '@mui/icons-material/Share';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminCategoryCard, type AdminMetric } from '../../../../components/admin';
import { useAdminDashboardSummary } from '../../../../hooks/useAdminDashboardSummary';
import { useRole } from '../../../../context/RoleContext';

interface CategoryConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  getMetrics: (summary: ReturnType<typeof useAdminDashboardSummary>['summary']) => AdminMetric[];
}

const AdminHubPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasRole } = useRole();

  const { summary, loading, error } = useAdminDashboardSummary(accountId || '');

  const isGlobalAdmin = hasRole('Administrator');

  if (!accountId) {
    return null;
  }

  const categories: CategoryConfig[] = [
    {
      title: 'Account',
      description: 'Manage account settings, users, communications, and business relationships.',
      icon: <SettingsIcon />,
      href: `/account/${accountId}/admin/account`,
      getMetrics: (data) =>
        data
          ? [
              { value: data.account.userCount, label: 'users' },
              { value: data.account.sponsorCount, label: 'sponsors' },
            ]
          : [],
    },
    {
      title: 'Season',
      description: 'Configure seasons, manage fields, umpires, and workout schedules.',
      icon: <CalendarMonthIcon />,
      href: `/account/${accountId}/admin/season`,
      getMetrics: (data) =>
        data
          ? [
              { value: data.season.currentSeasonName || 'No season', label: '' },
              { value: data.season.fieldCount, label: 'fields' },
            ]
          : [],
    },
    {
      title: 'Community',
      description: 'Engage members through announcements, polls, surveys, and photo galleries.',
      icon: <GroupsIcon />,
      href: `/account/${accountId}/admin/community`,
      getMetrics: (data) =>
        data
          ? [
              { value: data.community.activePollsCount, label: 'polls' },
              {
                value: data.community.pendingPhotosCount,
                label: 'pending photos',
                status: data.community.pendingPhotosCount > 0 ? 'warning' : 'default',
              },
            ]
          : [],
    },
    {
      title: 'Content',
      description: 'Manage FAQs, handouts, and informational content for members.',
      icon: <ArticleIcon />,
      href: `/account/${accountId}/admin/content`,
      getMetrics: (data) =>
        data
          ? [
              { value: data.content.faqCount, label: 'FAQs' },
              { value: data.content.handoutCount, label: 'handouts' },
            ]
          : [],
    },
    {
      title: 'Social Media',
      description: 'Connect and manage your social media platforms.',
      icon: <ShareIcon />,
      href: `/account/${accountId}/social-media`,
      getMetrics: (data) =>
        data ? [{ value: data.account.socialPlatformsConnected, label: 'connected' }] : [],
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
          Admin Hub
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage all aspects of your account from one place.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
          {categories.map((category) => (
            <Grid key={category.title} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
              <AdminCategoryCard
                title={category.title}
                description={category.description}
                icon={category.icon}
                href={category.href}
                metrics={category.getMetrics(summary)}
              />
            </Grid>
          ))}
        </Grid>

        {/* Global Administration Section - Administrators Only */}
        {isGlobalAdmin && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}
            >
              Global Administration
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <AdminCategoryCard
                  title="Admin Dashboard"
                  description="System-wide administration and monitoring tools."
                  icon={<DashboardIcon />}
                  href="/admin"
                  metrics={[]}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <AdminCategoryCard
                  title="Alert Management"
                  description="Create and manage system-wide alerts and notifications."
                  icon={<CampaignIcon />}
                  href="/admin/alerts"
                  metrics={[]}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </main>
  );
};

export default AdminHubPage;
