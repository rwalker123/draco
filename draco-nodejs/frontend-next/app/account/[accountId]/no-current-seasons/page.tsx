'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Typography, Container } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';

const NoCurrentSeasonsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountId =
    (Array.isArray(params.accountId) ? params.accountId[0] : params.accountId) || '';

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId} />
      <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
        <Box sx={{ p: 4, borderRadius: 2, boxShadow: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h5" gutterBottom>
            This page requires a current season.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => router.push(`/account/${accountId}`)}
          >
            Return to Account Home
          </Button>
        </Box>
      </Container>
    </main>
  );
};

export default NoCurrentSeasonsPage;
