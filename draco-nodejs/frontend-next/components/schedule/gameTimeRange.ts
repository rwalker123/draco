export const GAME_TIME_MIN_HOUR = 9;
export const GAME_TIME_MAX_HOUR = 21;

const formatHourLabel = (hour: number): string => {
  const period = hour < 12 ? 'AM' : 'PM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:00 ${period}`;
};

export const GAME_TIME_RANGE_MESSAGE = `Game time must be between ${formatHourLabel(
  GAME_TIME_MIN_HOUR,
)} and ${formatHourLabel(GAME_TIME_MAX_HOUR)}`;

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
