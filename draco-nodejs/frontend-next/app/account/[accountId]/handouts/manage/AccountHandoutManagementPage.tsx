'use client';

import React from 'react';
import { Box, Container, Fab, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
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
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Handout Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
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
