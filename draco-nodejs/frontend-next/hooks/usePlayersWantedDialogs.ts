import {
  PlayersWantedClassifiedType,
  UpsertPlayersWantedClassifiedType,
} from '@draco/shared-schemas';
import { useState } from 'react';

interface UsePlayersWantedDialogsReturn {
  // Dialog state
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  editingClassified: UpsertPlayersWantedClassifiedType | null;
  deletingClassified: PlayersWantedClassifiedType | null;

  // Success/error state
  success: string | null;
  localError: string | null;

  // Dialog handlers
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openEditDialog: (classified: UpsertPlayersWantedClassifiedType) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (classified: PlayersWantedClassifiedType) => void;
  closeDeleteDialog: () => void;

  // Success/error handlers
  setSuccess: (message: string | null) => void;
  setLocalError: (error: string | null) => void;
  showSuccessMessage: (message: string, duration?: number) => void;
  clearSuccess: () => void;
}

export const usePlayersWantedDialogs = (): UsePlayersWantedDialogsReturn => {
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClassified, setEditingClassified] =
    useState<UpsertPlayersWantedClassifiedType | null>(null);
  const [deletingClassified, setDeletingClassified] = useState<PlayersWantedClassifiedType | null>(
    null,
  );

  // Success/error notification state
  const [success, setSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Dialog handlers
  const openCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const openEditDialog = (classified: UpsertPlayersWantedClassifiedType) => {
    setEditingClassified(classified);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingClassified(null);
  };

  const openDeleteDialog = (classified: PlayersWantedClassifiedType) => {
    setDeletingClassified(classified);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingClassified(null);
  };

  // Success/error handlers
  const showSuccessMessage = (message: string, duration: number = 5000) => {
    setSuccess(message);
    setLocalError(null);
    setTimeout(() => setSuccess(null), duration);
  };

  const clearSuccess = () => {
    setSuccess(null);
  };

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
  };
};
