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
}
