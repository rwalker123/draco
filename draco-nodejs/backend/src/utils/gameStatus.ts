// Utility to map game status code to text
export function getGameStatusText(status: number): string {
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
}

export function getGameStatusShortText(status: number): string {
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
}
