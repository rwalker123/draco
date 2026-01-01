'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs, AdminSubItemCard } from '../../../../../components/admin';

interface SubItemConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const GolfSeasonAdminPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  if (!accountId) {
    return null;
  }

  const subItems: SubItemConfig[] = [
    {
      title: 'Season Management',
      description: 'Create and manage seasons for your golf league.',
      icon: <CalendarMonthIcon />,
      href: `/account/${accountId}/seasons`,
    },
    {
      title: 'Schedule Management',
      description: 'Create and manage game schedules for your leagues and divisions.',
      icon: <ScheduleIcon />,
      href: `/account/${accountId}/schedule`,
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
          Configure seasons and manage flight assignments.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Season" />

        <Grid container spacing={3}>
          {subItems.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 6 }}>
              <AdminSubItemCard
                title={item.title}
                description={item.description}
                icon={item.icon}
                href={item.href}
                metrics={[]}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </main>
  );
};

export default GolfSeasonAdminPage;
