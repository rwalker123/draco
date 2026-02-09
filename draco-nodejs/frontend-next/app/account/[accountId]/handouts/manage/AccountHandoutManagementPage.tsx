'use client';

import React from 'react';
import { Container, Fab, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../components/admin';
import HandoutSection from '@/components/handouts/HandoutSection';

const AccountHandoutManagementPage: React.FC = () => {
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
          Handout Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Upload, update, and remove the handouts available to your members.
        </Typography>
      </AccountPageHeader>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Content', href: `/account/${accountId}/admin/content` }}
          currentPage="Handout Management"
        />
        <HandoutSection
          scope={{ type: 'account', accountId }}
          title="Manage Handouts"
          description="Add new documents or update existing ones for your organization."
          allowManage
          variant="panel"
          emptyMessage="No handouts have been added yet."
          renderCreateTrigger={({ openCreate, disabled }) => (
            <Fab
              color="primary"
              aria-label="Add handout"
              onClick={openCreate}
              disabled={disabled}
              sx={{
                position: 'fixed',
                bottom: { xs: 24, md: 32 },
                right: { xs: 24, md: 32 },
                zIndex: (theme) => theme.zIndex.tooltip,
              }}
            >
              <AddIcon />
            </Fab>
          )}
        />
      </Container>
    </main>
  );
};

export default AccountHandoutManagementPage;
