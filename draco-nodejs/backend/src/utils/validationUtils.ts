import { ValidationError } from './customErrors.js';

/**
 * General validation utilities for service-level input validation
 */
export class ValidationUtils {
  /**
   * Parses a string to bigint, throwing ValidationError if parsing fails
   * @param value - String value to parse
   * @param label - Label for error message (e.g., 'Account ID', 'Field ID')
   * @returns Parsed bigint value
   * @throws ValidationError if parsing fails
   */
  static parseBigInt(value: string, label: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new ValidationError(`Invalid ${label}`);
    }
  }
}
