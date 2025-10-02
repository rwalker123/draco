import React from 'react';
import { Box, CircularProgress, Paper } from '@mui/material';
import GameListDisplay, { GameListSection, Game } from './GameListDisplay';
import EnterGameResultsDialog, { GameResultData } from './EnterGameResultsDialog';
import { useRole } from '../context/RoleContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { useApiClient } from '../hooks/useApiClient';
import { updateGameResults } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';

interface ScoreboardBaseProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
  currentSeasonId: string;
  onGamesLoaded?: (games: Game[]) => void;
  title: string;
  loadGames: () => Promise<Game[]>;
}

const ScoreboardBase: React.FC<ScoreboardBaseProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
  currentSeasonId,
  onGamesLoaded,
  title,
  loadGames,
}) => {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editGameDialog, setEditGameDialog] = React.useState<{
    open: boolean;
    game: Game | null;
  }>({ open: false, game: null });

  const { hasRole } = useRole();
  const canEditGames = isAccountAdministrator(hasRole, accountId);
  const apiClient = useApiClient();

  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const handleSaveGameResults = async (gameData: GameResultData) => {
    if (!editGameDialog.game) return;
    setLoading(true);
    setError(null);
    try {
      const result = await updateGameResults({
        client: apiClient,
        path: {
          accountId,
          seasonId: currentSeasonId,
          gameId: gameData.gameId,
        },
        body: {
          homeScore: gameData.homeScore,
          visitorScore: gameData.awayScore,
          gameStatus: gameData.gameStatus,
          emailPlayers: gameData.emailPlayers,
          postToTwitter: gameData.postToTwitter,
          postToBluesky: gameData.postToBluesky,
          postToFacebook: gameData.postToFacebook,
        },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to save game results');
      setEditGameDialog({ open: false, game: null });
      // Reload scoreboard data
      await loadGames().then(setGames);
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

  React.useEffect(() => {
    if (!accountId) return;

    setLoading(true);
    setError(null);

    loadGames()
      .then((newGames) => {
        setGames(newGames);
        if (onGamesLoaded) onGamesLoaded(newGames);
      })
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accountId, teamId, currentSeasonId, loadGames, onGamesLoaded]);

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

  // Don't render anything if there are no games
  if (games.length === 0) {
    return null;
  }

  // Prepare section for GameListDisplay
  const sections: GameListSection[] = [{ title, games: games }];

  return (
    <>
      <GameListDisplay
        sections={sections}
        canEditGames={canEditGames}
        onEnterGameResults={handleEditGame}
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

export default ScoreboardBase;
