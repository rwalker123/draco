'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import SportsGolfIcon from '@mui/icons-material/SportsGolf';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminCategoryCard } from '../../../../components/admin';
import { useRole } from '../../../../context/RoleContext';

interface CategoryConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const GolfAdminHubPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasRole } = useRole();

  const isGlobalAdmin = hasRole('Administrator');

  if (!accountId) {
    return null;
  }

  const categories: CategoryConfig[] = [
    {
      title: 'Account',
      description: 'Manage account settings and users.',
      icon: <SettingsIcon />,
      href: `/account/${accountId}/admin/account`,
    },
    {
      title: 'Seasons',
      description: 'Configure seasons, flights, and teams.',
      icon: <CalendarMonthIcon />,
      href: `/account/${accountId}/admin/season`,
    },
    {
      title: 'Golf Courses',
      description: 'Manage golf courses and tee configurations.',
      icon: <GolfCourseIcon />,
      href: `/account/${accountId}/golf/courses`,
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
          Golf Admin Hub
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage your golf league from one place.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid key={category.title} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
              <AdminCategoryCard
                title={category.title}
                description={category.description}
                icon={category.icon}
                href={category.href}
                metrics={[]}
              />
            </Grid>
          ))}
        </Grid>

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
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <AdminCategoryCard
                  title="Golf Course Management"
                  description="Create and manage golf courses. Only global admins can create courses from scratch."
                  icon={<SportsGolfIcon />}
                  href="/admin/golf/courses"
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

export default GolfAdminHubPage;
