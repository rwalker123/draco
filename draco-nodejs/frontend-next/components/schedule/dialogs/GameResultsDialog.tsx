import React from 'react';
import { Game, GameStatus } from '@/types/schedule';
import { GameResultSchema, UpdateGameResultsSchema } from '@draco/shared-schemas';
import {
  EnterGameResultsDialogGame,
  GameResultsSuccessPayload,
} from '../../EnterGameResultsDialog';
import EnterGameResultsDialog from '../../EnterGameResultsDialog';
import { getGameStatusShortText, getGameStatusText } from '@/utils/gameUtils';

const toDialogGame = (
  game: Game,
  getTeamName: (teamId: string) => string,
): EnterGameResultsDialogGame => ({
  id: game.id,
  seasonId: game.season.id,
  gameDate: game.gameDate,
  homeTeam: { id: game.homeTeamId, name: getTeamName(game.homeTeamId) },
  visitorTeam: { id: game.visitorTeamId, name: getTeamName(game.visitorTeamId) },
  homeScore: game.homeScore ?? 0,
  visitorScore: game.visitorScore ?? 0,
  gameStatus: game.gameStatus ?? GameStatus.Scheduled,
  gameStatusText: game.gameStatusText,
  leagueName: game.league?.name,
  fieldId: game.fieldId ?? null,
  fieldName: game.field?.name ?? null,
  fieldShortName: game.field?.shortName ?? null,
  recaps: [],
});

export interface ScheduleGameResultsSuccessPayload extends GameResultsSuccessPayload {
  updatedGame: Game;
}

interface GameResultsDialogProps {
  open: boolean;
  accountId: string;
  selectedGame: Game | null;
  onClose: () => void;
  onSuccess?: (payload: ScheduleGameResultsSuccessPayload) => void;
  getTeamName: (teamId: string) => string;
  timeZone: string;
}

const GameResultsDialog: React.FC<GameResultsDialogProps> = ({
  open,
  accountId,
  selectedGame,
  onClose,
  onSuccess,
  getTeamName,
  timeZone,
}) => {
  if (!selectedGame) return null;

  const handleSuccess = (payload: GameResultsSuccessPayload) => {
    if (!selectedGame) {
      return;
    }

    const updatedGame: Game = {
      ...selectedGame,
      homeScore: payload.result.homeScore,
      visitorScore: payload.result.visitorScore,
      gameStatus: payload.result.gameStatus,
      gameStatusText: getGameStatusText(payload.result.gameStatus),
      gameStatusShortText: getGameStatusShortText(payload.result.gameStatus),
    };

    onSuccess?.({
      gameId: payload.gameId,
      seasonId: payload.seasonId,
      request: payload.request,
      result: payload.result,
      updatedGame,
    });
  };

  return (
    <EnterGameResultsDialog
      open={open}
      accountId={accountId}
      game={toDialogGame(selectedGame, getTeamName)}
      onClose={onClose}
      onSuccess={handleSuccess}
      timeZone={timeZone}
    />
  );
};

export default GameResultsDialog;
