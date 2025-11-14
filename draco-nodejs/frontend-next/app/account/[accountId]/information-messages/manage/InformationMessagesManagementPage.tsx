'use client';

import React from 'react';
import { Alert, Box, Container, CircularProgress, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import { getAccountById } from '@draco/shared-api-client';
import { type TeamSeasonWithPlayerCountType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../../../../utils/apiResult';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { useAuth } from '../../../../../context/AuthContext';
import InformationMessagesManager from '../../../../../components/information/InformationMessagesManager';
import { createContextDataService } from '../../../../../services/contextDataService';
import { type InformationMessageTeamOption } from '../../../../../components/information/InformationMessageFormDialog';

const mapTeamOption = (team: TeamSeasonWithPlayerCountType): InformationMessageTeamOption => ({
  teamSeasonId: team.id,
  teamId: team.team.id,
  label: team.name || team.team?.id || 'Team',
});

const InformationMessagesManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const apiClient = useApiClient();
  const { token } = useAuth();

  const [teamOptions, setTeamOptions] = React.useState<InformationMessageTeamOption[]>([]);
  const [defaultTeamSeasonId, setDefaultTeamSeasonId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId) {
      setLoading(false);
      setError('Account not found');
      return;
    }

    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId },
          query: { includeCurrentSeason: true },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const payload = unwrapApiResult(result, 'Failed to load account information');

        const seasons = payload.seasons ?? [];
        const currentSeason =
          seasons.find((season) => season.isCurrent) ?? payload.currentSeason ?? null;
        const currentSeasonId = currentSeason?.id ?? null;

        if (!currentSeasonId) {
          setTeamOptions([]);
          setDefaultTeamSeasonId(null);
          setLoading(false);
          return;
        }

        if (!token) {
          setTeamOptions([]);
          setDefaultTeamSeasonId(null);
          setLoading(false);
          return;
        }

        const contextService = createContextDataService(token);
        const teams = await contextService.fetchTeams(accountId, currentSeasonId);

        if (ignore) {
          return;
        }

        const mappedOptions = teams.map(mapTeamOption);
        setTeamOptions(mappedOptions);
        setDefaultTeamSeasonId(mappedOptions[0]?.teamSeasonId ?? null);
      } catch (err) {
        if (ignore) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load information messages';
        setError(message);
        setTeamOptions([]);
        setDefaultTeamSeasonId(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, token]);

  if (!accountId) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography variant="body1">Loading information messages...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Information Messages
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Craft welcome content for your account and teams to keep members informed.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <InformationMessagesManager
          scope={{
            type: 'account',
            accountId,
            teamOptions,
            defaultTeamSeasonId,
          }}
          accent="info"
        />
      </Container>
    </main>
  );
};

export default InformationMessagesManagementPage;
