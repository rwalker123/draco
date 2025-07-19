import React from 'react';
import { Box, CircularProgress, Paper } from '@mui/material';
import GameListDisplay, { GameListSection, Game } from './GameListDisplay';
import EnterGameResultsDialog, { GameResultData } from './EnterGameResultsDialog';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { getGameStatusText } from '../utils/gameUtils';

interface TodayScoreboardProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
}

const TodayScoreboard: React.FC<TodayScoreboardProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
}) => {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editGameDialog, setEditGameDialog] = React.useState<{
    open: boolean;
    game: Game | null;
  }>({ open: false, game: null });

  const { token } = useAuth();
  const { hasRole } = useRole();
  const canEditGames =
    hasRole('Administrator') || (accountId ? hasRole('AccountAdmin', { accountId }) : false);

  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const handleSaveGameResults = async (gameData: GameResultData) => {
    if (!editGameDialog.game) return;
    setLoading(true);
    setError(null);
    try {
      // Get current seasonId as done elsewhere
      const seasonResponse = await fetch(`/api/accounts/${accountId}/seasons/current`);
      const seasonData = await seasonResponse.json();
      if (!seasonData.success) throw new Error('Failed to load current season');
      const currentSeasonId = seasonData.data.season.id;

      const url = `/api/accounts/${accountId}/seasons/${currentSeasonId}/games/${gameData.gameId}/results`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(gameData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save game results');
      }
      setEditGameDialog({ open: false, game: null });
      // Reload scoreboard data
      await loadTodayGames().then(setGames);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save game results');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to load today's games
  const loadTodayGames = React.useCallback(async () => {
    // Get current season first
    const seasonResponse = await fetch(`/api/accounts/${accountId}/seasons/current`);
    const seasonData = await seasonResponse.json();

    if (!seasonData.success) {
      throw new Error('Failed to load current season');
    }

    const currentSeasonId = seasonData.data.season.id;

    // Calculate date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Load today's games
    const response = await fetch(
      `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}${teamId ? `&teamId=${teamId}` : ''}`,
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to load games data');
    }

    // Transform the data to match the expected format
    const transformGames = (games: unknown[]): Game[] =>
      games
        .filter(
          (game): game is Record<string, unknown> => typeof game === 'object' && game !== null,
        )
        .map((game) => {
          let leagueName = 'Unknown';
          if (
            typeof game.league === 'object' &&
            game.league &&
            'name' in game.league &&
            typeof (game.league as { name?: unknown }).name === 'string'
          ) {
            leagueName = (game.league as { name: string }).name;
          }
          let fieldName: string | null = null;
          let fieldShortName: string | null = null;
          if (typeof game.field === 'object' && game.field) {
            if (
              'name' in game.field &&
              typeof (game.field as { name?: unknown }).name === 'string'
            ) {
              fieldName = (game.field as { name: string }).name;
            }
            if (
              'shortName' in game.field &&
              typeof (game.field as { shortName?: unknown }).shortName === 'string'
            ) {
              fieldShortName = (game.field as { shortName: string }).shortName;
            }
          }
          const gameStatus = typeof game.gameStatus === 'number' ? game.gameStatus : 0;
          return {
            id: String(game.id ?? ''),
            date: String(game.gameDate ?? ''),
            homeTeamId: String(game.homeTeamId ?? ''),
            awayTeamId: String(game.visitorTeamId ?? ''),
            homeTeamName: typeof game.homeTeamName === 'string' ? game.homeTeamName : 'Unknown',
            awayTeamName:
              typeof game.visitorTeamName === 'string' ? game.visitorTeamName : 'Unknown',
            homeScore: typeof game.homeScore === 'number' ? game.homeScore : 0,
            awayScore: typeof game.visitorScore === 'number' ? game.visitorScore : 0,
            gameStatus,
            gameStatusText: getGameStatusText(gameStatus),
            leagueName,
            fieldId:
              'fieldId' in game ? (game.fieldId === null ? null : String(game.fieldId)) : null,
            fieldName,
            fieldShortName,
            hasGameRecap: false, // No recaps in scoreboard
            gameRecaps: [], // No recaps in scoreboard
          };
        });

    return transformGames(data.data.games);
  }, [accountId, teamId]);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    loadTodayGames()
      .then((newGames) => {
        setGames(newGames);
      })
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accountId, teamId, loadTodayGames]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box color="error.main" p={2}>
          {error}
        </Box>
      </Paper>
    );
  }

  // Prepare section for GameListDisplay
  const sections: GameListSection[] = [{ title: 'Today', games: games }];

  return (
    <>
      <GameListDisplay
        sections={sections}
        canEditGames={canEditGames}
        onEditGame={handleEditGame}
        layout={layout}
      />
      {canEditGames && (
        <EnterGameResultsDialog
          open={editGameDialog.open}
          onClose={() => setEditGameDialog({ open: false, game: null })}
          game={
            editGameDialog.game
              ? { ...editGameDialog.game, gameRecaps: editGameDialog.game.gameRecaps ?? [] }
              : null
          }
          onSave={handleSaveGameResults}
        />
      )}
    </>
  );
};

export default TodayScoreboard;
