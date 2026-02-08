'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Fab,
  Snackbar,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../components/admin';
import {
  listAccountSeasons,
  createAccountSeason,
  updateAccountSeason,
  deleteAccountSeason,
  copyAccountSeason,
  setCurrentAccountSeason,
} from '@draco/shared-api-client';
import { UpsertSeasonType, SeasonType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import {
  mapSeasonWithDivisions,
  mapSeasonsWithDivisions,
  mapSeasonUpdate,
  SeasonSummary,
} from '../../../../utils/seasonMapper';

type Season = SeasonSummary;

interface SeasonFormData {
  name: string;
}

const GolfSeasonManagement: React.FC = () => {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const router = useRouter();
  const { token } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const [formData, setFormData] = useState<SeasonFormData>({ name: '' });
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const hasSeasonManagementPermissions = isAccountAdministrator(hasRole, accountIdStr);
  const canCreate = hasSeasonManagementPermissions;
  const canEdit = hasSeasonManagementPermissions;
  const canDelete = hasSeasonManagementPermissions;
  const canSetCurrent = hasSeasonManagementPermissions;
  const canManageFlights = hasSeasonManagementPermissions;

  const handleFeedbackClose = useCallback(() => {
    setFeedback(null);
  }, []);

  const fetchSeasons = useCallback(async () => {
    if (!accountIdStr) return;

    setLoading(true);
    try {
      const result = await listAccountSeasons({
        client: apiClient,
        path: { accountId: accountIdStr },
        throwOnError: false,
      });

      const seasonsData = unwrapApiResult(result, 'Failed to fetch seasons');
      const mappedSeasons = mapSeasonsWithDivisions(seasonsData);
      setSeasons(mappedSeasons);
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to load season data',
      });
    } finally {
      setLoading(false);
    }
  }, [accountIdStr, apiClient]);

  useEffect(() => {
    if (accountIdStr) {
      fetchSeasons();
    }
  }, [accountIdStr, fetchSeasons]);

  const addSeasonToState = useCallback((newSeason: Season) => {
    setSeasons((prev) => [...prev, newSeason]);
  }, []);

  const updateSeasonInState = useCallback((seasonUpdate: Partial<Season> & { id: string }) => {
    setSeasons((prev) =>
      prev.map((season) =>
        season.id === seasonUpdate.id
          ? {
              ...season,
              ...seasonUpdate,
            }
          : season,
      ),
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

  const handleCreateSeason = async () => {
    if (!accountIdStr || !token || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const payload: UpsertSeasonType = { name: formData.name.trim() };
      const result = await createAccountSeason({
        client: apiClient,
        path: { accountId: accountIdStr },
        body: payload,
        throwOnError: false,
      });

      const createdSeason = unwrapApiResult(result, 'Failed to create season');
      const mappedSeason = mapSeasonWithDivisions(createdSeason);

      setFeedback({ severity: 'success', message: 'Season created successfully' });
      setCreateDialogOpen(false);
      setFormData({ name: '' });
      addSeasonToState(mappedSeason);
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to create season',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSeason = async () => {
    if (!accountIdStr || !token || !selectedSeason || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const payload: UpsertSeasonType = { name: formData.name.trim() };
      const result = await updateAccountSeason({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: selectedSeason.id },
        body: payload,
        throwOnError: false,
      });

      const updatedSeason = unwrapApiResult(result, 'Failed to update season') as SeasonType;

      setFeedback({ severity: 'success', message: 'Season updated successfully' });
      setEditDialogOpen(false);
      setFormData({ name: '' });
      setSelectedSeason(null);
      updateSeasonInState(mapSeasonUpdate(updatedSeason));
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to update season',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSeason = async () => {
    if (!accountIdStr || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const result = await deleteAccountSeason({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: selectedSeason.id },
        throwOnError: false,
      });

      const deleted = unwrapApiResult(result, 'Failed to delete season');

      if (deleted) {
        setFeedback({ severity: 'success', message: 'Season deleted successfully' });
        setDeleteDialogOpen(false);
        removeSeasonFromState(selectedSeason.id);
        setSelectedSeason(null);
      } else {
        setFeedback({ severity: 'error', message: 'Failed to delete season' });
      }
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete season',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopySeason = async () => {
    if (!accountIdStr || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const result = await copyAccountSeason({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: selectedSeason.id },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to copy season');

      setFeedback({
        severity: 'success',
        message: 'Season copied successfully. All flights and teams were duplicated.',
      });
      setCopyDialogOpen(false);
      setSelectedSeason(null);
      await fetchSeasons();
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to copy season',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetCurrentSeason = async (season: Season) => {
    if (!accountIdStr || !token) return;

    try {
      const result = await setCurrentAccountSeason({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: season.id },
        throwOnError: false,
      });

      const updatedSeason = unwrapApiResult(result, 'Failed to set current season') as SeasonType;

      setFeedback({
        severity: 'success',
        message: `"${season.name}" is now the current season`,
      });
      updateSeasonInState(mapSeasonUpdate(updatedSeason));
      updateCurrentSeasonInState(season.id);
    } catch (err: unknown) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to set current season',
      });
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

  const navigateToFlightManagement = (season: Season) => {
    router.push(`/account/${accountId}/seasons/${season.id}/golf/admin`);
  };

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setCopyDialogOpen(false);
    setFormData({ name: '' });
    setSelectedSeason(null);
    setDeleteConfirmation('');
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
      <AccountPageHeader accountId={accountIdStr || ''}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Season Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage seasons and flight configurations for your golf league.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountIdStr || ''}
          category={{ name: 'Season', href: `/account/${accountIdStr}/admin/season` }}
          currentPage="Season Management"
        />
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
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
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="h6" component="h2">
                            {season.name}
                          </Typography>
                          {canEdit && (
                            <Tooltip title="Edit season">
                              <IconButton size="small" onClick={() => openEditDialog(season)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canEdit && (
                            <Tooltip title="Copy season">
                              <IconButton
                                size="small"
                                aria-label={`Copy ${season.name}`}
                                onClick={() => openCopyDialog(season)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        {season.isCurrent ? (
                          <Chip icon={<StarIcon />} label="Current" color="primary" size="small" />
                        ) : (
                          canSetCurrent && (
                            <Tooltip title="Set as current season">
                              <IconButton
                                size="small"
                                onClick={() => handleSetCurrentSeason(season)}
                              >
                                <StarBorderIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        )}
                      </Box>

                      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                        {canManageFlights && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FlightIcon />}
                            onClick={() => navigateToFlightManagement(season)}
                          >
                            Manage Flights
                          </Button>
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
      </Container>

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
          <TextField
            margin="dense"
            label="Type the season name to confirm"
            placeholder={selectedSeason?.name}
            fullWidth
            variant="outlined"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            disabled={formLoading}
            sx={{ mt: 2 }}
            helperText={`Enter "${selectedSeason?.name}" to enable deletion`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSeason}
            variant="contained"
            color="error"
            disabled={formLoading || deleteConfirmation !== selectedSeason?.name}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={copyDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Season</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to copy the season &quot;{selectedSeason?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will create a new season with the name &quot;{selectedSeason?.name} Copy&quot; and
            copy all associated flights and teams.
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

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert
            onClose={handleFeedbackClose}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default GolfSeasonManagement;
