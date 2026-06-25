export const GAME_TIME_MIN_HOUR = 9;
export const GAME_TIME_MAX_HOUR = 21;
export const GAME_TIME_RANGE_MESSAGE = 'Game time must be between 9:00 AM and 9:00 PM';

export const isGameTimeWithinAllowedRange = (gameTime: Date): boolean => {
  const hour = gameTime.getHours();
  const minute = gameTime.getMinutes();

  if (hour < GAME_TIME_MIN_HOUR) {
    return false;
  }

  if (hour > GAME_TIME_MAX_HOUR || (hour === GAME_TIME_MAX_HOUR && minute > 0)) {
    return false;
  }

  return true;
};
