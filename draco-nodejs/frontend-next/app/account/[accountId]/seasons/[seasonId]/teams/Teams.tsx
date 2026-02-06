import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Link } from '@mui/material';
import { getLogoSize } from '../../../../../../config/teams';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import TeamAvatar from '../../../../../../components/TeamAvatar';
import { useApiClient } from '@/hooks/useApiClient';
import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { unwrapApiResult } from '@/utils/apiResult';
import { mapLeagueSetup } from '@/utils/leagueSeasonMapper';
import {
  DivisionSeasonWithTeamsType,
  LeagueSeasonWithDivisionTeamsType,
  LeagueSetupType,
  TeamSeasonType,
} from '@draco/shared-schemas';

interface TeamsProps {
  accountId: string;
  seasonId: string;
  router?: AppRouterInstance;
}

const Teams: React.FC<TeamsProps> = ({ accountId, seasonId, router }) => {
  const apiClient = useApiClient();

  const [teamsData, setTeamsData] = useState<LeagueSetupType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logo configuration
  const LOGO_SIZE = getLogoSize();

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadTeamsData = async () => {
      try {
        setLoading(true);
        setError('');

        const leagueResult = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          query: {
            includeTeams: true,
            includeUnassignedTeams: true,
          },
          throwOnError: false,
        });

        if (!isMounted || abortController.signal.aborted) return;

        const leagueData = unwrapApiResult(leagueResult, 'Failed to load teams data');
        const mapped = mapLeagueSetup(leagueData);
        mapped.season = mapped.season ?? { id: seasonId, name: '', accountId };

        if (isMounted) {
          setTeamsData(mapped);
        }
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load teams data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTeamsData();

    return () => {
      isMounted = false;
      abortController.abort();
      setTeamsData(null);
    };
  }, [accountId, seasonId, apiClient]);

  const renderTeamCard = (teamSeason: TeamSeasonType) => {
    return (
      <Box
        key={teamSeason.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          p: 1,
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <TeamAvatar
          name={teamSeason.name || 'Unknown Team'}
          logoUrl={teamSeason.team.logoUrl ?? undefined}
          size={LOGO_SIZE}
          alt={(teamSeason.name || 'Unknown Team') + ' logo'}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() =>
              router?.push(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeason.id}`)
            }
            sx={{
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'text.primary',
              '&:hover': {
                textDecoration: 'underline',
                color: 'text.primary',
              },
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              p: 0,
              m: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {teamSeason.name || 'Unknown Team'}
          </Link>
        </Box>
      </Box>
    );
  };

  const renderDivision = (division: DivisionSeasonWithTeamsType) => {
    return (
      <Box key={division.id} sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            color: 'text.secondary',
            mb: 1,
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}
        >
          {division.division.name}
        </Typography>
        <Box sx={{ pl: 1 }}>
          {division.teams
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((team) => renderTeamCard(team))}
        </Box>
      </Box>
    );
  };

  const renderLeagueSeason = (leagueSeason: LeagueSeasonWithDivisionTeamsType) => {
    return (
      <Box
        key={leagueSeason.id}
        sx={{
          mb: 3,
          minWidth: 300,
          maxWidth: 400,
          flex: '1 1 auto',
        }}
      >
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box
            sx={{
              mb: 2,
              borderBottom: '2px solid',
              borderColor: 'divider',
              pb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'text.primary',
              }}
            >
              {leagueSeason.league.name}
            </Typography>
          </Box>

          {leagueSeason.divisions?.map(renderDivision)}
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!teamsData) {
    return <Alert severity="info">No teams data available</Alert>;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader
        accountId={accountId}
        style={{ marginBottom: 1 }}
        seasonName={teamsData?.season?.name}
        showSeasonInfo={true}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
            Teams
          </Typography>
        </Box>
      </AccountPageHeader>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          {teamsData?.leagueSeasons?.map(renderLeagueSeason) || null}
        </Box>
      </Paper>
    </main>
  );
};

export default Teams;
