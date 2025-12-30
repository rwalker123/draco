'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BusinessIcon from '@mui/icons-material/Business';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import {
  AdminBreadcrumbs,
  AdminSubItemCard,
  type AdminSubItemMetric,
} from '../../../../../components/admin';
import { useAdminDashboardSummary } from '../../../../../hooks/useAdminDashboardSummary';
import { useAccount } from '../../../../../context/AccountContext';

interface SubItemConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  baseballOnly?: boolean;
  getMetrics: (
    summary: ReturnType<typeof useAdminDashboardSummary>['summary'],
  ) => AdminSubItemMetric[];
}

const AccountAdminPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { currentAccount } = useAccount();

  const { summary, loading, error } = useAdminDashboardSummary(accountId || '');

  const accountType = currentAccount?.accountType?.toLowerCase() ?? '';
  const isGolf = accountType.includes('golf');

  if (!accountId) {
    return null;
  }

  const allSubItems: SubItemConfig[] = [
    {
      title: 'My Accounts',
      description: 'View and manage all accounts you own or administer.',
      icon: <SwitchAccountIcon />,
      href: '/account-management',
      getMetrics: () => [],
    },
    {
      title: 'Account Settings',
      description: 'Configure your account preferences, branding, and general settings.',
      icon: <SettingsIcon />,
      href: `/account/${accountId}/settings`,
      getMetrics: () => [],
    },
    {
      title: 'User Management',
      description: 'Manage contacts, assign roles, and control user access.',
      icon: <PeopleIcon />,
      href: `/account/${accountId}/users`,
      getMetrics: (data) => (data ? [{ value: data.account.userCount, label: 'users' }] : []),
    },
    {
      title: 'Communications',
      description: 'Send emails and manage communication with your members.',
      icon: <EmailIcon />,
      href: `/account/${accountId}/communications`,
      getMetrics: (data) =>
        data ? [{ value: data.account.recentCommunicationsCount, label: 'recent emails' }] : [],
    },
    {
      title: 'Account Sponsors',
      description: 'Manage sponsor relationships and display sponsor information.',
      icon: <HandshakeIcon />,
      href: `/account/${accountId}/sponsors/manage`,
      baseballOnly: true,
      getMetrics: (data) => (data ? [{ value: data.account.sponsorCount, label: 'sponsors' }] : []),
    },
    {
      title: 'Member Businesses',
      description: 'Showcase businesses owned or operated by your members.',
      icon: <BusinessIcon />,
      href: `/account/${accountId}/member-businesses/manage`,
      baseballOnly: true,
      getMetrics: (data) =>
        data ? [{ value: data.account.memberBusinessCount, label: 'businesses' }] : [],
    },
  ];

  const subItems = allSubItems.filter((item) => !item.baseballOnly || !isGolf);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Account Administration
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage account settings, users, communications, and business relationships.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Account" />

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

export default AccountAdminPage;
