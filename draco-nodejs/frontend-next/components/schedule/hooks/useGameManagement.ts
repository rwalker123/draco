import { useState, useCallback } from 'react';
import { Game } from '@/types/schedule';
import { ScheduleGameResultsSuccessPayload } from '../dialogs/GameResultsDialog';
import type { DeleteGameResult } from './useGameDeletion';

interface UseGameManagementProps {
  accountId: string;
  upsertGameInCache: (game: Game) => void;
  removeGameFromCache: (gameId: string) => void;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

interface UseGameManagementReturn {
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  gameResultsDialogOpen: boolean;

  selectedGame: Game | null;
  selectedGameForResults: Game | null;

  setCreateDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setGameResultsDialogOpen: (open: boolean) => void;
  setSelectedGame: (game: Game | null) => void;
  setSelectedGameForResults: (game: Game | null) => void;

  handleDeleteSuccess: (result: DeleteGameResult) => void;
  handleGameResultsSuccess: (payload: ScheduleGameResultsSuccessPayload) => void;

  openCreateDialog: () => void;
  openEditDialog: (game: Game) => void;
  openDeleteDialog: (game: Game) => void;
  openGameResultsDialog: (game: Game) => void;
}

export const useGameManagement = ({
  upsertGameInCache,
  removeGameFromCache,
  setSuccess,
  setError,
}: UseGameManagementProps): UseGameManagementReturn => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameResultsDialogOpen, setGameResultsDialogOpen] = useState(false);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGameForResults, setSelectedGameForResults] = useState<Game | null>(null);
  const handleDeleteSuccess = useCallback(
    ({ message, gameId }: DeleteGameResult) => {
      setSuccess(message);
      setError(null);
      setEditDialogOpen(false);
      setDeleteDialogOpen(false);

      if (selectedGame?.id === gameId) {
        setSelectedGame(null);
      }

      if (selectedGameForResults?.id === gameId) {
        setGameResultsDialogOpen(false);
        setSelectedGameForResults(null);
      }

      removeGameFromCache(gameId);
    },
    [removeGameFromCache, selectedGame, selectedGameForResults, setSuccess, setError],
  );

  const handleGameResultsSuccess = useCallback(
    (payload: ScheduleGameResultsSuccessPayload) => {
      const { updatedGame } = payload;

      upsertGameInCache(updatedGame);
      setSelectedGameForResults(updatedGame);
      if (selectedGame && selectedGame.id === updatedGame.id) {
        setSelectedGame(updatedGame);
      }

      setSuccess('Game results saved successfully');
      setGameResultsDialogOpen(false);
      setSelectedGameForResults(null);
    },
    [selectedGame, upsertGameInCache, setSuccess],
  );

  const openCreateDialog = useCallback(() => {
    setSelectedGame(null);
    setCreateDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((game: Game) => {
    setSelectedGame(game);
    setEditDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((game: Game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  }, []);

  const openGameResultsDialog = useCallback((game: Game) => {
    setSelectedGameForResults(game);
    setGameResultsDialogOpen(true);
  }, []);

  return {
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    gameResultsDialogOpen,

    selectedGame,
    selectedGameForResults,

    setCreateDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setGameResultsDialogOpen,
    setSelectedGame,
    setSelectedGameForResults,

    handleDeleteSuccess,
    handleGameResultsSuccess,

    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openGameResultsDialog,
  };
};
