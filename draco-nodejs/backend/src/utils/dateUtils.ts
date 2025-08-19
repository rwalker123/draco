/**
 * Centralized date utility functions for handling dateofbirth field
 * Provides consistent transformation between database sentinel values and frontend null values
 */
export class DateUtils {
  /**
   * Sentinel date used in database when no birth date is provided
   * This appears as 12/31/1899 in frontend due to timezone conversion
   */
  private static readonly SENTINEL_DATE = '1900-01-01T00:00:00.000Z';

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
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
}
