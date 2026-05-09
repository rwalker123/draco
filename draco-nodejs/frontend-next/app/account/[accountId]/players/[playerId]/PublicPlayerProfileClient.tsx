'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import type { BaseContactType, PublicPlayerProfileType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import ContactInfoCard from '../../../../../components/profile/ContactInfoCard';
import CurrentSeasonTeamsCard from '../../../../../components/profile/CurrentSeasonTeamsCard';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { fetchPublicPlayerProfile } from '../../../../../services/publicPlayerProfileService';
import { useAccount } from '../../../../../context/AccountContext';

interface PublicPlayerProfileClientProps {
  accountId: string;
  contactId: string;
}

const buildSyntheticContact = (profile: PublicPlayerProfileType | null): BaseContactType | null => {
  if (!profile) return null;
  const synthetic: BaseContactType = {
    id: profile.contact.id,
    firstName: profile.contact.firstName,
    lastName: profile.contact.lastName,
    photoUrl: profile.contact.photoUrl,
  };
  return synthetic;
};

export default function PublicPlayerProfileClient({
  accountId,
  contactId,
}: PublicPlayerProfileClientProps) {
  const apiClient = useApiClient();
  const { currentAccount } = useAccount();

  const [profile, setProfile] = useState<PublicPlayerProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !contactId) return;

    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPublicPlayerProfile(accountId, contactId, {
          client: apiClient,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setProfile(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load player profile';
        setError(message);
        setProfile(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [accountId, contactId, apiClient]);

  const contactCardContact = buildSyntheticContact(profile);
  const accountName = typeof currentAccount?.name === 'string' ? currentAccount.name : undefined;
  const seasonName = profile?.currentSeason?.name ?? null;

  const statisticsHref = profile?.hasCareerStatistics
    ? `/account/${accountId}/players/${contactId}/statistics?returnTo=${encodeURIComponent(
        `/account/${accountId}/players/${contactId}`,
      )}&returnLabel=Player%20Profile`
    : null;

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
            Player Profile
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
          }}
        >
          <ContactInfoCard
            contact={contactCardContact}
            loading={loading}
            error={error ?? undefined}
            accountName={accountName}
            hideDetails
          />
          <Stack spacing={3}>
            <CurrentSeasonTeamsCard
              accountId={accountId}
              seasonName={seasonName}
              teams={profile?.teams ?? []}
              loading={loading}
              error={error ?? undefined}
            />
            {statisticsHref ? (
              <Box>
                <Button
                  component={NextLink}
                  href={statisticsHref}
                  variant="contained"
                  color="primary"
                  startIcon={<BarChartIcon />}
                >
                  View Career Statistics
                </Button>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Container>
    </main>
  );
}
