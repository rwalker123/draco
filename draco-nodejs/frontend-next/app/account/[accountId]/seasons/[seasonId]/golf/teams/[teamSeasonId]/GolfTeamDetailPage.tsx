'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Link as MuiLink,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
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
import { getAccountSeason } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import {
  GolfRoster,
  GolfPlayerForm,
  SignPlayerDialog,
  CreateGolfPlayerDialog,
} from '../../../../../../../../components/golf/teams';
import { useGolfTeams } from '../../../../../../../../hooks/useGolfTeams';
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

  const { getTeamWithRoster } = useGolfTeams(accountId || '');
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

  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [signPlayerOpen, setSignPlayerOpen] = useState(false);
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<GolfRosterEntryType | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!teamSeasonId || !seasonId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTeamWithRoster(seasonId, teamSeasonId);
      if (result.success) {
        setTeam(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [teamSeasonId, seasonId, getTeamWithRoster]);

  const loadRoster = useCallback(async () => {
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
  }, [teamSeasonId, seasonId, getTeamRoster]);

  const loadAvailablePlayers = useCallback(async () => {
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
  }, [seasonId, listAvailablePlayers]);

  const loadSeason = useCallback(async () => {
    if (!accountId || !seasonId) return;

    try {
      const result = await getAccountSeason({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const seasonData = unwrapApiResult(result, 'Failed to load season');

      if (seasonData.leagues && seasonData.leagues.length > 0) {
        setLeagueSeasonId(seasonData.leagues[0].id);
      }
    } catch {
      // Silently fail - team size just won't display
    }
  }, [accountId, seasonId, apiClient]);

  useEffect(() => {
    if (teamSeasonId && seasonId) {
      loadTeam();
      loadRoster();
    }
  }, [teamSeasonId, seasonId, loadTeam, loadRoster]);

  useEffect(() => {
    if (accountId && seasonId) {
      loadSeason();
    }
  }, [accountId, seasonId, loadSeason]);

  const handleBack = useCallback(() => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/flights`);
  }, [accountId, seasonId, router]);

  const handleAddMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  }, []);

  const handleAddMenuClose = useCallback(() => {
    setAddMenuAnchor(null);
  }, []);

  const handleOpenCreatePlayer = useCallback(() => {
    handleAddMenuClose();
    setCreatePlayerOpen(true);
  }, [handleAddMenuClose]);

  const handleOpenSignPlayer = useCallback(async () => {
    handleAddMenuClose();
    await loadAvailablePlayers();
    setSignPlayerOpen(true);
  }, [handleAddMenuClose, loadAvailablePlayers]);

  const handleEditPlayer = useCallback((entry: GolfRosterEntryType) => {
    setEditingPlayer(entry);
    setEditPlayerOpen(true);
  }, []);

  const handleCreatePlayer = useCallback(
    async (data: CreateGolfPlayerType) => {
      if (!teamSeasonId || !seasonId) return;

      setFormLoading(true);
      try {
        const result = await createAndSignPlayer(seasonId, teamSeasonId, data);
        if (result.success) {
          setSuccessMessage('Player added to roster');
          setCreatePlayerOpen(false);
          await loadRoster();
        } else {
          throw new Error(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [teamSeasonId, seasonId, createAndSignPlayer, loadRoster],
  );

  const handleSignPlayer = useCallback(
    async (data: SignPlayerType) => {
      if (!teamSeasonId || !seasonId) return;

      setFormLoading(true);
      try {
        const result = await signPlayer(seasonId, teamSeasonId, data);
        if (result.success) {
          setSuccessMessage('Player signed to roster');
          setSignPlayerOpen(false);
          await loadRoster();
          await loadAvailablePlayers();
        } else {
          throw new Error(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [teamSeasonId, seasonId, signPlayer, loadRoster, loadAvailablePlayers],
  );

  const handleUpdatePlayer = useCallback(
    async (data: CreateGolfPlayerType) => {
      if (!editingPlayer || !seasonId) return;

      setFormLoading(true);
      try {
        const updateData: UpdateGolfPlayerType = {
          initialDifferential: data.initialDifferential,
          isSub: data.isSub,
          isActive: editingPlayer.isActive,
        };
        const result = await updatePlayer(seasonId, editingPlayer.id, updateData);
        if (result.success) {
          setSuccessMessage('Player updated');
          setEditPlayerOpen(false);
          setEditingPlayer(null);
          await loadRoster();
        } else {
          throw new Error(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [editingPlayer, seasonId, updatePlayer, loadRoster],
  );

  const handleReleasePlayer = useCallback(
    async (entry: GolfRosterEntryType) => {
      if (!seasonId) return;

      setFormLoading(true);
      try {
        const releaseData: ReleasePlayerType = {
          releaseAsSub: false,
        };
        const result = await releasePlayer(seasonId, entry.id, releaseData);
        if (result.success) {
          setSuccessMessage('Player released');
          await loadRoster();
        } else {
          setError(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [seasonId, releasePlayer, loadRoster],
  );

  const handleDeletePlayer = useCallback(
    async (entry: GolfRosterEntryType) => {
      if (!seasonId) return;

      setFormLoading(true);
      try {
        const result = await deletePlayer(seasonId, entry.id);
        if (result.success) {
          setSuccessMessage('Player removed from roster');
          await loadRoster();
        } else {
          setError(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [seasonId, deletePlayer, loadRoster],
  );

  if (!accountId || !teamSeasonId || !seasonId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Team information could not be determined.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </main>
    );
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
          loading={rosterLoading}
          error={error}
          onRetry={loadRoster}
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

      <Dialog
        open={editPlayerOpen}
        onClose={() => {
          setEditPlayerOpen(false);
          setEditingPlayer(null);
        }}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-player-dialog-title"
      >
        <DialogTitle id="edit-player-dialog-title" sx={{ pr: 6 }}>
          Edit Player
          <IconButton
            aria-label="close"
            onClick={() => {
              setEditPlayerOpen(false);
              setEditingPlayer(null);
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <GolfPlayerForm
            player={editingPlayer || undefined}
            onSubmit={handleUpdatePlayer}
            onCancel={() => {
              setEditPlayerOpen(false);
              setEditingPlayer(null);
            }}
            disabled={formLoading}
            showSubOption
          />
        </DialogContent>
      </Dialog>

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
