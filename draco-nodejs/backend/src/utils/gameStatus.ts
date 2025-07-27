import { GameStatus } from '../types/gameEnums';

// Utility to map game status code to text
export function getGameStatusText(status: number): string {
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
}

export function getGameStatusShortText(status: number): string {
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
}
