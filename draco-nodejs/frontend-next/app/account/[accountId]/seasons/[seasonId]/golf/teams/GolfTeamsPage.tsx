'use client';

import React, { useEffect, useState } from 'react';
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
import {
  getAccountSeason,
  listGolfFlights,
  listGolfTeams,
  listGolfTeamsForFlight,
} from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import GolfTeamList from '../../../../../../../components/golf/teams/GolfTeamList';
import GolfTeamForm from '../../../../../../../components/golf/teams/GolfTeamForm';
import { useGolfTeams } from '../../../../../../../hooks/useGolfTeams';
import { useGolfLeagueSetup } from '../../../../../../../hooks/useGolfLeagueSetup';
import { useRole } from '../../../../../../../context/RoleContext';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';
import NotificationSnackbar from '../../../../../../../components/common/NotificationSnackbar';
import { useNotifications } from '../../../../../../../hooks/useNotifications';

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

  const { createTeam, updateTeam, deleteTeam } = useGolfTeams(accountId || '');

  const [season, setSeason] = useState<SeasonType | null>(null);
  const [flights, setFlights] = useState<GolfFlightWithTeamCountType[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>('all');
  const [teams, setTeams] = useState<GolfTeamType[]>([]);

  const { setup: leagueSetup } = useGolfLeagueSetup(
    accountId,
    seasonId,
    selectedFlightId !== 'all' ? selectedFlightId : undefined,
  );

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
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTeam, setEditingTeam] = useState<GolfTeamType | null>(null);
  const { notification, showNotification, hideNotification } = useNotifications();
  const [formLoading, setFormLoading] = useState(false);

  const seasonName = season?.name ?? 'Season';

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
        setSeason(seasonData);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load season');
      }
    };

    void loadSeason();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, apiClient]);

  useEffect(() => {
    if (!accountId || !seasonId) return;

    const controller = new AbortController();

    const loadFlightsAndTeams = async () => {
      setLoading(true);
      setError(null);

      try {
        const flightsResult = await listGolfFlights({
          client: apiClient,
          path: { accountId, seasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const flightsData = unwrapApiResult(flightsResult, 'Failed to load flights');
        setFlights(flightsData as GolfFlightWithTeamCountType[]);

        let teamsResult;
        if (selectedFlightId && selectedFlightId !== 'all') {
          teamsResult = await listGolfTeamsForFlight({
            client: apiClient,
            path: { accountId, flightId: selectedFlightId },
            signal: controller.signal,
            throwOnError: false,
          });
        } else {
          teamsResult = await listGolfTeams({
            client: apiClient,
            path: { accountId, seasonId },
            signal: controller.signal,
            throwOnError: false,
          });
        }

        if (controller.signal.aborted) return;
        const teamsData = unwrapApiResult(teamsResult, 'Failed to load teams');
        setTeams(teamsData as GolfTeamType[]);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadFlightsAndTeams();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, selectedFlightId, apiClient]);

  const reloadTeams = async () => {
    if (!accountId || !seasonId) return;

    setLoading(true);
    setError(null);

    try {
      let teamsResult;
      if (selectedFlightId && selectedFlightId !== 'all') {
        teamsResult = await listGolfTeamsForFlight({
          client: apiClient,
          path: { accountId, flightId: selectedFlightId },
          throwOnError: false,
        });
      } else {
        teamsResult = await listGolfTeams({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });
      }

      const teamsData = unwrapApiResult(teamsResult, 'Failed to load teams');
      setTeams(teamsData as GolfTeamType[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/flights`);
  };

  const handleFlightChange = (newFlightId: string) => {
    setSelectedFlightId(newFlightId);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingTeam(null);
    setFormOpen(true);
  };

  const handleEdit = (team: GolfTeamType) => {
    setEditingTeam(team);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleView = (team: GolfTeamType) => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/teams/${team.id}`);
  };

  const handleDelete = async (team: GolfTeamType) => {
    if (!seasonId) return;

    const result = await deleteTeam(seasonId, team.id);

    if (result.success) {
      showNotification('Team deleted successfully', 'success');
      await reloadTeams();
    } else {
      setError(result.error);
    }
  };

  const handleFormSubmit = async (data: CreateGolfTeamType) => {
    if (!selectedFlightId || selectedFlightId === 'all') {
      throw new Error('Please select a flight to create the team in');
    }
    if (!seasonId) {
      throw new Error('Season ID is required');
    }

    setFormLoading(true);
    try {
      if (formMode === 'create') {
        const result = await createTeam(selectedFlightId, data);

        if (result.success) {
          showNotification('Team created successfully', 'success');
          setFormOpen(false);
          await reloadTeams();
        } else {
          throw new Error(result.error);
        }
      } else if (editingTeam) {
        const result = await updateTeam(seasonId, editingTeam.id, data);

        if (result.success) {
          showNotification('Team updated successfully', 'success');
          setFormOpen(false);
          await reloadTeams();
        } else {
          throw new Error(result.error);
        }
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditingTeam(null);
  };

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

        {leagueSetup && selectedFlightId !== 'all' && (
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
              href={`/account/${accountId}/seasons/${seasonId}/golf/leagues/${selectedFlightId}/setup`}
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
            onRetry={reloadTeams}
            onView={handleView}
            onEdit={canManage ? handleEdit : undefined}
            onDelete={canManage ? handleDelete : undefined}
            emptyMessage="No teams have been created for this season yet."
            actionsDisabled={formLoading}
            showFlightInfo
            showPlayerCount
          />
        )}
      </Container>

      {canManage && selectedFlightId && selectedFlightId !== 'all' && (
        <Fab
          color="primary"
          aria-label="Add team"
          onClick={handleOpenCreate}
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

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </main>
  );
};

export default GolfTeamsPage;
