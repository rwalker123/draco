'use client';

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { useClassifiedsPermissions } from '../../../../hooks/useClassifiedsPermissions';
import { useAuth } from '../../../../context/AuthContext';
import { PlayersWantedCard } from '../../../../components/player-classifieds';
import CreatePlayersWantedDialog from '../../../../components/player-classifieds/CreatePlayersWantedDialog';
import EmptyState from '../../../../components/common/EmptyState';
import {
  IPlayersWantedResponse,
  IPlayersWantedFormState,
} from '../../../../types/playerClassifieds';

interface PlayersWantedProps {
  accountId: string;
}

const PlayersWanted: React.FC<PlayersWantedProps> = ({ accountId }) => {
  const { token } = useAuth();

  const {
    playersWanted,
    loading,
    error,
    refreshData,
    clearError,
    createPlayersWanted,
    updatePlayersWanted,
    formLoading,
  } = usePlayerClassifieds(accountId, token || undefined);

  // Get permission functions for edit/delete controls
  const { canEditPlayersWantedById, canDeletePlayersWantedById } = useClassifiedsPermissions({
    accountId,
  });

  // Dialog state management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClassified, setEditingClassified] = useState<IPlayersWantedResponse | null>(null);

  // Success/error notification state
  const [success, setSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle create players wanted
  const handleCreatePlayersWanted = async (formData: IPlayersWantedFormState) => {
    try {
      await createPlayersWanted(formData);
      // Close dialog and show success message
      setCreateDialogOpen(false);
      setSuccess('Players Wanted ad created successfully!');
      setLocalError(null);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      // Error is already handled by the hook, but re-throw so dialog can handle it
      throw error;
    }
  };

  // Utility function to convert IPlayersWantedResponse to IPlayersWantedFormState
  const convertToFormState = (classified: IPlayersWantedResponse): IPlayersWantedFormState => {
    return {
      teamEventName: classified.teamEventName,
      description: classified.description,
      positionsNeeded: classified.positionsNeeded
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
    };
  };

  // Handle edit
  const handleEdit = (id: string) => {
    const classified = playersWanted.find((c) => c.id.toString() === id);
    if (!classified) return;

    setEditingClassified(classified);
    setEditDialogOpen(true);
  };

  // Handle edit dialog close
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingClassified(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData: IPlayersWantedFormState) => {
    if (!editingClassified) return;

    try {
      await updatePlayersWanted(editingClassified.id.toString(), formData);

      // Close the edit dialog and show success message
      closeEditDialog();
      setSuccess('Players Wanted ad updated successfully!');
      setLocalError(null);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      // Let the hook handle error notifications, but re-throw so dialog can handle it
      throw error;
    }
  };

  // Helper function to render dialogs (DRY principle)
  const renderDialogs = () => (
    <>
      {/* Create Players Wanted Dialog */}
      <CreatePlayersWantedDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreatePlayersWanted}
        loading={formLoading}
      />

      {/* Edit Players Wanted Dialog */}
      {editingClassified && (
        <CreatePlayersWantedDialog
          open={editDialogOpen}
          onClose={closeEditDialog}
          onSubmit={handleEditSubmit}
          loading={formLoading}
          editMode={true}
          initialData={convertToFormState(editingClassified)}
        />
      )}
    </>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!playersWanted || playersWanted.length === 0) {
    return (
      <>
        <Box sx={{ p: 2 }}>
          <EmptyState
            title="No Players Wanted"
            subtitle="No players are currently looking for teams."
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Post Players Wanted
            </Button>
          </EmptyState>
        </Box>

        {/* Render dialogs for empty state */}
        {renderDialogs()}
      </>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Notifications */}
      {localError && (
        <Alert severity="error" onClose={() => setLocalError(null)} sx={{ mb: 3 }}>
          {localError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Header with Create and Refresh Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Players Looking for Teams ({playersWanted.length})
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              console.log('🚀 Post Players Wanted button clicked!');
              console.log('🔍 Current createDialogOpen state:', createDialogOpen);
              setCreateDialogOpen(true);
              console.log('✅ setCreateDialogOpen(true) called');
            }}
          >
            Post Players Wanted
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              refreshData();
            }}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Notifications */}
      {localError && (
        <Alert severity="error" onClose={() => setLocalError(null)} sx={{ mb: 3 }}>
          {localError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Players Wanted Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 2,
        }}
      >
        {playersWanted.map((classified: IPlayersWantedResponse) => (
          <PlayersWantedCard
            key={classified.id.toString()}
            classified={classified}
            onEdit={() => handleEdit(classified.id.toString())}
            onDelete={() => {}}
            canEdit={canEditPlayersWantedById}
            canDelete={canDeletePlayersWantedById}
          />
        ))}
      </Box>

      {/* Render dialogs for main state */}
      {renderDialogs()}
    </Box>
  );
};

export default PlayersWanted;
