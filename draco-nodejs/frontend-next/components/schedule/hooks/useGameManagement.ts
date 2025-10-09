import { useState, useCallback } from 'react';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game } from '@/types/schedule';
import { deleteGame, updateGameResults } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import { getGameStatusShortText, getGameStatusText } from '../../../utils/gameUtils';

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

  handleDeleteGame: () => Promise<void>;
  handleSaveGameResults: (gameResultData: GameResultData) => Promise<void>;

  openCreateDialog: () => void;
  openEditDialog: (game: Game) => void;
  openDeleteDialog: (game: Game) => void;
  openGameResultsDialog: (game: Game) => void;
}

interface GameResultData {
  homeScore: number;
  awayScore: number;
  gameStatus: number;
  emailPlayers: boolean;
  postToTwitter: boolean;
  postToBluesky: boolean;
  postToFacebook: boolean;
}

export const useGameManagement = ({
  accountId,
  upsertGameInCache,
  removeGameFromCache,
  setSuccess,
  setError,
}: UseGameManagementProps): UseGameManagementReturn => {
  const apiClient = useApiClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameResultsDialogOpen, setGameResultsDialogOpen] = useState(false);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGameForResults, setSelectedGameForResults] = useState<Game | null>(null);
  const handleDeleteGame = useCallback(async () => {
    try {
      if (!selectedGame) return;

      const result = await deleteGame({
        client: apiClient,
        path: {
          accountId,
          seasonId: selectedGame.season.id,
          gameId: selectedGame.id,
        },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to delete game');

      setSuccess('Game deleted successfully');
      setEditDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      if (selectedGameForResults?.id === selectedGame.id) {
        setGameResultsDialogOpen(false);
        setSelectedGameForResults(null);
      }
      removeGameFromCache(selectedGame.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      setDeleteDialogOpen(false);
    }
  }, [
    selectedGame,
    selectedGameForResults,
    accountId,
    apiClient,
    removeGameFromCache,
    setSuccess,
    setError,
  ]);

  const handleSaveGameResults = useCallback(
    async (gameResultData: GameResultData) => {
      if (!selectedGameForResults) {
        throw new Error('No game selected for results');
      }

      const result = await updateGameResults({
        client: apiClient,
        path: {
          accountId,
          seasonId: selectedGameForResults.season.id,
          gameId: selectedGameForResults.id,
        },
        body: {
          homeScore: gameResultData.homeScore,
          visitorScore: gameResultData.awayScore,
          gameStatus: gameResultData.gameStatus,
          emailPlayers: gameResultData.emailPlayers,
          postToTwitter: gameResultData.postToTwitter,
          postToBluesky: gameResultData.postToBluesky,
          postToFacebook: gameResultData.postToFacebook,
        },
        throwOnError: false,
      });

      const updatedResult = unwrapApiResult(result, 'Failed to save game results');
      const updatedGame: Game = {
        ...selectedGameForResults,
        homeScore: updatedResult.homeScore,
        visitorScore: updatedResult.visitorScore,
        gameStatus: updatedResult.gameStatus,
        gameStatusText: getGameStatusText(updatedResult.gameStatus),
        gameStatusShortText: getGameStatusShortText(updatedResult.gameStatus),
      };

      upsertGameInCache(updatedGame);
      setSelectedGameForResults(updatedGame);
      if (selectedGame && selectedGame.id === updatedGame.id) {
        setSelectedGame(updatedGame);
      }

      setSuccess('Game results saved successfully');
      setGameResultsDialogOpen(false);
      setSelectedGameForResults(null);
    },
    [selectedGame, selectedGameForResults, accountId, apiClient, upsertGameInCache, setSuccess],
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

    handleDeleteGame,
    handleSaveGameResults,

    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openGameResultsDialog,
  };
};
