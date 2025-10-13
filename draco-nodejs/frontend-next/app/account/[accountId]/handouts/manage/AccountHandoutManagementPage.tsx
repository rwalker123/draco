'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import HandoutSection from '@/components/handouts/HandoutSection';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

const AccountHandoutManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  if (!accountId) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Box textAlign="center">
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              Handout Management
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', opacity: 0.85 }}>
              Upload, update, and remove the handouts available to your members.
            </Typography>
          </Box>
        </AccountPageHeader>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <HandoutSection
            scope={{ type: 'account', accountId }}
            title="Manage Handouts"
            description="Add new documents or update existing ones for your organization."
            allowManage
            variant="panel"
            emptyMessage="No handouts have been added yet."
          />
        </Container>
      </main>
    </ProtectedRoute>
  );
};

export default AccountHandoutManagementPage;
