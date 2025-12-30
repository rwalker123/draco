'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StadiumIcon from '@mui/icons-material/Stadium';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ScheduleIcon from '@mui/icons-material/Schedule';
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

const SeasonAdminPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const { summary, loading, error } = useAdminDashboardSummary(accountId || '');

  if (!accountId) {
    return null;
  }

  const subItems: SubItemConfig[] = [
    {
      title: 'Season Management',
      description: 'Create and manage seasons, configure leagues, and set up divisions.',
      icon: <CalendarMonthIcon />,
      href: `/account/${accountId}/seasons`,
      getMetrics: (data) =>
        data && data.season.currentSeasonName
          ? [{ value: data.season.currentSeasonName, label: '' }]
          : [],
    },
    {
      title: 'Schedule Management',
      description: 'Create and manage game schedules for your leagues and divisions.',
      icon: <ScheduleIcon />,
      href: `/account/${accountId}/schedule`,
      getMetrics: () => [],
    },
    {
      title: 'Field Management',
      description: 'Manage playing fields and venues for your games and practices.',
      icon: <StadiumIcon />,
      href: `/account/${accountId}/fields/manage`,
      getMetrics: (data) => (data ? [{ value: data.season.fieldCount, label: 'fields' }] : []),
    },
    {
      title: 'Umpires',
      description: 'Manage umpire roster and assignments for games.',
      icon: <SportsBaseballIcon />,
      href: `/account/${accountId}/umpires/manage`,
      getMetrics: (data) => (data ? [{ value: data.season.umpireCount, label: 'umpires' }] : []),
    },
    {
      title: 'Workout Management',
      description: 'Schedule and manage team workout sessions.',
      icon: <FitnessCenterIcon />,
      href: `/account/${accountId}/workouts`,
      getMetrics: (data) =>
        data ? [{ value: data.season.upcomingWorkouts, label: 'upcoming' }] : [],
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
          Season Administration
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Configure seasons, manage fields, umpires, and workout schedules.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Season" />

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
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 6 }}>
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

export default SeasonAdminPage;
