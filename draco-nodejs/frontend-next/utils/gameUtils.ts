/**
 * Converts a game status number to a human-readable string
 * @param status - The game status number
 * @returns A string representation of the game status
 */
export const getGameStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return 'Incomplete';
    case 1:
      return 'Final';
    case 2:
      return 'Rainout';
    case 3:
      return 'Postponed';
    case 4:
      return 'Forfeit';
    case 5:
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
    case 0:
      return '';
    case 1:
      return 'F';
    case 2:
      return 'R';
    case 3:
      return 'PPD';
    case 4:
      return 'FFT';
    case 5:
      return 'DNR';
    default:
      return '';
  }
};
