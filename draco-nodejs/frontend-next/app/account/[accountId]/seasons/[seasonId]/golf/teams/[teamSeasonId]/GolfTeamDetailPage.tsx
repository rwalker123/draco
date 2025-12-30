'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  PersonAdd as SignIcon,
  PersonAddAlt as CreateIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfTeamWithRosterType,
  GolfRosterEntryType,
  GolfSubstituteType,
  AvailablePlayerType,
  CreateGolfPlayerType,
  SignPlayerType,
  UpdateGolfPlayerType,
  ReleasePlayerType,
} from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import GolfRoster from '../../../../../../../../components/golf/teams/GolfRoster';
import SubstituteList from '../../../../../../../../components/golf/teams/SubstituteList';
import GolfPlayerForm from '../../../../../../../../components/golf/teams/GolfPlayerForm';
import SignPlayerDialog from '../../../../../../../../components/golf/teams/SignPlayerDialog';
import { useGolfTeams } from '../../../../../../../../hooks/useGolfTeams';
import { useGolfRosters } from '../../../../../../../../hooks/useGolfRosters';
import { useRole } from '../../../../../../../../context/RoleContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `team-tab-${index}`,
    'aria-controls': `team-tabpanel-${index}`,
  };
}

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

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const { getTeamWithRoster } = useGolfTeams(accountId || '');
  const {
    getTeamRoster,
    listSubstitutesForSeason,
    listAvailablePlayers,
    createAndSignPlayer,
    signPlayer,
    updatePlayer,
    releasePlayer,
    deletePlayer,
  } = useGolfRosters(accountId || '');

  const [team, setTeam] = useState<GolfTeamWithRosterType | null>(null);
  const [roster, setRoster] = useState<GolfRosterEntryType[]>([]);
  const [substitutes, setSubstitutes] = useState<GolfSubstituteType[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayerType[]>([]);

  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [signPlayerOpen, setSignPlayerOpen] = useState(false);
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<GolfRosterEntryType | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!teamSeasonId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTeamWithRoster(teamSeasonId);
      if (result.success) {
        setTeam(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [teamSeasonId, getTeamWithRoster]);

  const loadRoster = useCallback(async () => {
    if (!teamSeasonId) return;

    setRosterLoading(true);
    try {
      const result = await getTeamRoster(teamSeasonId);
      if (result.success) {
        setRoster(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setRosterLoading(false);
    }
  }, [teamSeasonId, getTeamRoster]);

  const loadSubstitutes = useCallback(async () => {
    if (!seasonId) return;

    setSubsLoading(true);
    try {
      const result = await listSubstitutesForSeason(seasonId);
      if (result.success) {
        setSubstitutes(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setSubsLoading(false);
    }
  }, [seasonId, listSubstitutesForSeason]);

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

  useEffect(() => {
    if (teamSeasonId) {
      loadTeam();
      loadRoster();
    }
  }, [teamSeasonId, loadTeam, loadRoster]);

  useEffect(() => {
    if (seasonId) {
      loadSubstitutes();
    }
  }, [seasonId, loadSubstitutes]);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

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
        const result = await createAndSignPlayer(teamSeasonId, seasonId, data);
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
        const result = await signPlayer(teamSeasonId, seasonId, data);
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
      if (!editingPlayer) return;

      setFormLoading(true);
      try {
        const updateData: UpdateGolfPlayerType = {
          initialDifferential: data.initialDifferential,
          isSub: data.isSub,
          isActive: editingPlayer.isActive,
        };
        const result = await updatePlayer(editingPlayer.id, updateData);
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
    [editingPlayer, updatePlayer, loadRoster],
  );

  const handleReleasePlayer = useCallback(
    async (entry: GolfRosterEntryType) => {
      if (!seasonId) return;

      setFormLoading(true);
      try {
        const releaseData: ReleasePlayerType = {
          releaseAsSub: false,
        };
        const result = await releasePlayer(entry.id, seasonId, releaseData);
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
      setFormLoading(true);
      try {
        const result = await deletePlayer(entry.id);
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
    [deletePlayer, loadRoster],
  );

  const handleSignSubToTeam = useCallback(
    async (sub: GolfSubstituteType) => {
      if (!teamSeasonId || !seasonId) return;

      setFormLoading(true);
      try {
        const signData: SignPlayerType = {
          contactId: sub.player.id,
          initialDifferential: sub.initialDifferential,
          isSub: false,
        };
        const result = await signPlayer(teamSeasonId, seasonId, signData);
        if (result.success) {
          setSuccessMessage('Substitute signed to team');
          await loadRoster();
          await loadSubstitutes();
        } else {
          setError(result.error);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [teamSeasonId, seasonId, signPlayer, loadRoster, loadSubstitutes],
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="team roster tabs">
            <Tab label="Roster" {...a11yProps(0)} />
            <Tab label="Substitutes" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SubstituteList
            substitutes={substitutes}
            loading={subsLoading}
            error={error}
            onRetry={loadSubstitutes}
            onSignToTeam={canManage ? handleSignSubToTeam : undefined}
            emptyMessage="No substitutes available for this season."
            actionsDisabled={formLoading}
            showDifferential
          />
        </TabPanel>
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

      <Dialog
        open={createPlayerOpen}
        onClose={() => setCreatePlayerOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="create-player-dialog-title"
      >
        <DialogTitle id="create-player-dialog-title" sx={{ pr: 6 }}>
          Add New Player
          <IconButton
            aria-label="close"
            onClick={() => setCreatePlayerOpen(false)}
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
            onSubmit={handleCreatePlayer}
            onCancel={() => setCreatePlayerOpen(false)}
            disabled={formLoading}
            showSubOption
          />
        </DialogContent>
      </Dialog>

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
