import { useState, useCallback } from 'react';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game, GameFormState, GameType, GameStatus } from '@/types/schedule';
import { formatGameDateTime } from '../../../utils/dateUtils';
import { createGame, updateGame, deleteGame, updateGameResults } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import type { UpsertGameType } from '@draco/shared-schemas';

interface UseGameManagementProps {
  accountId: string;
  loadGamesData: () => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  clearLeagueTeams: () => void;
}

interface UseGameManagementReturn {
  // Dialog states
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  keepDialogOpen: boolean;
  gameResultsDialogOpen: boolean;

  // Selected games
  selectedGame: Game | null;
  selectedGameForResults: Game | null;
  dialogLeagueSeason: string;

  // Form state
  formState: GameFormState;

  // Error states
  editDialogError: string | null;
  createDialogError: string | null;

  // Actions
  setCreateDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setKeepDialogOpen: (keep: boolean) => void;
  setGameResultsDialogOpen: (open: boolean) => void;
  setSelectedGame: (game: Game | null) => void;
  setSelectedGameForResults: (game: Game | null) => void;
  setDialogLeagueSeason: (leagueId: string) => void;
  setFormState: (state: Partial<GameFormState>) => void;
  setEditDialogError: (error: string | null) => void;
  setCreateDialogError: (error: string | null) => void;

  // CRUD operations
  handleCreateGame: () => Promise<void>;
  handleUpdateGame: () => Promise<void>;
  handleDeleteGame: () => Promise<void>;
  handleSaveGameResults: (gameResultData: GameResultData) => Promise<void>;

  // Dialog management
  openEditDialog: (game: Game) => void;
  openDeleteDialog: (game: Game) => void;
  openGameResultsDialog: (game: Game) => void;
  resetForm: () => void;
  initializeCreateForm: (filterType: string, filterDate: Date, startDate: Date) => void;
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

// Helper function to parse UTC date string as local time (for editing)
const parseUTCAsLocal = (utcString: string): Date => {
  const date = new Date(utcString);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
};

export const useGameManagement = ({
  accountId,
  loadGamesData,
  setSuccess,
  setError,
  clearLeagueTeams,
}: UseGameManagementProps): UseGameManagementReturn => {
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keepDialogOpen, setKeepDialogOpen] = useState(false);
  const [gameResultsDialogOpen, setGameResultsDialogOpen] = useState(false);

  // Selected games
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGameForResults, setSelectedGameForResults] = useState<Game | null>(null);
  const [dialogLeagueSeason, setDialogLeagueSeason] = useState<string>('');

  // Form state
  const [formState, setFormState] = useState<GameFormState>({
    gameDate: new Date(),
    gameTime: new Date(),
    homeTeamId: '',
    visitorTeamId: '',
    fieldId: '',
    comment: '',
    gameType: GameType.RegularSeason,
    umpire1: '',
    umpire2: '',
    umpire3: '',
    umpire4: '',
  });

  // Error states
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);

  // Reset form helper - defined early to avoid hoisting issues
  const resetForm = useCallback(() => {
    setFormState({
      gameDate: new Date(),
      gameTime: new Date(),
      homeTeamId: '',
      visitorTeamId: '',
      fieldId: '',
      comment: '',
      gameType: GameType.RegularSeason,
      umpire1: '',
      umpire2: '',
      umpire3: '',
      umpire4: '',
    });
    setSelectedGame(null);
    setDialogLeagueSeason('');
    // Clear league teams when form is reset
    if (clearLeagueTeams) {
      clearLeagueTeams();
    }
  }, [clearLeagueTeams]);

  const buildUpsertGamePayload = useCallback(
    ({
      leagueSeasonId,
      gameDate,
      homeTeamId,
      visitorTeamId,
      fieldId,
      comment,
      gameType,
      gameStatus,
      umpire1,
      umpire2,
      umpire3,
      umpire4,
    }: {
      leagueSeasonId: string;
      gameDate: string;
      homeTeamId: string;
      visitorTeamId: string;
      fieldId?: string;
      comment?: string;
      gameType: number | string;
      gameStatus: number;
      umpire1?: string;
      umpire2?: string;
      umpire3?: string;
      umpire4?: string;
    }): UpsertGameType => {
      return {
        leagueSeasonId,
        gameDate,
        homeTeam: { id: homeTeamId },
        visitorTeam: { id: visitorTeamId },
        field: fieldId ? { id: fieldId } : null,
        comment: comment ?? '',
        gameStatus,
        gameType: String(gameType),
        umpire1: umpire1 ? { id: umpire1 } : null,
        umpire2: umpire2 ? { id: umpire2 } : null,
        umpire3: umpire3 ? { id: umpire3 } : null,
        umpire4: umpire4 ? { id: umpire4 } : null,
      };
    },
    [],
  );

  // Create game
  const handleCreateGame = useCallback(async () => {
    try {
      setCreateDialogError(null);

      const {
        gameDate,
        gameTime,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType,
        umpire1,
        umpire2,
        umpire3,
        umpire4,
      } = formState;

      if (!gameDate || !gameTime || !homeTeamId || !visitorTeamId || !dialogLeagueSeason) {
        setCreateDialogError('Please fill in all required fields');
        return;
      }

      const currentSeasonId = await fetchCurrentSeason();

      const gameDateString = formatGameDateTime(gameDate, gameTime);

      const payload = buildUpsertGamePayload({
        leagueSeasonId: dialogLeagueSeason,
        gameDate: gameDateString,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType,
        gameStatus: GameStatus.Scheduled,
        umpire1,
        umpire2,
        umpire3,
        umpire4,
      });

      const result = await createGame({
        client: apiClient,
        path: { accountId, seasonId: currentSeasonId },
        body: payload,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to create game');

      setSuccess('Game created successfully');
      if (!keepDialogOpen) {
        setCreateDialogOpen(false);
        resetForm();
      } else {
        // When keeping dialog open, preserve league selection, game time, and game date but reset other fields
        const currentLeague = dialogLeagueSeason;
        const currentGameTime = gameTime;
        const currentGameDate = gameDate;
        resetForm();
        setDialogLeagueSeason(currentLeague);
        setFormState((prev) => ({
          ...prev,
          gameTime: currentGameTime,
          gameDate: currentGameDate,
        }));
      }
      loadGamesData();
    } catch (err) {
      setCreateDialogError(err instanceof Error ? err.message : 'Failed to create game');
    }
  }, [
    formState,
    dialogLeagueSeason,
    keepDialogOpen,
    accountId,
    apiClient,
    fetchCurrentSeason,
    loadGamesData,
    setSuccess,
    resetForm,
    buildUpsertGamePayload,
  ]);

  // Update game
  const handleUpdateGame = useCallback(async () => {
    try {
      setEditDialogError(null);

      const {
        gameDate,
        gameTime,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType,
        umpire1,
        umpire2,
        umpire3,
        umpire4,
      } = formState;

      if (!selectedGame || !gameDate || !gameTime || !homeTeamId || !visitorTeamId) {
        setEditDialogError('Please fill in all required fields');
        return;
      }

      const gameDateString = formatGameDateTime(gameDate, gameTime);
      const leagueSeasonId = dialogLeagueSeason || selectedGame.league.id;

      if (!leagueSeasonId) {
        setEditDialogError('League season is required');
        return;
      }

      const payload = buildUpsertGamePayload({
        leagueSeasonId,
        gameDate: gameDateString,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType,
        gameStatus: selectedGame.gameStatus,
        umpire1,
        umpire2,
        umpire3,
        umpire4,
      });

      const result = await updateGame({
        client: apiClient,
        path: {
          accountId,
          seasonId: selectedGame.season.id,
          gameId: selectedGame.id,
        },
        body: payload,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to update game');

      setSuccess('Game updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadGamesData();
    } catch (err) {
      setEditDialogError(err instanceof Error ? err.message : 'Failed to update game');
    }
  }, [
    formState,
    selectedGame,
    dialogLeagueSeason,
    accountId,
    apiClient,
    loadGamesData,
    setSuccess,
    resetForm,
    buildUpsertGamePayload,
  ]);

  // Delete game
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
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      loadGamesData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      setDeleteDialogOpen(false);
    }
  }, [selectedGame, accountId, apiClient, loadGamesData, setSuccess, setError]);

  // Save game results
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

      unwrapApiResult(result, 'Failed to save game results');

      setSuccess('Game results saved successfully');
      setGameResultsDialogOpen(false);
      setSelectedGameForResults(null);
      loadGamesData();
    },
    [selectedGameForResults, accountId, apiClient, loadGamesData, setSuccess],
  );

  // Dialog management
  const openEditDialog = useCallback((game: Game) => {
    setSelectedGame(game);
    setFormState({
      gameDate: parseUTCAsLocal(game.gameDate),
      gameTime: parseUTCAsLocal(game.gameDate),
      homeTeamId: game.homeTeamId,
      visitorTeamId: game.visitorTeamId,
      fieldId: game.fieldId || '',
      comment: game.comment,
      gameType: game.gameType || 0,
      umpire1: game.umpire1 || '',
      umpire2: game.umpire2 || '',
      umpire3: game.umpire3 || '',
      umpire4: game.umpire4 || '',
    });
    setEditDialogError(null);
    setDialogLeagueSeason(game.league?.id || ''); // Set to game's league ID for fallback
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

  const initializeCreateForm = useCallback(
    (filterType: string, filterDate: Date, startDate: Date) => {
      // Use the selected filter date based on filter type
      let initialDate: Date;
      switch (filterType) {
        case 'day':
          initialDate = filterDate;
          break;
        case 'week':
          initialDate = startDate;
          break;
        case 'month':
          initialDate = startDate;
          break;
        case 'year':
          initialDate = startDate;
          break;
        default:
          initialDate = new Date();
      }

      setFormState({
        gameDate: initialDate,
        gameTime: initialDate,
        homeTeamId: '',
        visitorTeamId: '',
        fieldId: '',
        comment: '',
        gameType: GameType.RegularSeason,
        umpire1: '',
        umpire2: '',
        umpire3: '',
        umpire4: '',
      });
      setDialogLeagueSeason('');
      setCreateDialogError(null);
    },
    [],
  );

  // Wrapper function to match the expected interface
  const setFormStateWrapper = useCallback((state: Partial<GameFormState>) => {
    setFormState((prev) => ({ ...prev, ...state }));
  }, []);

  return {
    // Dialog states
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    keepDialogOpen,
    gameResultsDialogOpen,

    // Selected games
    selectedGame,
    selectedGameForResults,
    dialogLeagueSeason,

    // Form state
    formState,

    // Error states
    editDialogError,
    createDialogError,

    // Actions
    setCreateDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setKeepDialogOpen,
    setGameResultsDialogOpen,
    setSelectedGame,
    setSelectedGameForResults,
    setDialogLeagueSeason,
    setFormState: setFormStateWrapper,
    setEditDialogError,
    setCreateDialogError,

    // CRUD operations
    handleCreateGame,
    handleUpdateGame,
    handleDeleteGame,
    handleSaveGameResults,

    // Dialog management
    openEditDialog,
    openDeleteDialog,
    openGameResultsDialog,
    resetForm,
    initializeCreateForm,
  };
};
