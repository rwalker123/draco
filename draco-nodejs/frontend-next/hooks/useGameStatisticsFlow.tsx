import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MuiButton from '@mui/material/Button';
import GameStatisticsDialog from '../components/GameStatisticsDialog';
import { GameStatus } from '@/types/schedule';

export interface StatisticsGameBase {
  id: string;
  homeTeamId: string;
  homeTeamName?: string;
  visitorTeamId: string;
  visitorTeamName?: string;
  teamsWithStats?: string[];
  gameStatus?: number;
  date?: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  seasonId?: string;
  season?: {
    id?: string | null;
  } | null;
}

interface StatisticsSelectionOption {
  id: string;
  name: string;
}

interface StatisticsSelectionState<GameType extends StatisticsGameBase> {
  game: GameType;
  options: StatisticsSelectionOption[];
}

interface StatisticsDialogState<GameType extends StatisticsGameBase> {
  game: GameType;
  teamSeasonId: string;
  teamName: string;
  seasonId: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  homeTeamName?: string;
  visitorTeamName?: string;
}

export interface UseGameStatisticsFlowParams<GameType extends StatisticsGameBase> {
  accountId: string;
  seasonId?: string;
  resolveSeasonId?: (game: GameType) => string | null | undefined;
  getTeamName?: (game: GameType, teamSeasonId: string) => string;
}

export interface UseGameStatisticsFlowResult<GameType extends StatisticsGameBase> {
  openViewStatistics: (game: GameType) => void;
  dialogs: React.ReactNode;
  error: string | null;
  clearError: () => void;
}

export function useGameStatisticsFlow<GameType extends StatisticsGameBase>(
  params: UseGameStatisticsFlowParams<GameType>,
): UseGameStatisticsFlowResult<GameType> {
  const { accountId, seasonId, resolveSeasonId, getTeamName } = params;

  const [dialogState, setDialogState] = useState<StatisticsDialogState<GameType> | null>(null);
  const [selectionState, setSelectionState] = useState<StatisticsSelectionState<GameType> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const deriveSeasonId = (game: GameType): string | null => {
    if (resolveSeasonId) {
      const resolved = resolveSeasonId(game);
      if (resolved) {
        return resolved;
      }
    }
    if (seasonId) {
      return seasonId;
    }
    if (game.seasonId) {
      return game.seasonId;
    }
    if (game.season && game.season.id) {
      return game.season.id || null;
    }
    return null;
  };

  const resolveTeamName = (game: GameType, teamSeasonId: string): string => {
    if (getTeamName) {
      return getTeamName(game, teamSeasonId);
    }
    if (teamSeasonId === game.homeTeamId) {
      return game.homeTeamName ?? 'Home Team';
    }
    if (teamSeasonId === game.visitorTeamId) {
      return game.visitorTeamName ?? 'Visitor Team';
    }
    return 'Team';
  };

  const resolveGameDate = (game: GameType): string | undefined => game.gameDate ?? game.date;

  const openDialog = (game: GameType, teamSeasonId: string) => {
    const seasonIdentifier = deriveSeasonId(game);
    if (!seasonIdentifier) {
      setError('Missing season information for the selected game.');
      return;
    }

    setSelectionState(null);
    setError(null);
    setDialogState({
      game,
      teamSeasonId,
      teamName: resolveTeamName(game, teamSeasonId),
      seasonId: seasonIdentifier,
      gameDate: resolveGameDate(game),
      homeScore: typeof game.homeScore === 'number' ? game.homeScore : undefined,
      visitorScore: typeof game.visitorScore === 'number' ? game.visitorScore : undefined,
      homeTeamName: game.homeTeamName ?? resolveTeamName(game, game.homeTeamId),
      visitorTeamName: game.visitorTeamName ?? resolveTeamName(game, game.visitorTeamId),
    });
  };

  const openViewStatistics = (game: GameType) => {
    if (
      game.gameStatus !== undefined &&
      game.gameStatus !== null &&
      game.gameStatus !== GameStatus.Completed
    ) {
      setError('Statistics are only available for completed games.');
      return;
    }

    const orderedTeamIds = [game.homeTeamId, game.visitorTeamId];
    const teamsWithStats = new Set(game.teamsWithStats ?? []);
    const eligibleTeamIds = orderedTeamIds.filter((teamId) => teamsWithStats.has(teamId));

    if (eligibleTeamIds.length === 0) {
      setError('No statistics available for this game.');
      return;
    }

    if (eligibleTeamIds.length === 1) {
      openDialog(game, eligibleTeamIds[0]);
      return;
    }

    setSelectionState({
      game,
      options: eligibleTeamIds.map((teamId) => ({
        id: teamId,
        name: resolveTeamName(game, teamId),
      })),
    });
  };

  const handleSelection = (teamSeasonId: string) => {
    if (!selectionState) {
      return;
    }
    openDialog(selectionState.game, teamSeasonId);
  };

  const clearError = () => setError(null);

  const dialogs = (
    <>
      {dialogState && (
        <GameStatisticsDialog
          open={Boolean(dialogState)}
          onClose={() => setDialogState(null)}
          accountId={accountId}
          seasonId={dialogState.seasonId}
          gameId={dialogState.game.id}
          teamSeasonId={dialogState.teamSeasonId}
          teamName={dialogState.teamName}
          gameDate={dialogState.gameDate}
          homeScore={dialogState.homeScore}
          visitorScore={dialogState.visitorScore}
          homeTeamName={dialogState.homeTeamName}
          visitorTeamName={dialogState.visitorTeamName}
        />
      )}
      {selectionState && (
        <Dialog open onClose={() => setSelectionState(null)} fullWidth maxWidth="xs">
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: (theme) => theme.palette.widget.headerText,
            }}
          >
            Select Team Statistics to View
          </DialogTitle>
          <DialogContent dividers>
            <List>
              {selectionState.options.map((option) => (
                <ListItemButton key={option.id} onClick={() => handleSelection(option.id)}>
                  <ListItemText primary={option.name} secondary="View statistics" />
                </ListItemButton>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <MuiButton onClick={() => setSelectionState(null)}>Cancel</MuiButton>
          </DialogActions>
        </Dialog>
      )}
    </>
  );

  return {
    openViewStatistics,
    dialogs,
    error,
    clearError,
  };
}
