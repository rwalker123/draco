'use client';

import React from 'react';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import HandoutSection from '@/components/handouts/HandoutSection';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';

const AccountHandoutsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const {
    contact,
    loading: membershipLoading,
    error: membershipError,
  } = useAccountMembership(accountId);
  const canViewHandouts = Boolean(contact);

  if (!accountId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}
          >
            Handouts
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Browse important forms, documents, and resources shared with your organization.
          </Typography>
        </Box>
      </AccountPageHeader>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {membershipError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {membershipError}
          </Alert>
        )}
        {membershipLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        {!membershipLoading && !canViewHandouts && !membershipError && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Handouts are available to account contacts. Please sign in with a contact account to
            view them.
          </Alert>
        )}
        {canViewHandouts && (
          <HandoutSection
            scope={{ type: 'account', accountId }}
            title="Available Handouts"
            description="Download files published by your administrators."
            allowManage={false}
            variant="panel"
            emptyMessage="No handouts are available yet."
            hideWhenEmpty
          />
        )}
      </Container>
    </main>
  );
};

export default AccountHandoutsPage;
