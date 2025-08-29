import { useState, useCallback } from 'react';
import { IPlayersWantedResponse, IPlayersWantedFormState } from '../types/playerClassifieds';

interface UsePlayersWantedDialogsReturn {
  // Dialog state
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  editingClassified: IPlayersWantedResponse | null;
  deletingClassified: IPlayersWantedResponse | null;

  // Success/error state
  success: string | null;
  localError: string | null;

  // Dialog handlers
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openEditDialog: (classified: IPlayersWantedResponse) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (classified: IPlayersWantedResponse) => void;
  closeDeleteDialog: () => void;

  // Success/error handlers
  setSuccess: (message: string | null) => void;
  setLocalError: (error: string | null) => void;
  showSuccessMessage: (message: string, duration?: number) => void;
  clearSuccess: () => void;

  // Utility functions
  convertToFormState: (classified: IPlayersWantedResponse) => IPlayersWantedFormState;
}

export const usePlayersWantedDialogs = (): UsePlayersWantedDialogsReturn => {
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClassified, setEditingClassified] = useState<IPlayersWantedResponse | null>(null);
  const [deletingClassified, setDeletingClassified] = useState<IPlayersWantedResponse | null>(null);

  // Success/error notification state
  const [success, setSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Dialog handlers
  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const openEditDialog = useCallback((classified: IPlayersWantedResponse) => {
    setEditingClassified(classified);
    setEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingClassified(null);
  }, []);

  const openDeleteDialog = useCallback((classified: IPlayersWantedResponse) => {
    setDeletingClassified(classified);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingClassified(null);
  }, []);

  // Success/error handlers
  const showSuccessMessage = useCallback((message: string, duration: number = 5000) => {
    setSuccess(message);
    setLocalError(null);
    setTimeout(() => setSuccess(null), duration);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  // Utility function to convert IPlayersWantedResponse to IPlayersWantedFormState
  const convertToFormState = useCallback(
    (classified: IPlayersWantedResponse): IPlayersWantedFormState => {
      return {
        teamEventName: classified.teamEventName,
        description: classified.description,
        positionsNeeded: classified.positionsNeeded
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0),
      };
    },
    [],
  );

  return {
    // Dialog state
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    editingClassified,
    deletingClassified,

    // Success/error state
    success,
    localError,

    // Dialog handlers
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,

    // Success/error handlers
    setSuccess,
    setLocalError,
    showSuccessMessage,
    clearSuccess,

    // Utility functions
    convertToFormState,
  };
};
