import { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { Game, GameFormState, GameType } from '@/types/schedule';
import { formatGameDateTime } from '../../../utils/dateUtils';

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
  const { token } = useAuth();
  const { fetchCurrentSeason } = useCurrentSeason(accountId);

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

      // Create ISO string without timezone manipulation
      const gameDateString = formatGameDateTime(gameDate, gameTime);

      const requestData = {
        leagueSeasonId: dialogLeagueSeason,
        gameDate: gameDateString,
        homeTeamId,
        visitorTeamId,
        fieldId: fieldId || null,
        comment,
        gameType,
        umpire1: umpire1 || null,
        umpire2: umpire2 || null,
        umpire3: umpire3 || null,
        umpire4: umpire4 || null,
      };

      const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create game (${response.status})`);
      }

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
    token,
    fetchCurrentSeason,
    loadGamesData,
    setSuccess,
    resetForm,
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

      // Create ISO string without timezone manipulation
      const gameDateString = formatGameDateTime(gameDate, gameTime);

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${selectedGame.season.id}/games/${selectedGame.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameDate: gameDateString,
            homeTeamId,
            visitorTeamId,
            fieldId: fieldId || null,
            comment,
            gameType,
            umpire1: umpire1 || null,
            umpire2: umpire2 || null,
            umpire3: umpire3 || null,
            umpire4: umpire4 || null,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update game');
      }

      setSuccess('Game updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadGamesData();
    } catch (err) {
      setEditDialogError(err instanceof Error ? err.message : 'Failed to update game');
    }
  }, [formState, selectedGame, accountId, token, loadGamesData, setSuccess, resetForm]);

  // Delete game
  const handleDeleteGame = useCallback(async () => {
    try {
      if (!selectedGame) return;

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${selectedGame.season.id}/games/${selectedGame.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          setDeleteDialogOpen(false);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete game');
      }

      setSuccess('Game deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      loadGamesData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      setDeleteDialogOpen(false);
    }
  }, [selectedGame, accountId, token, loadGamesData, setSuccess, setError]);

  // Save game results
  const handleSaveGameResults = useCallback(
    async (gameResultData: GameResultData) => {
      if (!selectedGameForResults) {
        throw new Error('No game selected for results');
      }

      const requestBody = {
        homeScore: gameResultData.homeScore,
        awayScore: gameResultData.awayScore,
        gameStatus: gameResultData.gameStatus,
        emailPlayers: gameResultData.emailPlayers,
        postToTwitter: gameResultData.postToTwitter,
        postToBluesky: gameResultData.postToBluesky,
        postToFacebook: gameResultData.postToFacebook,
      };

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${selectedGameForResults.season.id}/games/${selectedGameForResults.id}/results`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save game results');
      }

      setSuccess('Game results saved successfully');
      setGameResultsDialogOpen(false);
      setSelectedGameForResults(null);
      loadGamesData();
    },
    [selectedGameForResults, accountId, token, loadGamesData, setSuccess],
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
