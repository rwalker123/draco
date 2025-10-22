import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from '@mui/material';
import GameListDisplay, { GameListSection, Game } from './GameListDisplay';
import EnterGameResultsDialog, {
  EnterGameResultsDialogGame,
  GameResultsSuccessPayload,
} from './EnterGameResultsDialog';
import { useRole } from '../context/RoleContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { getGameStatusShortText, getGameStatusText } from '../utils/gameUtils';
import EnterGameRecapDialog from './EnterGameRecapDialog';
import { GameStatus } from '../types/schedule';
import { useAuth } from '../context/AuthContext';
import { getGameSummary } from '../lib/utils';
import type { UpsertGameRecapType } from '@draco/shared-schemas';

type TeamOption = {
  id: string;
  name: string;
};

type PendingRecapAction =
  | {
      mode: 'edit';
      game: Game;
      teamOptions: TeamOption[];
    }
  | {
      mode: 'view';
      game: Game;
      teamOptions: TeamOption[];
      availableRecaps: Array<{ teamId: string; recap: string }>;
    };

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
  const [recapDialogOpen, setRecapDialogOpen] = React.useState(false);
  const [recapSelectedGame, setRecapSelectedGame] = React.useState<Game | null>(null);
  const [recapTeamSeasonId, setRecapTeamSeasonId] = React.useState<string | null>(null);
  const [recapInitialRecap, setRecapInitialRecap] = React.useState('');
  const [recapReadOnly, setRecapReadOnly] = React.useState(false);
  const [recapErrorMessage, setRecapErrorMessage] = React.useState<string | null>(null);
  const [recapLoading, setRecapLoading] = React.useState(false);
  const [pendingRecapAction, setPendingRecapAction] = React.useState<PendingRecapAction | null>(
    null,
  );

  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const { token } = useAuth();
  const canEditGames = isAccountAdministrator(hasRole, accountId);
  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const canEditRecap = React.useCallback(
    (game: Game): boolean => {
      if (game.gameStatus !== GameStatus.Completed) {
        return false;
      }

      if (hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId)) {
        return true;
      }

      const canEditHome =
        hasRoleInTeam('TeamAdmin', game.homeTeamId) ||
        hasRoleInTeam('TeamManager', game.homeTeamId);
      const canEditVisitor =
        hasRoleInTeam('TeamAdmin', game.visitorTeamId) ||
        hasRoleInTeam('TeamManager', game.visitorTeamId);

      return canEditHome || canEditVisitor;
    },
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const determineEditableTeams = React.useCallback(
    (game: Game): TeamOption[] => {
      if (game.gameStatus !== GameStatus.Completed) {
        return [];
      }

      const isAdministrator =
        hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId);

      const options: TeamOption[] = [];

      const canEditHome =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', game.homeTeamId) ||
        hasRoleInTeam('TeamManager', game.homeTeamId);
      const canEditVisitor =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', game.visitorTeamId) ||
        hasRoleInTeam('TeamManager', game.visitorTeamId);

      if (canEditHome) {
        options.push({ id: game.homeTeamId, name: game.homeTeamName });
      }

      if (canEditVisitor) {
        if (!options.some((option) => option.id === game.visitorTeamId)) {
          options.push({ id: game.visitorTeamId, name: game.visitorTeamName });
        }
      }

      return options;
    },
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const loadRecap = React.useCallback(
    async (game: Game, teamSeasonId: string) => {
      setRecapLoading(true);
      try {
        const recap = await getGameSummary({
          accountId,
          seasonId: currentSeasonId,
          gameId: game.id,
          teamSeasonId,
          token: token ?? undefined,
        });
        setRecapInitialRecap(recap || '');
        setRecapErrorMessage(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load game summary';
        if (
          message.toLowerCase().includes('no recap found') ||
          message.toLowerCase().includes('not found')
        ) {
          setRecapInitialRecap('');
          setRecapErrorMessage(null);
        } else {
          setRecapErrorMessage(message);
        }
      } finally {
        setRecapLoading(false);
      }
    },
    [accountId, currentSeasonId, token],
  );

  const openRecapDialog = React.useCallback(
    (game: Game, teamSeasonId: string, options: { readOnly: boolean; initialRecap?: string }) => {
      setRecapSelectedGame(game);
      setRecapTeamSeasonId(teamSeasonId);
      setRecapReadOnly(options.readOnly);
      setRecapInitialRecap(options.initialRecap ?? '');
      setRecapErrorMessage(null);
      setRecapDialogOpen(true);
      setRecapLoading(false);

      if (options.initialRecap === undefined) {
        void loadRecap(game, teamSeasonId);
      }
    },
    [loadRecap],
  );

  const handleEditGameRecap = React.useCallback(
    (game: Game) => {
      const editableTeams = determineEditableTeams(game);

      if (editableTeams.length === 0) {
        setRecapErrorMessage('You do not have permission to edit this game recap.');
        return;
      }

      if (editableTeams.length === 1) {
        openRecapDialog(game, editableTeams[0].id, { readOnly: false });
        return;
      }

      setPendingRecapAction({
        mode: 'edit',
        game,
        teamOptions: editableTeams,
      });
    },
    [determineEditableTeams, openRecapDialog],
  );

  const handleViewGameRecap = React.useCallback(
    async (game: Game) => {
      if (!game.hasGameRecap) {
        setRecapErrorMessage('No recap available for this game.');
        return;
      }

      const candidateTeams: TeamOption[] = [
        { id: game.homeTeamId, name: game.homeTeamName },
        { id: game.visitorTeamId, name: game.visitorTeamName },
      ];

      setRecapLoading(true);
      try {
        const results = await Promise.all(
          candidateTeams.map(async (team) => {
            try {
              const recap = await getGameSummary({
                accountId,
                seasonId: currentSeasonId,
                gameId: game.id,
                teamSeasonId: team.id,
                token: token ?? undefined,
              });
              return recap !== undefined && recap !== null
                ? { teamId: team.id, teamName: team.name, recap }
                : null;
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to load game summary';
              if (
                message.toLowerCase().includes('no recap found') ||
                message.toLowerCase().includes('not found')
              ) {
                return null;
              }
              throw err;
            }
          }),
        );

        const available = results.filter(
          (value): value is { teamId: string; teamName: string; recap: string } => value !== null,
        );

        if (available.length === 0) {
          setRecapErrorMessage('No recap available for this game.');
          return;
        }

        if (available.length === 1) {
          const recap = available[0];
          openRecapDialog(game, recap.teamId, {
            readOnly: true,
            initialRecap: recap.recap,
          });
          return;
        }

        setPendingRecapAction({
          mode: 'view',
          game,
          teamOptions: available.map(({ teamId, teamName }) => ({ id: teamId, name: teamName })),
          availableRecaps: available.map(({ teamId, recap }) => ({ teamId, recap })),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load game summary';
        setRecapErrorMessage(message);
      } finally {
        setRecapLoading(false);
      }
    },
    [accountId, currentSeasonId, openRecapDialog, token],
  );

  const handleTeamSelection = React.useCallback(
    (teamId: string) => {
      if (!pendingRecapAction) {
        return;
      }

      if (pendingRecapAction.mode === 'edit') {
        openRecapDialog(pendingRecapAction.game, teamId, { readOnly: false });
      } else {
        const recap = pendingRecapAction.availableRecaps.find((entry) => entry.teamId === teamId);
        openRecapDialog(pendingRecapAction.game, teamId, {
          readOnly: true,
          initialRecap: recap?.recap ?? '',
        });
      }

      setPendingRecapAction(null);
    },
    [openRecapDialog, pendingRecapAction],
  );

  const handleCloseRecapDialog = React.useCallback(() => {
    setRecapDialogOpen(false);
    setRecapSelectedGame(null);
    setRecapTeamSeasonId(null);
    setRecapInitialRecap('');
    setRecapReadOnly(false);
    setRecapLoading(false);
  }, []);

  const handleRecapSuccess = React.useCallback(
    (result: UpsertGameRecapType) => {
      if (!recapSelectedGame || !recapTeamSeasonId) {
        return;
      }

      setGames((prevGames) => {
        const updatedGames = prevGames.map((gameItem) => {
          if (gameItem.id !== recapSelectedGame.id) {
            return gameItem;
          }

          const updatedRecaps = [
            ...(gameItem.gameRecaps?.filter((recap) => recap.teamId !== recapTeamSeasonId) ?? []),
            { teamId: recapTeamSeasonId, recap: result.recap },
          ];

          return {
            ...gameItem,
            hasGameRecap: updatedRecaps.length > 0,
            gameRecaps: updatedRecaps,
          };
        });

        onGamesLoaded?.(updatedGames);
        return updatedGames;
      });
    },
    [onGamesLoaded, recapSelectedGame, recapTeamSeasonId],
  );

  const selectedTeamName = React.useMemo(() => {
    if (!recapSelectedGame || !recapTeamSeasonId) {
      return undefined;
    }

    if (recapSelectedGame.homeTeamId === recapTeamSeasonId) {
      return recapSelectedGame.homeTeamName;
    }

    if (recapSelectedGame.visitorTeamId === recapTeamSeasonId) {
      return recapSelectedGame.visitorTeamName;
    }

    return undefined;
  }, [recapSelectedGame, recapTeamSeasonId]);

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

  const sections = React.useMemo<GameListSection[]>(() => [{ title, games }], [title, games]);

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

  return (
    <>
      {recapErrorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRecapErrorMessage(null)}>
          {recapErrorMessage}
        </Alert>
      )}
      <GameListDisplay
        sections={sections}
        canEditGames={canEditGames}
        onEnterGameResults={handleEditGame}
        canEditRecap={canEditRecap}
        onEditRecap={handleEditGameRecap}
        onViewRecap={handleViewGameRecap}
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
      <EnterGameRecapDialog
        open={recapDialogOpen}
        onClose={handleCloseRecapDialog}
        accountId={accountId}
        seasonId={currentSeasonId}
        gameId={recapSelectedGame?.id ?? ''}
        teamSeasonId={recapTeamSeasonId ?? ''}
        initialRecap={recapInitialRecap}
        teamName={selectedTeamName}
        gameDate={recapSelectedGame?.date}
        homeScore={recapSelectedGame?.homeScore}
        visitorScore={recapSelectedGame?.visitorScore}
        homeTeamName={recapSelectedGame?.homeTeamName}
        visitorTeamName={recapSelectedGame?.visitorTeamName}
        readOnly={recapReadOnly}
        onSuccess={handleRecapSuccess}
        onError={(message) => setRecapErrorMessage(message)}
        loading={recapLoading}
      />
      <Dialog
        open={Boolean(pendingRecapAction)}
        onClose={() => setPendingRecapAction(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {pendingRecapAction?.mode === 'edit'
            ? 'Select Team to Manage Recap'
            : 'Select Team Recap to View'}
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {pendingRecapAction?.teamOptions.map((team) => (
              <ListItemButton
                key={team.id}
                onClick={() => handleTeamSelection(team.id)}
                disabled={recapLoading}
              >
                <ListItemText primary={team.name} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRecapAction(null)} disabled={recapLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScoreboardBase;
