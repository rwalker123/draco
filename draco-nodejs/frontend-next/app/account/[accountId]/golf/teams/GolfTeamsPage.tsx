'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfTeamType,
  GolfFlightWithTeamCountType,
  CreateGolfTeamType,
} from '@draco/shared-schemas';
import { listAccountSeasons } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import GolfTeamList from '../../../../../components/golf/teams/GolfTeamList';
import GolfTeamForm from '../../../../../components/golf/teams/GolfTeamForm';
import { useGolfTeams } from '../../../../../hooks/useGolfTeams';
import { useGolfFlights } from '../../../../../hooks/useGolfFlights';
import { useRole } from '../../../../../context/RoleContext';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../utils/apiResult';

interface SeasonOption {
  id: string;
  name: string;
  isCurrent: boolean;
  leagueSeasonId?: string;
}

const GolfTeamsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasPermission } = useRole();
  const apiClient = useApiClient();

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const {
    listTeams,
    listTeamsForFlight,
    createTeam,
    updateTeam,
    deleteTeam,
    assignToFlight,
    removeFromFlight,
  } = useGolfTeams(accountId || '');

  const { listFlights } = useGolfFlights(accountId || '');

  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueSeasonId, setSelectedLeagueSeasonId] = useState<string>('');
  const [flights, setFlights] = useState<GolfFlightWithTeamCountType[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>('all');
  const [teams, setTeams] = useState<GolfTeamType[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTeam, setEditingTeam] = useState<GolfTeamType | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSeasons = useCallback(async () => {
    if (!accountId) return;

    try {
      const result = await listAccountSeasons({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const seasonsData = unwrapApiResult(result, 'Failed to load seasons');

      interface SeasonData {
        id: string;
        name: string;
        isCurrent: boolean;
        leagueSeasons?: Array<{ id: string }>;
      }

      const mappedSeasons: SeasonOption[] = (seasonsData as SeasonData[]).map((s) => ({
        id: s.id,
        name: s.name,
        isCurrent: s.isCurrent,
        leagueSeasonId: s.leagueSeasons?.[0]?.id,
      }));

      setSeasons(mappedSeasons);

      const currentSeason = mappedSeasons.find((s) => s.isCurrent);
      if (currentSeason) {
        setSelectedSeasonId(currentSeason.id);
        setSelectedLeagueSeasonId(currentSeason.leagueSeasonId || '');
      } else if (mappedSeasons.length > 0) {
        setSelectedSeasonId(mappedSeasons[0].id);
        setSelectedLeagueSeasonId(mappedSeasons[0].leagueSeasonId || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    }
  }, [accountId, apiClient]);

  const loadFlights = useCallback(async () => {
    if (!selectedSeasonId) return;

    try {
      const result = await listFlights(selectedSeasonId);
      if (result.success) {
        setFlights(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flights');
    }
  }, [selectedSeasonId, listFlights]);

  const loadTeams = useCallback(async () => {
    if (!selectedSeasonId) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (selectedFlightId && selectedFlightId !== 'all') {
        result = await listTeamsForFlight(selectedFlightId);
      } else {
        result = await listTeams(selectedSeasonId);
      }

      if (result.success) {
        setTeams(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSeasonId, selectedFlightId, listTeams, listTeamsForFlight]);

  useEffect(() => {
    if (accountId) {
      loadSeasons();
    }
  }, [accountId, loadSeasons]);

  useEffect(() => {
    if (selectedSeasonId) {
      loadFlights();
      loadTeams();
    }
  }, [selectedSeasonId, loadFlights, loadTeams]);

  useEffect(() => {
    if (selectedSeasonId) {
      loadTeams();
    }
  }, [selectedFlightId, loadTeams, selectedSeasonId]);

  const handleSeasonChange = useCallback(
    (newSeasonId: string) => {
      setSelectedSeasonId(newSeasonId);
      const season = seasons.find((s) => s.id === newSeasonId);
      setSelectedLeagueSeasonId(season?.leagueSeasonId || '');
      setSelectedFlightId('all');
    },
    [seasons],
  );

  const handleFlightChange = useCallback((newFlightId: string) => {
    setSelectedFlightId(newFlightId);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setFormMode('create');
    setEditingTeam(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((team: GolfTeamType) => {
    setEditingTeam(team);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const handleView = useCallback(
    (team: GolfTeamType) => {
      router.push(`/account/${accountId}/golf/teams/${team.id}?seasonId=${selectedSeasonId}`);
    },
    [accountId, router, selectedSeasonId],
  );

  const handleDelete = useCallback(
    async (team: GolfTeamType) => {
      const result = await deleteTeam(team.id);

      if (result.success) {
        setSuccessMessage('Team deleted successfully');
        await loadTeams();
      } else {
        setError(result.error);
      }
    },
    [deleteTeam, loadTeams],
  );

  const handleAssignToFlight = useCallback(
    async (team: GolfTeamType, flightId: string) => {
      const result = await assignToFlight(team.id, flightId);

      if (result.success) {
        setSuccessMessage('Team assigned to flight');
        await loadTeams();
      } else {
        setError(result.error);
      }
    },
    [assignToFlight, loadTeams],
  );

  const handleRemoveFromFlight = useCallback(
    async (team: GolfTeamType) => {
      const result = await removeFromFlight(team.id);

      if (result.success) {
        setSuccessMessage('Team removed from flight');
        await loadTeams();
      } else {
        setError(result.error);
      }
    },
    [removeFromFlight, loadTeams],
  );

  const handleFormSubmit = useCallback(
    async (data: CreateGolfTeamType) => {
      if (!selectedSeasonId || !selectedLeagueSeasonId) {
        throw new Error('No season selected');
      }

      setFormLoading(true);
      try {
        if (formMode === 'create') {
          const result = await createTeam(selectedSeasonId, selectedLeagueSeasonId, data);

          if (result.success) {
            setSuccessMessage('Team created successfully');
            setFormOpen(false);
            await loadTeams();
          } else {
            throw new Error(result.error);
          }
        } else if (editingTeam) {
          const result = await updateTeam(editingTeam.id, data);

          if (result.success) {
            setSuccessMessage('Team updated successfully');
            setFormOpen(false);
            await loadTeams();
          } else {
            throw new Error(result.error);
          }
        }
      } finally {
        setFormLoading(false);
      }
    },
    [
      formMode,
      editingTeam,
      selectedSeasonId,
      selectedLeagueSeasonId,
      createTeam,
      updateTeam,
      loadTeams,
    ],
  );

  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    setEditingTeam(null);
  }, []);

  if (!accountId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Account information could not be determined.</Alert>
      </Container>
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
            Golf Teams
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
            Manage teams and rosters for your golf league.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="season-select-label">Season</InputLabel>
            <Select
              labelId="season-select-label"
              value={selectedSeasonId}
              label="Season"
              onChange={(e) => handleSeasonChange(e.target.value)}
              disabled={loading || seasons.length === 0}
            >
              {seasons.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.name}
                  {season.isCurrent ? ' (Current)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="flight-select-label">Flight</InputLabel>
            <Select
              labelId="flight-select-label"
              value={selectedFlightId}
              label="Flight"
              onChange={(e) => handleFlightChange(e.target.value)}
              disabled={loading || flights.length === 0}
            >
              <MenuItem value="all">All Flights</MenuItem>
              {flights.map((flight) => (
                <MenuItem key={flight.id} value={flight.id}>
                  {flight.name} ({flight.teamCount} teams)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <GolfTeamList
            teams={teams}
            flights={flights}
            loading={formLoading}
            error={error}
            onRetry={loadTeams}
            onView={handleView}
            onEdit={canManage ? handleEdit : undefined}
            onDelete={canManage ? handleDelete : undefined}
            onAssignToFlight={canManage ? handleAssignToFlight : undefined}
            onRemoveFromFlight={canManage ? handleRemoveFromFlight : undefined}
            emptyMessage="No teams have been created for this season yet."
            actionsDisabled={formLoading}
            showFlightInfo
            showPlayerCount
          />
        )}
      </Container>

      {canManage && selectedLeagueSeasonId && (
        <Fab
          color="primary"
          aria-label="Add team"
          onClick={handleOpenCreate}
          disabled={formLoading || !selectedSeasonId}
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

      <Dialog
        open={formOpen}
        onClose={handleFormCancel}
        maxWidth="sm"
        fullWidth
        aria-labelledby="team-form-dialog-title"
      >
        <DialogTitle id="team-form-dialog-title" sx={{ pr: 6 }}>
          {formMode === 'create' ? 'Create New Team' : 'Edit Team'}
          <IconButton
            aria-label="close"
            onClick={handleFormCancel}
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
          <GolfTeamForm
            team={editingTeam || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            disabled={formLoading}
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

export default GolfTeamsPage;
