import { NotFoundError, ValidationError } from './customErrors.js';
import { DateUtils } from './dateUtils.js';
import { ValidationUtils } from './validationUtils.js';
import type { ISeasonsRepository } from '../repositories/interfaces/ISeasonsRepository.js';

/**
 * Shared validation utilities for scheduler services
 */
export class SchedulerValidationUtils {
  /**
   * Validates and parses a time range, ensuring startTime is before endTime
   * @param startTimeIso - ISO 8601 start time string
   * @param endTimeIso - ISO 8601 end time string
   * @returns Parsed Date objects for startTime and endTime
   * @throws ValidationError if times are invalid or startTime >= endTime
   */
  static requireRange(
    startTimeIso: string,
    endTimeIso: string,
  ): { startTime: Date; endTime: Date } {
    const startTime = DateUtils.parseDateTimeForDatabase(startTimeIso);
    if (!startTime) {
      throw new ValidationError('Invalid startTime');
    }
    const endTime = DateUtils.parseDateTimeForDatabase(endTimeIso);
    if (!endTime) {
      throw new ValidationError('Invalid endTime');
    }
    if (startTime >= endTime) {
      throw new ValidationError('startTime must be before endTime');
    }
    return { startTime, endTime };
  }

  /**
   * Parses a string to bigint, throwing ValidationError if parsing fails
   * @param value - String value to parse
   * @param label - Label for error message
   * @returns Parsed bigint value
   * @throws ValidationError if parsing fails
   */
  static parseBigInt(value: string, label: string): bigint {
    return ValidationUtils.parseBigInt(value, label);
  }

  /**
   * Validates that a season exists within the specified account
   * @param seasonsRepository - Repository instance for season queries
   * @param accountId - Account ID to validate against
   * @param seasonId - Season ID to validate
   * @throws NotFoundError if season doesn't exist in the account
   */
  static async ensureSeasonInAccount(
    seasonsRepository: ISeasonsRepository,
    accountId: bigint,
    seasonId: bigint,
  ): Promise<void> {
    const season = await seasonsRepository.findSeasonById(accountId, seasonId);
    if (!season) {
      throw new NotFoundError('Season not found');
    }
  }
}
