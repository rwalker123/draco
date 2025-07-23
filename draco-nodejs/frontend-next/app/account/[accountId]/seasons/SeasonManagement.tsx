'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Fab,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  Remove as RemoveIcon,
  Sports as SportsIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import axios from 'axios';

interface Season {
  id: string;
  name: string;
  accountId: string;
  isCurrent: boolean;
  leagues: Array<{
    id: string;
    leagueId: string;
    leagueName: string;
  }>;
}

interface League {
  id: string;
  name: string;
  accountId: string;
}

interface SeasonFormData {
  name: string;
}

const SeasonManagement: React.FC = () => {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const router = useRouter();
  const { token } = useAuth();
  const { hasRole, hasPermission } = useRole();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [leagueManagementDialogOpen, setLeagueManagementDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<SeasonFormData>({ name: '' });
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Dialog-specific message states
  const [dialogSuccessMessage, setDialogSuccessMessage] = useState<string | null>(null);
  const [dialogErrorMessage, setDialogErrorMessage] = useState<string | null>(null);

  // Check permissions
  const canCreate =
    hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canEdit =
    hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canDelete =
    hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canSetCurrent =
    hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canManageLeagues =
    hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');

  const fetchSeasons = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/accounts/${accountId}/seasons`);

      if (response.data.success) {
        setSeasons(response.data.data.seasons);
      } else {
        setError(response.data.message || 'Failed to fetch seasons');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load season data');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const fetchAvailableLeagues = useCallback(async () => {
    if (!accountId || !token) return;

    try {
      const response = await axios.get(`/api/accounts/${accountId}/leagues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAvailableLeagues(response.data.data.leagues);
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch available leagues');
      }
    }
  }, [accountId, token]);

  useEffect(() => {
    if (accountId) {
      fetchSeasons();
      fetchAvailableLeagues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Targeted update functions for better UX
  const addSeasonToState = useCallback((newSeason: Season) => {
    setSeasons((prev) => [...prev, newSeason]);
  }, []);

  const updateSeasonInState = useCallback((updatedSeason: Season) => {
    setSeasons((prev) =>
      prev.map((season) => (season.id === updatedSeason.id ? updatedSeason : season)),
    );
  }, []);

  const removeSeasonFromState = useCallback((seasonId: string) => {
    setSeasons((prev) => prev.filter((season) => season.id !== seasonId));
  }, []);

  const updateCurrentSeasonInState = useCallback((currentSeasonId: string) => {
    setSeasons((prev) =>
      prev.map((season) => ({
        ...season,
        isCurrent: season.id === currentSeasonId,
      })),
    );
  }, []);

  const addLeagueToSeasonInState = useCallback(
    (seasonId: string, leagueSeason: { id: string; leagueId: string; leagueName: string }) => {
      setSeasons((prev) =>
        prev.map((season) => {
          if (season.id !== seasonId) return season;
          return {
            ...season,
            leagues: [...season.leagues, leagueSeason],
          };
        }),
      );
    },
    [],
  );

  const removeLeagueFromSeasonInState = useCallback((seasonId: string, leagueSeasonId: string) => {
    setSeasons((prev) =>
      prev.map((season) => {
        if (season.id !== seasonId) return season;
        return {
          ...season,
          leagues: season.leagues.filter((league) => league.id !== leagueSeasonId),
        };
      }),
    );
  }, []);

  const addLeagueToAvailableLeagues = useCallback((newLeague: League) => {
    setAvailableLeagues((prev) => [...prev, newLeague]);
  }, []);

  const updateLeagueInAvailableLeagues = useCallback((updatedLeague: League) => {
    setAvailableLeagues((prev) =>
      prev.map((league) => (league.id === updatedLeague.id ? updatedLeague : league)),
    );
  }, []);

  const handleCreateSeason = async () => {
    if (!accountId || !token || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons`,
        { name: formData.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Season created successfully');
        setCreateDialogOpen(false);
        setFormData({ name: '' });
        addSeasonToState(response.data.data.season);
      } else {
        setError(response.data.message || 'Failed to create season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSeason = async () => {
    if (!accountId || !token || !selectedSeason || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/seasons/${selectedSeason.id}`,
        { name: formData.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Season updated successfully');
        setEditDialogOpen(false);
        setFormData({ name: '' });
        setSelectedSeason(null);
        updateSeasonInState(response.data.data.season);
      } else {
        setError(response.data.message || 'Failed to update season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSeason = async () => {
    if (!accountId || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `/api/accounts/${accountId}/seasons/${selectedSeason.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Season deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedSeason(null);
        removeSeasonFromState(selectedSeason.id);
      } else {
        setError(response.data.message || 'Failed to delete season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopySeason = async () => {
    if (!accountId || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons/${selectedSeason.id}/copy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(
          `Season copied successfully. ${response.data.data.copiedLeagues} leagues copied.`,
        );
        setCopyDialogOpen(false);
        setSelectedSeason(null);
        addSeasonToState(response.data.data.season);
      } else {
        setError(response.data.message || 'Failed to copy season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to copy season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetCurrentSeason = async (season: Season) => {
    if (!accountId || !token) return;

    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons/${season.id}/set-current`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(`"${season.name}" is now the current season`);
        updateCurrentSeasonInState(season.id);
      } else {
        setError(response.data.message || 'Failed to set current season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to set current season');
      }
    }
  };

  const openCreateDialog = () => {
    setFormData({ name: '' });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (season: Season) => {
    setSelectedSeason(season);
    setFormData({ name: season.name });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (season: Season) => {
    setSelectedSeason(season);
    setDeleteDialogOpen(true);
  };

  const openCopyDialog = (season: Season) => {
    setSelectedSeason(season);
    setCopyDialogOpen(true);
  };

  const openLeagueManagementDialog = (season: Season) => {
    setSelectedSeason(season);
    setSelectedLeague(null);
    setDialogSuccessMessage(null);
    setDialogErrorMessage(null);
    setLeagueManagementDialogOpen(true);
  };

  const navigateToLeagueSeasonManagement = (season: Season) => {
    router.push(`/account/${accountId}/seasons/${season.id}/league-seasons`);
  };

  const handleAddLeagueToSeason = async () => {
    if (!accountId || !token || !selectedSeason || !selectedLeague) return;

    setFormLoading(true);
    setDialogSuccessMessage(null);
    setDialogErrorMessage(null);
    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons/${selectedSeason.id}/leagues`,
        { leagueId: selectedLeague.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setDialogSuccessMessage(
          `League "${selectedLeague.name}" added to season "${selectedSeason.name}"`,
        );
        addLeagueToSeasonInState(selectedSeason.id, response.data.data.leagueSeason);
        // Update selectedSeason for dialog
        setSelectedSeason((prev) =>
          prev
            ? {
                ...prev,
                leagues: [...prev.leagues, response.data.data.leagueSeason],
              }
            : prev,
        );
        setSelectedLeague(null);
      } else {
        setDialogErrorMessage(response.data.message || 'Failed to add league to season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setDialogErrorMessage(
          (err as { response: { data: { message: string } } }).response.data.message,
        );
      } else if (err instanceof Error) {
        setDialogErrorMessage(err.message);
      } else {
        setDialogErrorMessage('Failed to add league to season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveLeagueFromSeason = async (leagueSeasonId: string, leagueName: string) => {
    if (!accountId || !token || !selectedSeason) return;

    setFormLoading(true);
    setDialogSuccessMessage(null);
    setDialogErrorMessage(null);
    try {
      const response = await axios.delete(
        `/api/accounts/${accountId}/seasons/${selectedSeason.id}/leagues/${leagueSeasonId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setDialogSuccessMessage(
          `League "${leagueName}" removed from season "${selectedSeason.name}"`,
        );
        removeLeagueFromSeasonInState(selectedSeason.id, leagueSeasonId);
        // Update selectedSeason for dialog
        setSelectedSeason((prev) =>
          prev
            ? {
                ...prev,
                leagues: prev.leagues.filter((league) => league.id !== leagueSeasonId),
              }
            : prev,
        );
      } else {
        setDialogErrorMessage(response.data.message || 'Failed to remove league from season');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setDialogErrorMessage(
          (err as { response: { data: { message: string } } }).response.data.message,
        );
      } else if (err instanceof Error) {
        setDialogErrorMessage(err.message);
      } else {
        setDialogErrorMessage('Failed to remove league from season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const closeLeagueManagementDialog = () => {
    setLeagueManagementDialogOpen(false);
    setSelectedSeason(null);
    setSelectedLeague(null);
    setDialogSuccessMessage(null);
    setDialogErrorMessage(null);
  };

  // Get leagues that are not already in the selected season
  const getAvailableLeaguesForSeason = () => {
    if (!selectedSeason) return availableLeagues;

    const seasonLeagueIds = selectedSeason.leagues.map((ls) => ls.leagueId);
    return availableLeagues.filter((league) => !seasonLeagueIds.includes(league.id));
  };

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setCopyDialogOpen(false);
    setFormData({ name: '' });
    setSelectedSeason(null);
  };

  // Add state for edit dialog
  const [editLeagueDialogOpen, setEditLeagueDialogOpen] = useState(false);
  const [leagueToEdit, setLeagueToEdit] = useState<League | null>(null);
  const [editLeagueName, setEditLeagueName] = useState('');

  // Add state for create league dialog
  const [createLeagueDialogOpen, setCreateLeagueDialogOpen] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [addToSeasonAfterCreate, setAddToSeasonAfterCreate] = useState(true);

  // Handler to open edit dialog
  const openEditLeagueDialog = (league: League) => {
    setLeagueToEdit(league);
    setEditLeagueName(league.name);
    setError(null);
    setEditLeagueDialogOpen(true);
  };

  // Handler to open create league dialog
  const openCreateLeagueDialog = () => {
    setNewLeagueName('');
    setAddToSeasonAfterCreate(true);
    setError(null);
    setCreateLeagueDialogOpen(true);
  };

  // Handler to save league name
  const handleEditLeague = async () => {
    if (!accountId || !token || !leagueToEdit || !editLeagueName.trim()) return;
    setFormLoading(true);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/leagues/${leagueToEdit.id}`,
        { name: editLeagueName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setDialogSuccessMessage('League updated successfully');
        setEditLeagueDialogOpen(false);
        setLeagueToEdit(null);
        updateLeagueInAvailableLeagues(response.data.data.league);
      } else {
        setDialogErrorMessage(response.data.message || 'Failed to update league');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setDialogErrorMessage(
          (err as { response: { data: { message: string } } }).response.data.message,
        );
      } else if (err instanceof Error) {
        setDialogErrorMessage(err.message);
      } else {
        setDialogErrorMessage('Failed to update league');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create new league
  const handleCreateLeague = async () => {
    if (!accountId || !token || !newLeagueName.trim()) return;
    setFormLoading(true);
    try {
      // Create the league
      const createResponse = await axios.post(
        `/api/accounts/${accountId}/leagues`,
        { name: newLeagueName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (createResponse.data.success) {
        const newLeague = createResponse.data.data.league;

        // If checkbox is checked, add the league to the season
        if (addToSeasonAfterCreate && selectedSeason) {
          const addResponse = await axios.post(
            `/api/accounts/${accountId}/seasons/${selectedSeason.id}/leagues`,
            { leagueId: newLeague.id },
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (addResponse.data.success) {
            setDialogSuccessMessage(
              `League "${newLeague.name}" created and added to season "${selectedSeason.name}"`,
            );

            // Use targeted update instead of full refresh
            addLeagueToSeasonInState(selectedSeason.id, addResponse.data.data.leagueSeason);

            // Also update selectedSeason for the dialog
            setSelectedSeason((prev) =>
              prev
                ? {
                    ...prev,
                    leagues: [...prev.leagues, addResponse.data.data.leagueSeason],
                  }
                : prev,
            );
          } else {
            setDialogSuccessMessage(
              `League "${newLeague.name}" created successfully, but failed to add to season`,
            );
          }
        } else {
          setDialogSuccessMessage(`League "${newLeague.name}" created successfully`);
        }

        setCreateLeagueDialogOpen(false);
        setNewLeagueName('');
        // Use targeted update instead of full refresh
        addLeagueToAvailableLeagues(newLeague);
      } else {
        setDialogErrorMessage(createResponse.data.message || 'Failed to create league');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
      ) {
        setDialogErrorMessage(
          (err as { response: { data: { message: string } } }).response.data.message,
        );
      } else if (err instanceof Error) {
        setDialogErrorMessage(err.message);
      } else {
        setDialogErrorMessage('Failed to create league');
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (!accountId) {
    return (
      <Box p={3}>
        <Alert severity="error">Account ID is required</Alert>
      </Box>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Season Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSeasons}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
              Create Season
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        /* Seasons List */
        <Box>
          {seasons.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" align="center">
                  No seasons found
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  {canCreate
                    ? 'Create your first season to get started.'
                    : 'No seasons are available.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={3}
            >
              {seasons.map((season) => (
                <Card key={season.id}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Typography variant="h6" component="h2">
                        {season.name}
                      </Typography>
                      {season.isCurrent && (
                        <Chip icon={<StarIcon />} label="Current" color="primary" size="small" />
                      )}
                    </Box>

                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {season.leagues.length} league{season.leagues.length !== 1 ? 's' : ''}
                    </Typography>

                    {season.leagues.length > 0 && (
                      <Box mb={2}>
                        <Typography variant="caption" color="textSecondary">
                          Leagues:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {season.leagues.slice(0, 3).map((league) => (
                            <Chip
                              key={league.id}
                              label={league.leagueName}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {season.leagues.length > 3 && (
                            <Chip
                              label={`+${season.leagues.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    <Box display="flex" gap={1} flexWrap="wrap">
                      {canSetCurrent && !season.isCurrent && (
                        <Tooltip title="Set as current season">
                          <IconButton size="small" onClick={() => handleSetCurrentSeason(season)}>
                            <StarBorderIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canManageLeagues && (
                        <Tooltip title="Manage leagues">
                          <IconButton
                            size="small"
                            onClick={() => openLeagueManagementDialog(season)}
                          >
                            <GroupIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canManageLeagues && (
                        <Tooltip title="League Season Management">
                          <IconButton
                            size="small"
                            onClick={() => navigateToLeagueSeasonManagement(season)}
                          >
                            <SportsIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canEdit && (
                        <Tooltip title="Edit season">
                          <IconButton size="small" onClick={() => openEditDialog(season)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canEdit && (
                        <Tooltip title="Copy season">
                          <IconButton size="small" onClick={() => openCopyDialog(season)}>
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canDelete && !season.isCurrent && (
                        <Tooltip title="Delete season">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(season)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* League Management Dialog */}
      <Dialog
        open={leagueManagementDialogOpen}
        onClose={closeLeagueManagementDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Leagues - {selectedSeason?.name}</DialogTitle>
        <DialogContent>
          {/* Dialog-specific messages */}
          {dialogSuccessMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setDialogSuccessMessage(null)}>
              {dialogSuccessMessage}
            </Alert>
          )}
          {dialogErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogErrorMessage(null)}>
              {dialogErrorMessage}
            </Alert>
          )}

          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom>
                Add League to Season
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={openCreateLeagueDialog}
                startIcon={<AddIcon />}
                disabled={formLoading}
              >
                Create New League
              </Button>
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <Autocomplete
                options={getAvailableLeaguesForSeason()}
                getOptionLabel={(option) => option.name}
                value={selectedLeague}
                onChange={(_, newValue) => setSelectedLeague(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select League"
                    variant="outlined"
                    fullWidth
                    disabled={formLoading}
                  />
                )}
                disabled={formLoading}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Button
                variant="contained"
                onClick={handleAddLeagueToSeason}
                disabled={!selectedLeague || formLoading}
                startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ flexShrink: 0 }}
              >
                Add
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="h6" gutterBottom>
              Current Leagues ({selectedSeason?.leagues.length || 0})
            </Typography>
            {selectedSeason?.leagues.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No leagues are currently assigned to this season.
              </Typography>
            ) : (
              <List>
                {selectedSeason?.leagues.map((league, index) => (
                  <React.Fragment key={league.id}>
                    <ListItem>
                      <ListItemText
                        primary={league.leagueName}
                        secondary={`League ID: ${league.leagueId}`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit league">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              openEditLeagueDialog({
                                id: league.leagueId,
                                name: league.leagueName,
                                accountId: accountIdStr || '',
                              })
                            }
                            disabled={formLoading}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from season">
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() =>
                              handleRemoveLeagueFromSeason(league.id, league.leagueName)
                            }
                            disabled={formLoading}
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < selectedSeason.leagues.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLeagueManagementDialog} disabled={formLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Season Dialog */}
      <Dialog open={createDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Season</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Season Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSeason}
            variant="contained"
            disabled={!formData.name.trim() || formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Season Dialog */}
      <Dialog open={editDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Season</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Season Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSeason}
            variant="contained"
            disabled={!formData.name.trim() || formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Season Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Season</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the season &quot;{selectedSeason?.name}&quot;?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All data associated with this season will be permanently
            deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSeason}
            variant="contained"
            color="error"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Season Dialog */}
      <Dialog open={copyDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Season</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to copy the season &quot;{selectedSeason?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will create a new season with the name &quot;{selectedSeason?.name} Copy&quot; and
            copy all associated leagues.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button onClick={handleCopySeason} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : 'Copy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit League Dialog */}
      <Dialog
        open={editLeagueDialogOpen}
        onClose={() => {
          setEditLeagueDialogOpen(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit League</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="League Name"
            fullWidth
            variant="outlined"
            value={editLeagueName}
            onChange={(e) => setEditLeagueName(e.target.value)}
            disabled={formLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditLeagueDialogOpen(false);
              setError(null);
            }}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditLeague}
            variant="contained"
            disabled={!editLeagueName.trim() || formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create League Dialog */}
      <Dialog
        open={createLeagueDialogOpen}
        onClose={() => {
          setCreateLeagueDialogOpen(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New League</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="League Name"
            fullWidth
            variant="outlined"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            disabled={formLoading}
            sx={{ mt: 1, mb: 2 }}
          />
          {selectedSeason && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={addToSeasonAfterCreate}
                  onChange={(e) => setAddToSeasonAfterCreate(e.target.checked)}
                  disabled={formLoading}
                />
              }
              label={`Add to season "${selectedSeason.name}" after creation`}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateLeagueDialogOpen(false);
              setError(null);
            }}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateLeague}
            variant="contained"
            disabled={!newLeagueName.trim() || formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Create */}
      {canCreate && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={openCreateDialog}
        >
          <AddIcon />
        </Fab>
      )}
    </main>
  );
};

export default SeasonManagement;
