'use client';

import React from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
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
        <Box
          textAlign="center"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          sx={{ color: 'text.primary' }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Announcement Management
            </Typography>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Publish updates to keep your organization informed and aligned.
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
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
