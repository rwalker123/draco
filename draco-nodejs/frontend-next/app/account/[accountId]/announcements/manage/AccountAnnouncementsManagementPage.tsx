'use client';

import React from 'react';
import { Container, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../components/admin';
import AnnouncementsManager from '../../../../../components/announcements/AnnouncementsManager';

const AccountAnnouncementsManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  if (!accountId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Announcement Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Publish updates to keep your organization informed and aligned.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Community', href: `/account/${accountId}/admin/community` }}
          currentPage="Announcement Management"
        />
        <Stack spacing={3}>
          <AnnouncementsManager
            scope={{ type: 'account', accountId }}
            title="Account Announcements"
            description="Create announcements for your entire organization."
            accent="success"
            emptyMessage="No announcements have been created yet."
          />
        </Stack>
      </Container>
    </main>
  );
};

export default AccountAnnouncementsManagementPage;
