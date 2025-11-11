'use client';

import React, { useEffect } from 'react';
import { Alert, Box, Button, Container, CircularProgress, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import SocialHubExperience from './SocialHubExperience';
import { useAccountMembership } from '@/hooks/useAccountMembership';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';

interface SocialHubContainerProps {
  accountId: string;
}

const SocialHubContainer: React.FC<SocialHubContainerProps> = ({ accountId }) => {
  const router = useRouter();
  const { isMember } = useAccountMembership(accountId || undefined);
  const {
    currentSeasonId,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId || '');

  useEffect(() => {
    if (!accountId) {
      return;
    }
    void fetchCurrentSeason();
  }, [accountId, fetchCurrentSeason]);

  if (!accountId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Account context could not be determined for the Social Hub.
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => router.push('/accounts')}>
            Browse Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  if (seasonLoading && !currentSeasonId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading current season…
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!currentSeasonId && seasonError) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {seasonError}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => router.push(`/account/${accountId}/seasons`)}>
            Manage Seasons
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <SocialHubExperience
      accountId={accountId}
      seasonId={currentSeasonId ?? undefined}
      isAccountMember={isMember}
    />
  );
};

export default SocialHubContainer;
