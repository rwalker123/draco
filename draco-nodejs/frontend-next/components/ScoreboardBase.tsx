import React from 'react';
import { Alert, Box, CircularProgress, Paper } from '@mui/material';
import GameListDisplay, { GameListSection, Game } from './GameListDisplay';
import EnterGameResultsDialog, {
  EnterGameResultsDialogGame,
  GameResultsSuccessPayload,
} from './EnterGameResultsDialog';
import { useRole } from '../context/RoleContext';
import { useAccountTimezone } from '../context/AccountContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { getGameStatusShortText, getGameStatusText } from '../utils/gameUtils';
import { GameStatus } from '../types/schedule';
import { useAuth } from '../context/AuthContext';
import { getGameSummary } from '../lib/utils';
import { useGameRecapFlow } from '../hooks/useGameRecapFlow';

interface ScoreboardBaseProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
  currentSeasonId: string;
  onGamesLoaded?: (games: Game[]) => void;
  title: string;
  loadGames: () => Promise<Game[]>;
  renderWrapper?: (
    content: React.ReactNode,
    state: 'loading' | 'error' | 'empty' | 'content',
    context: { title: string },
  ) => React.ReactNode;
}

const ScoreboardBase: React.FC<ScoreboardBaseProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
  currentSeasonId,
  onGamesLoaded,
  title,
  loadGames,
  renderWrapper,
}) => {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editGameDialog, setEditGameDialog] = React.useState<{
    open: boolean;
    game: Game | null;
  }>({ open: false, game: null });

  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const timeZone = useAccountTimezone();
  const { token } = useAuth();
  const canEditGames = isAccountAdministrator(hasRole, accountId);

  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const determineEditableTeams = React.useCallback(
    (game: Game): string[] => {
      if (game.gameStatus !== GameStatus.Completed) {
        return [];
      }

      const editableTeamIds: string[] = [];
      const isAdministrator =
        hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId);

      const canEditHome =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', game.homeTeamId) ||
        hasRoleInTeam('TeamManager', game.homeTeamId);
      const canEditVisitor =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', game.visitorTeamId) ||
        hasRoleInTeam('TeamManager', game.visitorTeamId);

      if (canEditHome) {
        editableTeamIds.push(game.homeTeamId);
      }

      if (canEditVisitor && !editableTeamIds.includes(game.visitorTeamId)) {
        editableTeamIds.push(game.visitorTeamId);
      }

      return editableTeamIds;
    },
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const fetchRecapForTeam = React.useCallback(
    async (game: Game, teamSeasonId: string): Promise<string | null> => {
      try {
        const recap = await getGameSummary({
          accountId,
          seasonId: currentSeasonId,
          gameId: game.id,
          teamSeasonId,
          token: token ?? undefined,
        });
        return recap ?? null;
      } catch (err) {
        throw err;
      }
    },
    [accountId, currentSeasonId, token],
  );

  const handleRecapSaved = React.useCallback(
    (game: Game, teamSeasonId: string, recap: string) => {
      setGames((previous) => {
        const updated = previous.map((entry) => {
          if (entry.id !== game.id) {
            return entry;
          }

          const updatedRecaps = [
            ...(entry.gameRecaps?.filter((existing) => existing.teamId !== teamSeasonId) ?? []),
            { teamId: teamSeasonId, recap },
          ];

          return {
            ...entry,
            hasGameRecap: updatedRecaps.length > 0,
            gameRecaps: updatedRecaps,
          };
        });

        onGamesLoaded?.(updated);
        return updated;
      });
    },
    [onGamesLoaded],
  );

  const {
    openEditRecap,
    openViewRecap,
    dialogs: recapDialogs,
    error: recapError,
    clearError: clearRecapError,
    canEditRecap,
  } = useGameRecapFlow<Game>({
    accountId,
    seasonId: currentSeasonId,
    fetchRecap: fetchRecapForTeam,
    determineEditableTeams,
    getTeamName: (game, teamSeasonId) =>
      teamSeasonId === game.homeTeamId ? game.homeTeamName : game.visitorTeamName,
    onRecapSaved: handleRecapSaved,
  });

  const handleOpenEditRecap = React.useCallback(
    (game: Game) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[ScoreboardBase] openEditRecap click', {
          gameId: game.id,
          homeTeamId: game.homeTeamId,
          visitorTeamId: game.visitorTeamId,
          hasGameRecap: game.hasGameRecap,
          availableRecaps: game.gameRecaps?.map((entry) => entry.teamId),
        });
      }
      openEditRecap(game);
    },
    [openEditRecap],
  );

  const handleOpenViewRecap = React.useCallback(
    (game: Game) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[ScoreboardBase] openViewRecap click', {
          gameId: game.id,
          homeTeamId: game.homeTeamId,
          visitorTeamId: game.visitorTeamId,
          hasGameRecap: game.hasGameRecap,
          availableRecaps: game.gameRecaps?.map((entry) => entry.teamId),
        });
      }
      openViewRecap(game);
    },
    [openViewRecap],
  );

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
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accountId, teamId, currentSeasonId, loadGames, onGamesLoaded]);

  const sections = React.useMemo<GameListSection[]>(() => [{ title, games }], [title, games]);

  const applyWrapper =
    renderWrapper ??
    ((content: React.ReactNode, state: 'loading' | 'error' | 'empty' | 'content') => {
      if (state === 'empty') {
        return null;
      }
      if (state === 'loading') {
        return (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {content}
          </Paper>
        );
      }
      if (state === 'error') {
        return (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {content}
          </Paper>
        );
      }
      return content;
    });

  if (loading) {
    return applyWrapper(
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>,
      'loading',
      { title },
    );
  }

  if (error) {
    return applyWrapper(<Alert severity="error">{error}</Alert>, 'error', { title });
  }

  if (games.length === 0) {
    return applyWrapper(null, 'empty', { title });
  }

  const content = (
    <>
      {recapError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearRecapError}>
          {recapError}
        </Alert>
      )}
      <GameListDisplay
        sections={sections}
        canEditGames={canEditGames}
        onEnterGameResults={handleEditGame}
        canEditRecap={canEditRecap}
        onEditRecap={handleOpenEditRecap}
        onViewRecap={handleOpenViewRecap}
        layout={layout}
        timeZone={timeZone}
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
      {recapDialogs}
    </>
  );

  return applyWrapper(content, 'content', { title });
};

export default ScoreboardBase;
