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
  FormControl,
  IconButton,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfTeamType,
  GolfFlightWithTeamCountType,
  CreateGolfTeamType,
  SeasonType,
} from '@draco/shared-schemas';
import { getAccountSeason } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import GolfTeamList from '../../../../../../../components/golf/teams/GolfTeamList';
import GolfTeamForm from '../../../../../../../components/golf/teams/GolfTeamForm';
import { useGolfTeams } from '../../../../../../../hooks/useGolfTeams';
import { useGolfFlights } from '../../../../../../../hooks/useGolfFlights';
import { useGolfLeagueSetup } from '../../../../../../../hooks/useGolfLeagueSetup';
import { useRole } from '../../../../../../../context/RoleContext';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';

const GolfTeamsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
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

  const [season, setSeason] = useState<SeasonType | null>(null);
  const [leagueSeasonId, setLeagueSeasonId] = useState<string>('');

  const { setup: leagueSetup } = useGolfLeagueSetup(accountId, seasonId, leagueSeasonId);

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

  const seasonName = season?.name ?? 'Season';

  const handleBack = useCallback(() => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/flights`);
  }, [accountId, seasonId, router]);

  const loadSeason = useCallback(async () => {
    if (!accountId || !seasonId) return;

    try {
      const result = await getAccountSeason({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const seasonData = unwrapApiResult(result, 'Failed to load season');
      setSeason(seasonData);

      if (seasonData.leagues && seasonData.leagues.length > 0) {
        setLeagueSeasonId(seasonData.leagues[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load season');
    }
  }, [accountId, seasonId, apiClient]);

  const loadFlights = useCallback(async () => {
    if (!seasonId) return;

    try {
      const result = await listFlights(seasonId);
      if (result.success) {
        setFlights(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flights');
    }
  }, [seasonId, listFlights]);

  const loadTeams = useCallback(async () => {
    if (!seasonId) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (selectedFlightId && selectedFlightId !== 'all') {
        result = await listTeamsForFlight(selectedFlightId);
      } else {
        result = await listTeams(seasonId);
      }

      if (result.success) {
        setTeams(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [seasonId, selectedFlightId, listTeams, listTeamsForFlight]);

  useEffect(() => {
    if (accountId && seasonId) {
      loadSeason();
    }
  }, [accountId, seasonId, loadSeason]);

  useEffect(() => {
    if (seasonId) {
      loadFlights();
      loadTeams();
    }
  }, [seasonId, loadFlights, loadTeams]);

  useEffect(() => {
    if (seasonId) {
      loadTeams();
    }
  }, [selectedFlightId, loadTeams, seasonId]);

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
      router.push(`/account/${accountId}/seasons/${seasonId}/golf/teams/${team.id}`);
    },
    [accountId, seasonId, router],
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
      if (!seasonId || !leagueSeasonId) {
        throw new Error('No season selected');
      }

      setFormLoading(true);
      try {
        if (formMode === 'create') {
          const result = await createTeam(seasonId, leagueSeasonId, data);

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
    [formMode, editingTeam, seasonId, leagueSeasonId, createTeam, updateTeam, loadTeams],
  );

  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    setEditingTeam(null);
  }, []);

  if (!accountId || !seasonId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Account or season information could not be determined.</Alert>
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
            Manage teams and rosters for {seasonName}.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} size="small">
            Back to Flights
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
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

      {canManage && leagueSeasonId && (
        <Fab
          color="primary"
          aria-label="Add team"
          onClick={handleOpenCreate}
          disabled={formLoading || !seasonId}
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
