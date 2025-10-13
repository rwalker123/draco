'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import HandoutSection from '@/components/handouts/HandoutSection';

const AccountHandoutsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  if (!accountId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            Handouts
          </Typography>
          <Typography variant="body1" sx={{ color: 'white', opacity: 0.85 }}>
            Browse important forms, documents, and resources shared with your organization.
          </Typography>
        </Box>
      </AccountPageHeader>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <HandoutSection
          scope={{ type: 'account', accountId }}
          title="Available Handouts"
          description="Download files published by your administrators."
          allowManage={false}
          variant="panel"
          emptyMessage="No handouts are available yet."
        />
      </Container>
    </main>
  );
};

export default AccountHandoutsPage;
