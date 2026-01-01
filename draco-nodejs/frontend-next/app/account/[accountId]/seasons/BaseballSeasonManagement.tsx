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
  Alert,
  CircularProgress,
  Fab,
  Snackbar,
  Menu,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import SeasonCard from './SeasonCard';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import {
  listAccountSeasons,
  createAccountSeason,
  updateAccountSeason,
  deleteAccountSeason,
  copyAccountSeason,
  setCurrentAccountSeason,
  exportSeasonRoster,
  exportSeasonManagers,
} from '@draco/shared-api-client';
import { UpsertSeasonType, SeasonType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { downloadBlob } from '../../../../utils/downloadUtils';
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

const BaseballSeasonManagement: React.FC = () => {
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

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<SeasonFormData>({ name: '' });
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSeasonForExport, setSelectedSeasonForExport] = useState<Season | null>(null);

  // Check permissions - all season management actions require the same permissions
  const hasSeasonManagementPermissions = isAccountAdministrator(hasRole, accountIdStr);
  const canCreate = hasSeasonManagementPermissions;
  const canEdit = hasSeasonManagementPermissions;
  const canDelete = hasSeasonManagementPermissions;
  const canSetCurrent = hasSeasonManagementPermissions;
  const canManageLeagues = hasSeasonManagementPermissions;
  const canExport = hasSeasonManagementPermissions;

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

  // Targeted update functions for better UX
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
        message:
          'Season copied successfully. All leagues, divisions, teams, active rosters, and managers were duplicated.',
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

  const navigateToLeagueSeasonManagement = (season: Season) => {
    router.push(`/account/${accountId}/seasons/${season.id}/league-seasons`);
  };

  const handleExportClick = (season: Season, event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedSeasonForExport(season);
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
    setSelectedSeasonForExport(null);
  };

  const handleExportSeasonRoster = async () => {
    if (!accountIdStr || !selectedSeasonForExport) return;

    try {
      const result = await exportSeasonRoster({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: selectedSeasonForExport.id },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export season roster') as Blob;
      const sanitizedName = selectedSeasonForExport.name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      downloadBlob(blob, `${sanitizedName}-roster.csv`);
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to export season roster',
      });
    }
    handleExportMenuClose();
  };

  const handleExportSeasonManagers = async () => {
    if (!accountIdStr || !selectedSeasonForExport) return;

    try {
      const result = await exportSeasonManagers({
        client: apiClient,
        path: { accountId: accountIdStr, seasonId: selectedSeasonForExport.id },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export season managers') as Blob;
      const sanitizedName = selectedSeasonForExport.name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      downloadBlob(blob, `${sanitizedName}-managers.csv`);
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to export season managers',
      });
    }
    handleExportMenuClose();
  };

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setCopyDialogOpen(false);
    setFormData({ name: '' });
    setSelectedSeason(null);
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
        <Box textAlign="center">
          <Typography variant="h4" component="h1" color="text.primary" sx={{ fontWeight: 'bold' }}>
            Season Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.8 }}>
            Manage seasons, leagues, and current season settings for your organization.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
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
                  <SeasonCard
                    key={season.id}
                    season={season}
                    canSetCurrent={canSetCurrent}
                    canManageLeagues={canManageLeagues}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canExport={canExport}
                    onSetCurrent={handleSetCurrentSeason}
                    onLeagueSeasonManagement={navigateToLeagueSeasonManagement}
                    onEdit={openEditDialog}
                    onCopy={openCopyDialog}
                    onDelete={openDeleteDialog}
                    onExport={handleExportClick}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

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

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={handleExportSeasonRoster}>Export All Rosters</MenuItem>
        <MenuItem onClick={handleExportSeasonManagers}>Export All Managers</MenuItem>
      </Menu>

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

export default BaseballSeasonManagement;
