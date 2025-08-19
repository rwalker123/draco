/**
 * Date formatting utilities for game data and general date handling
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

/**
 * Safely formats a date value to a locale string with error handling
 * @param dateValue - Date value that can be string, Date, or other formats
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string or 'N/A' if invalid
 */
export function formatDateSafely(
  dateValue: unknown,
  options: Intl.DateTimeFormatOptions = {},
): string {
  try {
    const date = new Date(dateValue as string | number | Date);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    // Use provided options or default to locale date string
    if (Object.keys(options).length > 0) {
      return date.toLocaleDateString(undefined, options);
    }

    return date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

/**
 * Safely formats a date to a short date string (MM/DD/YYYY format)
 * @param dateValue - Date value that can be string, Date, or other formats
 * @returns Formatted date string or 'N/A' if invalid
 */
export function formatDateShort(dateValue: unknown): string {
  return formatDateSafely(dateValue, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Safely formats a date to include time information
 * @param dateValue - Date value that can be string, Date, or other formats
 * @returns Formatted date-time string or 'N/A' if invalid
 */
export function formatDateTime(dateValue: unknown): string {
  return formatDateSafely(dateValue, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Checks if a date value is valid
 * @param dateValue - Date value to validate
 * @returns true if the date is valid, false otherwise
 */
export function isValidDate(dateValue: unknown): boolean {
  try {
    const date = new Date(dateValue as string | number | Date);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

// ============================================================================
// MOVED DATE UTILITY METHODS FROM OTHER COMPONENTS
// ============================================================================

/**
 * Format date of birth for display
 */
export const formatDateOfBirth = (dateString: string | null): string => {
  if (!dateString) return '';

  try {
    // If we get a date-only string (YYYY-MM-DD), avoid timezone conversion
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    if (dateOnlyMatch) {
      const [year, month, day] = dateString.split('-').map((p) => parseInt(p, 10));
      // Format using Intl without constructing a Date in local TZ
      // Construct a UTC date to avoid off-by-one and format in UTC
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(utcDate);
    }

    // Legacy ISO timestamps (with time/Z): format in UTC to avoid shifting the day
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date | string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
