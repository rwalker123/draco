/**
 * Centralized date utility functions for handling dateofbirth field
 * Provides consistent transformation between database sentinel values and frontend null values
 */
import { formatDateToUtcString } from '@draco/shared-schemas';

export class DateUtils {
  /**
   * Sentinel date used in database when no birth date is provided
   * This appears as 12/31/1899 in frontend due to timezone conversion
   */
  private static readonly SENTINEL_DATE = '1900-01-01T00:00:00.000Z';

  static formatMonthDayWithOrdinal(
    date: Date | null | undefined,
    timeZone?: string | null,
  ): string | null {
    if (!date) {
      return null;
    }

    const tz = timeZone?.trim() || 'UTC';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        timeZone: tz,
      }).formatToParts(date);

      const month = parts.find((part) => part.type === 'month')?.value;
      const dayRaw = parts.find((part) => part.type === 'day')?.value;
      const day = dayRaw ? Number(dayRaw) : Number.NaN;

      if (!month || Number.isNaN(day)) {
        return null;
      }

      const suffix = (() => {
        const mod100 = day % 100;
        if (mod100 >= 11 && mod100 <= 13) return 'th';
        switch (day % 10) {
          case 1:
            return 'st';
          case 2:
            return 'nd';
          case 3:
            return 'rd';
          default:
            return 'th';
        }
      })();

      return `${month} ${day}${suffix}`;
    } catch {
      return null;
    }
  }

  /**
   * Convert database date to frontend-safe value
   * Returns null for sentinel dates (1900-01-01), ISO string for valid dates
   * @param date - Date from database or null
   * @returns ISO string for valid dates, null for sentinel/null dates
   */
  static formatDateOfBirthForResponse(date: Date | null | undefined): string | null {
    if (!date) return null;

    // Return null for sentinel value
    if (DateUtils.isSentinelDate(date)) {
      return null;
    }

    // Return date-only (YYYY-MM-DD) to avoid timezone shifts in clients
    return formatDateToUtcString(date);
  }

  /**
   * Convert frontend date string to database value
   * Returns sentinel date (1900-01-01) for null/empty values, parsed Date for valid strings
   * @param dateString - Date string from frontend or null
   * @returns Date object (sentinel date for null inputs)
   */
  static parseDateOfBirthForDatabase(dateString: string | null | undefined): Date {
    return dateString && dateString.trim() !== '' ? new Date(dateString) : new Date('1900-01-01');
  }

  /**
   * Check if a date is the sentinel value
   * @param date - Date to check
   * @returns true if date is the sentinel value (1900-01-01)
   */
  static isSentinelDate(date: Date | null | undefined): boolean {
    if (!date) return false;
    return date.toISOString().startsWith('1900-01-01');
  }

  /**
   * Add days to a date
   * @param date - The base date
   * @param days - Number of days to add (can be negative to subtract)
   * @returns A new Date object with the days added
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // ============================================================================
  // NEW METHODS FOR CONSISTENT DATE TRANSFORMATION ACROSS ALL SERVICES
  // ============================================================================

  /**
   * Convert database date to frontend-safe value for general date fields
   * Returns null for null/undefined dates, YYYY-MM-DD string for valid dates
   * @param date - Date from database or null
   * @returns YYYY-MM-DD string for valid dates, null for null dates
   */
  static formatDateForResponse(date: Date | null | undefined): string | null {
    if (!date) return null;

    // Return date-only (YYYY-MM-DD) to avoid timezone shifts in clients
    return formatDateToUtcString(date);
  }

  /**
   * Convert database datetime to frontend-safe value for timestamp fields
   * Returns null for null/undefined dates, ISO string for valid dates
   * @param date - Date from database or null
   * @returns ISO string for valid dates, null for null dates
   */
  static formatDateTimeForResponse(date: Date | null | undefined): string | null {
    if (!date) return null;

    // Return ISO string with proper timezone handling
    return date.toISOString();
  }

  /**
   * Format a Date into a human-friendly string in the given time zone.
   * Falls back to UTC ISO when invalid input or time zone issues occur.
   */
  static formatDateTimeInTimeZone(
    date: Date | null | undefined,
    timeZone?: string | null,
    options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ): string | null {
    if (!date) return null;

    const tz = timeZone?.trim() || 'UTC';
    try {
      return new Intl.DateTimeFormat('en-US', { ...options, timeZone: tz }).format(date);
    } catch {
      return DateUtils.formatDateTimeForResponse(date);
    }
  }

  /**
   * Parse frontend date string to database value for general date fields
   * Returns null for null/empty values, parsed Date for valid strings
   * @param dateString - Date string from frontend or null
   * @returns Date object or null
   */
  static parseDateForDatabase(dateString: string | null | undefined): Date | null {
    if (!dateString || dateString.trim() === '') return null;

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parse frontend datetime string to database value for timestamp fields
   * Returns null for null/empty values, parsed Date for valid strings
   * @param dateString - Date string from frontend or null
   * @returns Date object or null
   */
  static parseDateTimeForDatabase(dateString: string | null | undefined): Date | null {
    if (!dateString || dateString.trim() === '') return null;

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Validate if a date string is in a valid format
   * @param dateString - Date string to validate
   * @returns true if the date string is valid
   */
  static isValidDateString(dateString: string | null | undefined): boolean {
    if (!dateString || dateString.trim() === '') return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Calculate age from birth date
   * @param birthDate - Birth date as Date object or string
   * @returns Age in years as number
   */
  static calculateAge(birthDate: Date | string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }
}
