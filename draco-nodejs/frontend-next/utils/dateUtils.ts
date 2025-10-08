import { DEFAULT_TIMEZONE } from './timezones';

/**
 * Date formatting utilities for game data and general date handling
 */

const DEFAULT_LOCALE = undefined;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null;

type CompleteDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const padNumber = (value: number): string => String(value).padStart(2, '0');

const getDateTimePartsInTimezone = (
  dateValue: string | number | Date,
  timeZone: string,
): DateTimeParts => {
  const date = new Date(dateValue as string | number | Date);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const requiredParts = ['year', 'month', 'day', 'hour', 'minute', 'second'] as const;
  const hasAllParts = requiredParts.every((part) => parts[part] !== undefined);

  if (!hasAllParts) {
    return null;
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const buildDateFromParts = (parts: CompleteDateTimeParts): Date => {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0,
  );
};

const convertZonedPartsToUTCDate = (parts: CompleteDateTimeParts, timeZone: string): Date => {
  let naiveUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  for (let i = 0; i < 3; i++) {
    const zonedParts = getDateTimePartsInTimezone(new Date(naiveUtc), timeZone);
    if (!zonedParts) {
      break;
    }

    const matchesTarget =
      zonedParts.year === parts.year &&
      zonedParts.month === parts.month &&
      zonedParts.day === parts.day &&
      zonedParts.hour === parts.hour &&
      zonedParts.minute === parts.minute &&
      zonedParts.second === parts.second;

    if (matchesTarget) {
      break;
    }

    const zonedUtc = Date.UTC(
      zonedParts.year,
      zonedParts.month - 1,
      zonedParts.day,
      zonedParts.hour,
      zonedParts.minute,
      zonedParts.second,
    );

    const diff = naiveUtc - zonedUtc;
    naiveUtc += diff;
  }

  return new Date(naiveUtc);
};

/**
 * Creates a formatted UTC date-time string for game data based on the provided timezone
 * @param gameDate - The selected game date (interpreted in the provided timezone)
 * @param gameTime - The selected game time (interpreted in the provided timezone)
 * @param timeZone - The account timezone to interpret the date/time
 * @returns A formatted UTC string (YYYY-MM-DDTHH:MM:SS) suitable for backend APIs
 */
export const formatGameDateTime = (
  gameDate: Date,
  gameTime: Date,
  timeZone: string = DEFAULT_TIMEZONE,
): string => {
  const parts: CompleteDateTimeParts = {
    year: gameDate.getFullYear(),
    month: gameDate.getMonth() + 1,
    day: gameDate.getDate(),
    hour: gameTime.getHours(),
    minute: gameTime.getMinutes(),
    second: 0,
  };

  const utcDate = convertZonedPartsToUTCDate(parts, timeZone);

  const year = utcDate.getUTCFullYear();
  const month = padNumber(utcDate.getUTCMonth() + 1);
  const day = padNumber(utcDate.getUTCDate());
  const hours = padNumber(utcDate.getUTCHours());
  const minutes = padNumber(utcDate.getUTCMinutes());
  const seconds = padNumber(utcDate.getUTCSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
};

/**
 * Converts a game date string to formatted local time
 * @param dateString - The game date string
 * @returns Formatted time string or 'TBD' if invalid
 */
export const formatGameTime = (dateString: string, timeZone: string = DEFAULT_TIMEZONE): string => {
  try {
    if (dateString) {
      return formatTimeInTimezone(dateString, timeZone, {
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

export function convertUTCToZonedDate(
  dateValue: string | number | Date,
  timeZone: string,
): Date | null {
  const parts = getDateTimePartsInTimezone(dateValue, timeZone);
  if (!parts) {
    return null;
  }

  return buildDateFromParts(parts);
}

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

export function formatDateTimeInTimezone(
  dateValue: string | number | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  try {
    const date = new Date(dateValue as string | number | Date);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat(DEFAULT_LOCALE, { ...options, timeZone }).format(date);
  } catch {
    return 'N/A';
  }
}

export function formatDateInTimezone(
  dateValue: string | number | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  return formatDateTimeInTimezone(dateValue, timeZone, options);
}

export function formatTimeInTimezone(
  dateValue: string | number | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
): string {
  try {
    const date = new Date(dateValue as string | number | Date);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat(DEFAULT_LOCALE, { ...options, timeZone }).format(date);
  } catch {
    return 'N/A';
  }
}

export function getDateKeyInTimezone(
  dateValue: string | number | Date,
  timeZone: string,
): string | null {
  const parts = getDateTimePartsInTimezone(dateValue, timeZone);
  if (!parts) {
    return null;
  }

  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

export function isSameDayInTimezone(
  dateA: string | number | Date,
  dateB: string | number | Date,
  timeZone: string,
): boolean {
  const partsA = getDateTimePartsInTimezone(dateA, timeZone);
  const partsB = getDateTimePartsInTimezone(dateB, timeZone);

  if (!partsA || !partsB) {
    return false;
  }

  return partsA.year === partsB.year && partsA.month === partsB.month && partsA.day === partsB.day;
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
