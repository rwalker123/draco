import { GameStatus } from '../types/schedule';

/**
 * Converts a game status number to a human-readable string
 * @param status - The game status number
 * @returns A string representation of the game status
 */
export const getGameStatusText = (status: number): string => {
  switch (status) {
    case GameStatus.Scheduled:
      return 'Incomplete';
    case GameStatus.Completed:
      return 'Final';
    case GameStatus.Rainout:
      return 'Rainout';
    case GameStatus.Postponed:
      return 'Postponed';
    case GameStatus.Forfeit:
      return 'Forfeit';
    case GameStatus.DidNotReport:
      return 'Did Not Report';
    default:
      return 'Unknown';
  }
};

/**
 * Converts a game status number to a short abbreviation for display
 * @param status - The game status number
 * @returns A short string abbreviation of the game status
 */
export const getGameStatusShortText = (status: number): string => {
  switch (status) {
    case GameStatus.Scheduled:
      return '';
    case GameStatus.Completed:
      return 'F';
    case GameStatus.Rainout:
      return 'R';
    case GameStatus.Postponed:
      return 'PPD';
    case GameStatus.Forfeit:
      return 'FFT';
    case GameStatus.DidNotReport:
      return 'DNR';
    default:
      return '';
  }
};

/**
 * Converts a game type number to a human-readable string
 * @param gameType - The game type number or string
 * @returns A string representation of the game type
 */
export const getGameTypeText = (gameType: number | string): string => {
  switch (Number(gameType)) {
    case 0:
      return 'Regular Season';
    case 1:
      return 'Playoff';
    case 2:
      return 'Championship';
    default:
      return 'Unknown';
  }
};
