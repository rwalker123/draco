import React from 'react';
import { Game, GameStatus } from '@/types/schedule';
import EnterGameResultsDialog from '../../EnterGameResultsDialog';

// Convert schedule Game type to dialog Game type
const convertGameForDialog = (game: Game) => ({
  id: game.id,
  date: game.gameDate,
  homeTeamId: game.homeTeamId,
  awayTeamId: game.visitorTeamId, // Convert visitorTeamId to awayTeamId
  homeTeamName: '', // Will be filled by getTeamName
  awayTeamName: '', // Will be filled by getTeamName
  homeScore: game.homeScore || 0,
  awayScore: game.visitorScore || 0,
  gameStatus: game.gameStatus || GameStatus.Scheduled,
  gameStatusText: '',
  leagueName: game.league?.name || '',
  fieldId: game.fieldId || null,
  fieldName: game.field?.name || null,
  fieldShortName: game.field?.shortName || null,
  hasGameRecap: false,
  gameRecaps: [],
});

interface GameResultsDialogProps {
  open: boolean;
  selectedGame: Game | null;
  onClose: () => void;
  onSave: (gameId: string, results: unknown) => void;
  getTeamName: (teamId: string) => string;
}

const GameResultsDialog: React.FC<GameResultsDialogProps> = ({
  open,
  selectedGame,
  onClose,
  onSave,
  getTeamName,
}) => {
  if (!selectedGame) return null;

  const handleSave = async (results: unknown) => {
    onSave(selectedGame.id, results);
  };

  // Convert the game and add team names
  const convertedGame = convertGameForDialog(selectedGame);
  convertedGame.homeTeamName = getTeamName(selectedGame.homeTeamId);
  convertedGame.awayTeamName = getTeamName(selectedGame.visitorTeamId);

  return (
    <EnterGameResultsDialog
      open={open}
      game={convertedGame}
      onClose={onClose}
      onSave={handleSave}
    />
  );
};

export default GameResultsDialog;
