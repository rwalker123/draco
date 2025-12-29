'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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

const ContentAdminPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const { summary, loading, error } = useAdminDashboardSummary(accountId || '');

  if (!accountId) {
    return null;
  }

  const subItems: SubItemConfig[] = [
    {
      title: 'FAQ Management',
      description: 'Create and manage frequently asked questions for your members.',
      icon: <HelpOutlineIcon />,
      href: `/account/${accountId}/league-faq/manage`,
      getMetrics: (data) => (data ? [{ value: data.content.faqCount, label: 'FAQs' }] : []),
    },
    {
      title: 'Handouts',
      description: 'Upload and manage downloadable documents and handouts.',
      icon: <DescriptionIcon />,
      href: `/account/${accountId}/handouts/manage`,
      getMetrics: (data) => (data ? [{ value: data.content.handoutCount, label: 'handouts' }] : []),
    },
    {
      title: 'Information Messages',
      description: 'Create informational content pages for your account and teams.',
      icon: <InfoOutlinedIcon />,
      href: `/account/${accountId}/information-messages/manage`,
      getMetrics: (data) =>
        data ? [{ value: data.content.infoMessageCount, label: 'messages' }] : [],
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
          Content Administration
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage FAQs, handouts, and informational content for members.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Content" />

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

export default ContentAdminPage;
