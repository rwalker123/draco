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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

interface SeasonFormData {
  name: string;
}

const SeasonManagement: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { hasRole, hasPermission } = useRole();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<SeasonFormData>({ name: '' });
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Check permissions
  const canCreate = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canEdit = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canDelete = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');
  const canSetCurrent = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');

  const fetchSeasons = useCallback(async () => {
    if (!accountId || !token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/accounts/${accountId}/seasons`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSeasons(response.data.data.seasons);
      } else {
        setError(response.data.message || 'Failed to fetch seasons');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch seasons');
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  useEffect(() => {
    if (accountId) {
      fetchSeasons();
    }
  }, [accountId, fetchSeasons]);

  const handleCreateSeason = async () => {
    if (!accountId || !token || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons`,
        { name: formData.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Season created successfully');
        setCreateDialogOpen(false);
        setFormData({ name: '' });
        fetchSeasons();
      } else {
        setError(response.data.message || 'Failed to create season');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create season');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSeason = async () => {
    if (!accountId || !token || !selectedSeason || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${selectedSeason.id}`,
        { name: formData.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Season updated successfully');
        setEditDialogOpen(false);
        setFormData({ name: '' });
        setSelectedSeason(null);
        fetchSeasons();
      } else {
        setError(response.data.message || 'Failed to update season');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update season');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSeason = async () => {
    if (!accountId || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${selectedSeason.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Season deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedSeason(null);
        fetchSeasons();
      } else {
        setError(response.data.message || 'Failed to delete season');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete season');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopySeason = async () => {
    if (!accountId || !token || !selectedSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${selectedSeason.id}/copy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`Season copied successfully. ${response.data.data.copiedLeagues} leagues copied.`);
        setCopyDialogOpen(false);
        setSelectedSeason(null);
        fetchSeasons();
      } else {
        setError(response.data.message || 'Failed to copy season');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to copy season');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetCurrentSeason = async (season: Season) => {
    if (!accountId || !token) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/set-current`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`"${season.name}" is now the current season`);
        fetchSeasons();
      } else {
        setError(response.data.message || 'Failed to set current season');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set current season');
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
    <Box p={3}>
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
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
                  {canCreate ? 'Create your first season to get started.' : 'No seasons are available.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              }}
              gap={3}
            >
              {seasons.map((season) => (
                <Card key={season.id}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {season.name}
                      </Typography>
                      {season.isCurrent && (
                        <Chip
                          icon={<StarIcon />}
                          label="Current"
                          color="primary"
                          size="small"
                        />
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
                          <IconButton
                            size="small"
                            onClick={() => handleSetCurrentSeason(season)}
                          >
                            <StarBorderIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canEdit && (
                        <Tooltip title="Edit season">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(season)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canEdit && (
                        <Tooltip title="Copy season">
                          <IconButton
                            size="small"
                            onClick={() => openCopyDialog(season)}
                          >
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
            Are you sure you want to delete the season "{selectedSeason?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All data associated with this season will be permanently deleted.
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
            Are you sure you want to copy the season "{selectedSeason?.name}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This will create a new season with the name "{selectedSeason?.name} Copy" and copy all associated leagues.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCopySeason}
            variant="contained"
            disabled={formLoading}
          >
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
    </Box>
  );
};

export default SeasonManagement; 