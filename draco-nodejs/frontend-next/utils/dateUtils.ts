/**
 * Date formatting utilities for game data
 */

/**
 * Creates a formatted date-time string for game data
 * @param gameDate - The game date
 * @param gameTime - The game time
 * @returns A formatted ISO string without timezone manipulation
 */
export const formatGameDateTime = (gameDate: Date, gameTime: Date): string => {
  const gameYear = gameDate.getFullYear();
  const gameMonth = String(gameDate.getMonth() + 1).padStart(2, '0');
  const gameDay = String(gameDate.getDate()).padStart(2, '0');
  const gameHours = String(gameTime.getHours()).padStart(2, '0');
  const gameMinutes = String(gameTime.getMinutes()).padStart(2, '0');

  return `${gameYear}-${gameMonth}-${gameDay}T${gameHours}:${gameMinutes}:00`;
};

/**
 * Converts a game date string to formatted local time
 * @param dateString - The game date string
 * @returns Formatted time string or 'TBD' if invalid
 */
export const formatGameTime = (dateString: string): string => {
  try {
    if (dateString) {
      const localDateString = dateString.replace('Z', '');
      const dateObj = new Date(localDateString);
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return 'TBD';
    }
  } catch {
    return 'TBD';
  }
};
