'use client';

import React, { useMemo, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { useClassifiedsPermissions } from '../../../../hooks/useClassifiedsPermissions';
import { useAuth } from '../../../../context/AuthContext';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';
import { usePlayersWantedDialogs } from '../../../../hooks/usePlayersWantedDialogs';
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
  const { user, token } = useAuth();
  const { isMember } = useAccountMembership(accountId);
  const isAccountMember = !!isMember;
  const isSignedIn = !!user;

  const {
    playersWanted,
    loading,
    error,
    clearError,
    createPlayersWanted,
    updatePlayersWanted,
    formLoading,
  } = usePlayerClassifieds(accountId, token || undefined);

  // Get permission functions for edit/delete controls
  const { canEditPlayersWantedById, canDeletePlayersWantedById } = useClassifiedsPermissions({
    accountId,
  });

  // Dialog state management using custom hook
  const {
    createDialogOpen,
    editDialogOpen,
    editingClassified,
    success,
    localError,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    showSuccessMessage,
    setLocalError,
    clearSuccess,
    convertToFormState,
  } = usePlayersWantedDialogs();

  // Handle create players wanted
  const handleCreatePlayersWanted = useCallback(
    async (formData: IPlayersWantedFormState) => {
      try {
        await createPlayersWanted(formData);
        // Close dialog and show success message
        closeCreateDialog();
        showSuccessMessage('Players Wanted ad created successfully!');
      } catch (error) {
        // Error is already handled by the hook, but re-throw so dialog can handle it
        throw error;
      }
    },
    [createPlayersWanted, closeCreateDialog, showSuccessMessage],
  );

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      const classified = playersWanted.find((c) => c.id.toString() === id);
      if (!classified) return;

      openEditDialog(classified);
    },
    [playersWanted, openEditDialog],
  );

  // Handle edit form submission
  const handleEditSubmit = useCallback(
    async (formData: IPlayersWantedFormState) => {
      if (!editingClassified) return;

      try {
        await updatePlayersWanted(editingClassified.id.toString(), formData);

        // Close the edit dialog and show success message
        closeEditDialog();
        showSuccessMessage('Players Wanted ad updated successfully!');
      } catch (error) {
        // Let the hook handle error notifications, but re-throw so dialog can handle it
        throw error;
      }
    },
    [editingClassified, updatePlayersWanted, closeEditDialog, showSuccessMessage],
  );

  // Memoized function to render dialogs (DRY principle)
  const renderDialogs = useMemo(
    () => (
      <>
        {/* Create Players Wanted Dialog */}
        <CreatePlayersWantedDialog
          open={createDialogOpen}
          onClose={closeCreateDialog}
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
    ),
    [
      createDialogOpen,
      closeCreateDialog,
      handleCreatePlayersWanted,
      formLoading,
      editingClassified,
      editDialogOpen,
      closeEditDialog,
      handleEditSubmit,
      convertToFormState,
    ],
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
          {/* Sign In Banner for Non-Authenticated Users */}
          {!isSignedIn && (
            <Alert severity="info" sx={{ mb: 3 }}>
              To create a Players Wanted ad, please sign in to your account.
            </Alert>
          )}

          <EmptyState
            title="No Players Wanted"
            subtitle="No players are currently looking for teams."
          >
            {isAccountMember && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                sx={{ mt: 2 }}
              >
                Post Players Wanted
              </Button>
            )}
          </EmptyState>
        </Box>

        {/* Render dialogs for empty state */}
        {renderDialogs}
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
        <Alert severity="success" onClose={clearSuccess} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Sign In Banner for Non-Authenticated Users */}
      {!isSignedIn && (
        <Alert severity="info" sx={{ mb: 3 }}>
          To create a Players Wanted ad, please sign in to your account.
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Teams Looking for Players ({playersWanted.length})
        </Typography>
        {isAccountMember && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Post Players Wanted
          </Button>
        )}
      </Box>

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
      {renderDialogs}
    </Box>
  );
};

export default PlayersWanted;
