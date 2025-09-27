/**
 * Shared date helpers to keep frontend and backend aligned on date formatting.
 * Uses direct UTC math so we don't depend on a browser-specific timezone.
 */
export const formatDateToUtcString = (date: Date): string => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateToUtcString');
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Normalize loose date inputs into a Date instance.
 * Accepts ISO strings or Date objects and returns null for other values.
 */
export const coerceToDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};
