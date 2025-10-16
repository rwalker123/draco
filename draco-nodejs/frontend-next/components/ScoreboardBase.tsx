import React from 'react';
import { Box, CircularProgress, Paper } from '@mui/material';
import GameListDisplay, { GameListSection, Game } from './GameListDisplay';
import EnterGameResultsDialog, {
  EnterGameResultsDialogGame,
  GameResultsSuccessPayload,
} from './EnterGameResultsDialog';
import { useRole } from '../context/RoleContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { getGameStatusShortText, getGameStatusText } from '../utils/gameUtils';

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
  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const mapGameToDialogGame = (gameData: Game): EnterGameResultsDialogGame => ({
    id: gameData.id,
    seasonId: currentSeasonId,
    gameDate: gameData.date,
    homeTeam: { id: gameData.homeTeamId, name: gameData.homeTeamName },
    visitorTeam: { id: gameData.visitorTeamId, name: gameData.visitorTeamName },
    homeScore: gameData.homeScore,
    visitorScore: gameData.visitorScore,
    gameStatus: gameData.gameStatus,
    gameStatusText: gameData.gameStatusText,
    leagueName: gameData.leagueName,
    fieldId: gameData.fieldId,
    fieldName: gameData.fieldName,
    fieldShortName: gameData.fieldShortName,
    recaps:
      gameData.gameRecaps?.map((recap) => ({
        team: { id: recap.teamId },
        recap: recap.recap,
      })) ?? [],
  });

  const handleDialogSuccess = (payload: GameResultsSuccessPayload) => {
    setGames((prevGames) => {
      const updatedGames = prevGames.map((gameItem) => {
        if (gameItem.id !== payload.gameId) {
          return gameItem;
        }

        return {
          ...gameItem,
          homeScore: payload.result.homeScore,
          visitorScore: payload.result.visitorScore,
          gameStatus: payload.result.gameStatus,
          gameStatusText: getGameStatusText(payload.result.gameStatus),
          gameStatusShortText: getGameStatusShortText(payload.result.gameStatus),
        };
      });

      if (onGamesLoaded) {
        onGamesLoaded(updatedGames);
      }

      return updatedGames;
    });

    setEditGameDialog({ open: false, game: null });
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
          accountId={accountId}
          onClose={() => setEditGameDialog({ open: false, game: null })}
          game={editGameDialog.game ? mapGameToDialogGame(editGameDialog.game) : null}
          onSuccess={handleDialogSuccess}
        />
      )}
    </>
  );
};

export default ScoreboardBase;
