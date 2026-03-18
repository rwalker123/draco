'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { getAccountSeason } from '@draco/shared-api-client';
import type {
  AvailablePlayerType,
  CreateGolfPlayerType,
  GolfSubstituteType,
  SeasonType,
  SignPlayerType,
  UpdateGolfPlayerType,
} from '@draco/shared-schemas';
import CreateGolfPlayerDialog from '../teams/CreateGolfPlayerDialog';
import SignPlayerDialog from '../teams/SignPlayerDialog';
import AccountPageHeader from '../../AccountPageHeader';
import { AdminBreadcrumbs } from '../../admin';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';
import { useGolfRosters } from '../../../hooks/useGolfRosters';
import { useRole } from '../../../context/RoleContext';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationSnackbar from '../../common/NotificationSnackbar';

export function LeagueSubstitutesPage() {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const leagueSeasonIdParam = params?.leagueSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : (accountIdParam ?? '');
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : (seasonIdParam ?? '');
  const leagueSeasonId = Array.isArray(leagueSeasonIdParam)
    ? leagueSeasonIdParam[0]
    : (leagueSeasonIdParam ?? '');

  const apiClient = useApiClient();
  const rosterService = useGolfRosters(accountId);
  const { hasPermission } = useRole();
  const { notification, showNotification, hideNotification } = useNotifications();
  const canManage = hasPermission('account.manage');

  const [season, setSeason] = useState<SeasonType | null>(null);
  const [substitutes, setSubstitutes] = useState<GolfSubstituteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editSub, setEditSub] = useState<GolfSubstituteType | null>(null);
  const [editDifferential, setEditDifferential] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayerType[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);

  useEffect(() => {
    if (!seasonId || !leagueSeasonId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);

      try {
        const [seasonResult, subsResult] = await Promise.all([
          getAccountSeason({
            client: apiClient,
            path: { accountId, seasonId },
            signal: controller.signal,
            throwOnError: false,
          }),
          rosterService.listSubstitutesForLeague(seasonId, leagueSeasonId, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        const seasonData = unwrapApiResult(seasonResult, 'Failed to load season');
        setSeason(seasonData as SeasonType);

        if (subsResult.success) {
          setSubstitutes(subsResult.data);
        } else {
          showNotification(subsResult.error, 'error');
        }
      } catch {
        if (controller.signal.aborted) return;
        showNotification('Failed to load substitutes', 'error');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, leagueSeasonId, apiClient, rosterService, showNotification]);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;

    setDeleting(true);
    try {
      const result = await rosterService.deleteSubstitute(
        seasonId,
        leagueSeasonId,
        confirmDeleteId,
      );
      if (result.success) {
        setSubstitutes((prev) => prev.filter((s) => s.id !== confirmDeleteId));
        showNotification('Substitute removed successfully', 'success');
      } else {
        showNotification(result.error, 'error');
      }
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleEditOpen = (sub: GolfSubstituteType) => {
    setEditSub(sub);
    setEditDifferential(
      sub.initialDifferential !== null && sub.initialDifferential !== undefined
        ? sub.initialDifferential.toString()
        : '',
    );
  };

  const handleEditSave = async () => {
    if (!editSub) return;

    setSaving(true);
    try {
      const parsed = parseFloat(editDifferential);
      const parsedValue = editDifferential.trim() === '' || isNaN(parsed) ? null : parsed;
      const payload: UpdateGolfPlayerType = {
        initialDifferential: parsedValue,
      };
      const result = await rosterService.updateSubstitute(
        seasonId,
        leagueSeasonId,
        editSub.id,
        payload,
      );
      if (result.success) {
        setSubstitutes((prev) => prev.map((s) => (s.id === result.data.id ? result.data : s)));
        showNotification('Substitute updated successfully', 'success');
        setEditSub(null);
      } else {
        showNotification(result.error, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async (data: CreateGolfPlayerType) => {
    const result = await rosterService.createSubstitute(seasonId, leagueSeasonId, data);
    if (result.success) {
      setSubstitutes((prev) => [...prev, result.data]);
      showNotification('Substitute added successfully', 'success');
    } else {
      throw new Error(result.error);
    }
  };

  const refreshAvailablePlayers = async () => {
    if (!seasonId) return;
    setAvailableLoading(true);
    try {
      const result = await rosterService.listAvailablePlayers(seasonId);
      if (result.success) {
        setAvailablePlayers(result.data);
      }
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleOpenCreateDialog = () => {
    handleAddMenuClose();
    setCreateDialogOpen(true);
  };

  const handleOpenSignDialog = async () => {
    handleAddMenuClose();
    await refreshAvailablePlayers();
    setSignDialogOpen(true);
  };

  const handleSignSubmit = async (data: SignPlayerType) => {
    const result = await rosterService.signSubstitute(seasonId, leagueSeasonId, data);
    if (result.success) {
      setSubstitutes((prev) => [...prev, result.data]);
      showNotification('Substitute added successfully', 'success');
    } else {
      throw new Error(result.error);
    }
  };

  const subToDelete = confirmDeleteId ? substitutes.find((s) => s.id === confirmDeleteId) : null;

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <PersonOffIcon sx={{ color: 'text.primary' }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
          >
            League Substitutes
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          {season ? `Manage substitute players for ${season.name}` : 'Manage substitute players'}
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          links={[
            { name: 'Season', href: `/account/${accountId}/admin/season` },
            { name: 'Season Management', href: `/account/${accountId}/seasons` },
            {
              name: 'Flights & Teams',
              href: `/account/${accountId}/seasons/${seasonId}/golf/flights`,
            },
          ]}
          currentPage="League Substitutes"
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : substitutes.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', mt: 2 }}>
            No substitutes registered yet.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Handicap Index</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {substitutes.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {sub.player.firstName} {sub.player.lastName}
                    </TableCell>
                    <TableCell>
                      {sub.initialDifferential !== null && sub.initialDifferential !== undefined
                        ? sub.initialDifferential.toFixed(1)
                        : '—'}
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          size="small"
                          onClick={() => handleEditOpen(sub)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={() => setConfirmDeleteId(sub.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      <Dialog open={confirmDeleteId !== null} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>Remove Substitute</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{' '}
            {subToDelete
              ? `${subToDelete.player.firstName} ${subToDelete.player.lastName}`
              : 'this player'}{' '}
            from the substitute pool?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}
          >
            {deleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editSub !== null} onClose={() => !saving && setEditSub(null)}>
        <DialogTitle>Edit Substitute</DialogTitle>
        <DialogContent>
          {editSub && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {editSub.player.firstName} {editSub.player.lastName}
              </Typography>
              <TextField
                label="Handicap Index"
                type="number"
                value={editDifferential}
                onChange={(e) => setEditDifferential(e.target.value)}
                fullWidth
                inputProps={{ step: 0.1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSub(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {canManage && (
        <>
          <Fab
            color="primary"
            aria-label="add substitute"
            onClick={handleAddMenuOpen}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            <AddIcon />
          </Fab>

          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor)}
            onClose={handleAddMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <MenuItem onClick={handleOpenSignDialog}>
              <GroupAddIcon sx={{ mr: 1 }} />
              Add Existing Contact
            </MenuItem>
            <MenuItem onClick={handleOpenCreateDialog}>
              <PersonAddIcon sx={{ mr: 1 }} />
              Create New Contact
            </MenuItem>
          </Menu>
        </>
      )}

      <CreateGolfPlayerDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Add Substitute"
      />

      <SignPlayerDialog
        open={signDialogOpen}
        onClose={() => setSignDialogOpen(false)}
        onSign={handleSignSubmit}
        availablePlayers={availablePlayers}
        loadingPlayers={availableLoading}
      />

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </main>
  );
}

export default LeagueSubstitutesPage;
