'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Fab,
  Link as MuiLink,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  PersonAdd as SignIcon,
  PersonAddAlt as CreateIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfTeamWithRosterType,
  GolfRosterEntryType,
  AvailablePlayerType,
  CreateGolfPlayerType,
  SignPlayerType,
  UpdateGolfPlayerType,
  ReleasePlayerType,
} from '@draco/shared-schemas';
import {
  getAccountSeason,
  getGolfTeamWithRoster,
  getGolfTeamRoster,
} from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import {
  GolfRoster,
  SignPlayerDialog,
  CreateGolfPlayerDialog,
  EditGolfPlayerDialog,
} from '../../../../../../../../components/golf/teams';
import { useGolfRosters } from '../../../../../../../../hooks/useGolfRosters';
import { useGolfLeagueSetup } from '../../../../../../../../hooks/useGolfLeagueSetup';
import { useRole } from '../../../../../../../../context/RoleContext';
import { useApiClient } from '../../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../../utils/apiResult';

const GolfTeamDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;
  const { hasPermission } = useRole();
  const apiClient = useApiClient();

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const {
    getTeamRoster,
    listAvailablePlayers,
    createAndSignPlayer,
    signPlayer,
    updatePlayer,
    releasePlayer,
    deletePlayer,
  } = useGolfRosters(accountId || '');

  const [team, setTeam] = useState<GolfTeamWithRosterType | null>(null);
  const [roster, setRoster] = useState<GolfRosterEntryType[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayerType[]>([]);
  const [leagueSeasonId, setLeagueSeasonId] = useState<string>('');

  const { setup: leagueSetup } = useGolfLeagueSetup(accountId, seasonId, leagueSeasonId);

  const activePlayerCount = roster.filter((r) => r.isActive).length;

  const getTeamSizeLabel = (size: number) => {
    switch (size) {
      case 1:
        return 'Individual';
      case 2:
        return 'Pairs';
      case 3:
        return 'Threesomes';
      case 4:
        return 'Foursomes';
      default:
        return `${size} players`;
    }
  };

  const [teamLoading, setTeamLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoading = teamLoading || rosterLoading;

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [signPlayerOpen, setSignPlayerOpen] = useState(false);
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<GolfRosterEntryType | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !teamSeasonId || !seasonId) return;

    const controller = new AbortController();

    const loadTeamAndRoster = async () => {
      setTeamLoading(true);
      setRosterLoading(true);
      setError(null);

      try {
        const [teamResult, rosterResult] = await Promise.all([
          getGolfTeamWithRoster({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            signal: controller.signal,
            throwOnError: false,
          }),
          getGolfTeamRoster({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            signal: controller.signal,
            throwOnError: false,
          }),
        ]);

        if (controller.signal.aborted) return;

        const errors: string[] = [];

        try {
          const teamData = unwrapApiResult(teamResult, 'Failed to load team');
          setTeam(teamData as GolfTeamWithRosterType);
        } catch (err) {
          errors.push(err instanceof Error ? err.message : 'Failed to load team');
        }

        try {
          const rosterData = unwrapApiResult(rosterResult, 'Failed to load roster');
          setRoster(rosterData as GolfRosterEntryType[]);
        } catch (err) {
          errors.push(err instanceof Error ? err.message : 'Failed to load roster');
        }

        if (errors.length > 0) {
          setError(errors.join('; '));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        if (!controller.signal.aborted) {
          setTeamLoading(false);
          setRosterLoading(false);
        }
      }
    };

    void loadTeamAndRoster();

    return () => {
      controller.abort();
    };
  }, [accountId, teamSeasonId, seasonId, apiClient]);

  useEffect(() => {
    if (!accountId || !seasonId) return;

    const controller = new AbortController();

    const loadSeason = async () => {
      try {
        const result = await getAccountSeason({
          client: apiClient,
          path: { accountId, seasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const seasonData = unwrapApiResult(result, 'Failed to load season');

        if (seasonData.leagues && seasonData.leagues.length > 0) {
          setLeagueSeasonId(seasonData.leagues[0].id);
        }
      } catch {
        if (controller.signal.aborted) return;
      }
    };

    void loadSeason();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, apiClient]);

  const refreshRoster = async () => {
    if (!teamSeasonId || !seasonId) return;

    setRosterLoading(true);
    try {
      const result = await getTeamRoster(seasonId, teamSeasonId);
      if (result.success) {
        setRoster(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setRosterLoading(false);
    }
  };

  const refreshAvailablePlayers = async () => {
    if (!seasonId) return;

    setAvailableLoading(true);
    try {
      const result = await listAvailablePlayers(seasonId);
      if (result.success) {
        setAvailablePlayers(result.data);
      }
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/flights`);
  };

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleOpenCreatePlayer = () => {
    handleAddMenuClose();
    setCreatePlayerOpen(true);
  };

  const handleOpenSignPlayer = async () => {
    handleAddMenuClose();
    await refreshAvailablePlayers();
    setSignPlayerOpen(true);
  };

  const handleEditPlayer = (entry: GolfRosterEntryType) => {
    setEditingPlayer(entry);
    setEditPlayerOpen(true);
  };

  const handleCreatePlayer = async (data: CreateGolfPlayerType) => {
    if (!teamSeasonId || !seasonId) return;

    setFormLoading(true);
    try {
      const result = await createAndSignPlayer(seasonId, teamSeasonId, data);
      if (result.success) {
        setSuccessMessage('Player added to roster');
        setCreatePlayerOpen(false);
        await refreshRoster();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignPlayer = async (data: SignPlayerType) => {
    if (!teamSeasonId || !seasonId) return;

    setFormLoading(true);
    try {
      const result = await signPlayer(seasonId, teamSeasonId, data);
      if (result.success) {
        setSuccessMessage('Player signed to roster');
        setSignPlayerOpen(false);
        await refreshRoster();
        await refreshAvailablePlayers();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePlayer = async (data: UpdateGolfPlayerType) => {
    if (!editingPlayer || !seasonId) return;

    setFormLoading(true);
    try {
      const result = await updatePlayer(seasonId, editingPlayer.id, data);
      if (result.success) {
        setSuccessMessage('Player updated');
        setEditPlayerOpen(false);
        setEditingPlayer(null);
        await refreshRoster();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleReleasePlayer = async (entry: GolfRosterEntryType) => {
    if (!seasonId) return;

    setFormLoading(true);
    try {
      const releaseData: ReleasePlayerType = {
        releaseAsSub: false,
      };
      const result = await releasePlayer(seasonId, entry.id, releaseData);
      if (result.success) {
        setSuccessMessage('Player released');
        await refreshRoster();
      } else {
        setError(result.error);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePlayer = async (entry: GolfRosterEntryType) => {
    if (!seasonId) return;

    setFormLoading(true);
    try {
      const result = await deletePlayer(seasonId, entry.id);
      if (result.success) {
        setSuccessMessage('Player removed from roster');
        await refreshRoster();
      } else {
        setError(result.error);
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (!accountId || !teamSeasonId || !seasonId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Team information could not be determined.</Alert>
      </Container>
    );
  }

  if (isInitialLoading) {
    return null;
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-background">
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error">Team not found.</Alert>
          <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
            Back to Flights
          </Button>
        </Container>
      </main>
    );
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
            {team.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
            {team.flight ? `Flight: ${team.flight.name}` : 'Unassigned'} &middot; {team.playerCount}{' '}
            player{team.playerCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} size="small">
            Back to Flights
          </Button>
        </Stack>

        {leagueSetup && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Team Size:
            </Typography>
            <Chip
              label={getTeamSizeLabel(leagueSetup.teamSize ?? 2)}
              size="small"
              color="primary"
              variant="outlined"
            />
            <MuiLink
              component={Link}
              href={`/account/${accountId}/seasons/${seasonId}/golf/leagues/${leagueSeasonId}/setup`}
              underline="hover"
              sx={{ ml: 1, fontSize: '0.875rem' }}
            >
              Change
            </MuiLink>
          </Box>
        )}

        {leagueSetup && activePlayerCount !== (leagueSetup.teamSize ?? 2) && (
          <Alert
            severity={activePlayerCount < (leagueSetup.teamSize ?? 2) ? 'warning' : 'info'}
            sx={{ mb: 3 }}
          >
            {activePlayerCount < (leagueSetup.teamSize ?? 2) ? (
              <>
                This team has {activePlayerCount} player{activePlayerCount !== 1 ? 's' : ''} but
                requires {leagueSetup.teamSize ?? 2}. Add{' '}
                {(leagueSetup.teamSize ?? 2) - activePlayerCount} more player
                {(leagueSetup.teamSize ?? 2) - activePlayerCount !== 1 ? 's' : ''} to complete the
                roster.
              </>
            ) : (
              <>
                This team has {activePlayerCount} players but only {leagueSetup.teamSize ?? 2} can
                play per match. You&apos;ll need to select which players participate in each match.
              </>
            )}
          </Alert>
        )}

        <GolfRoster
          roster={roster}
          error={error}
          onRetry={refreshRoster}
          onEdit={canManage ? handleEditPlayer : undefined}
          onRelease={canManage ? handleReleasePlayer : undefined}
          onDelete={canManage ? handleDeletePlayer : undefined}
          emptyMessage="No players on this team yet."
          actionsDisabled={formLoading}
          showDifferential
        />
      </Container>

      {canManage && (
        <>
          <Fab
            color="primary"
            aria-label="Add player"
            onClick={handleAddMenuOpen}
            disabled={formLoading}
            sx={{
              position: 'fixed',
              bottom: { xs: 24, md: 32 },
              right: { xs: 24, md: 32 },
              zIndex: (theme) => theme.zIndex.tooltip,
            }}
          >
            <AddIcon />
          </Fab>

          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor)}
            onClose={handleAddMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
          >
            <MenuItem onClick={handleOpenSignPlayer}>
              <SignIcon sx={{ mr: 1 }} />
              Sign Existing Player
            </MenuItem>
            <MenuItem onClick={handleOpenCreatePlayer}>
              <CreateIcon sx={{ mr: 1 }} />
              Create New Player
            </MenuItem>
          </Menu>
        </>
      )}

      <CreateGolfPlayerDialog
        open={createPlayerOpen}
        onClose={() => setCreatePlayerOpen(false)}
        onSubmit={handleCreatePlayer}
        teamName={team.name}
        showSubOption
      />

      <SignPlayerDialog
        open={signPlayerOpen}
        onClose={() => setSignPlayerOpen(false)}
        onSign={handleSignPlayer}
        availablePlayers={availablePlayers}
        loadingPlayers={availableLoading}
        teamName={team.name}
      />

      <EditGolfPlayerDialog
        open={editPlayerOpen}
        onClose={() => {
          setEditPlayerOpen(false);
          setEditingPlayer(null);
        }}
        onSubmit={handleUpdatePlayer}
        player={editingPlayer}
        teamName={team.name}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default GolfTeamDetailPage;
