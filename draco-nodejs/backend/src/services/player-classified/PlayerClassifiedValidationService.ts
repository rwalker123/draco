// PlayerClassifiedValidationService for Draco Sports Manager
// Single responsibility: Validates all player classified data with comprehensive validation rules

import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IPlayersWantedUpdateRequest,
  IClassifiedValidationResult,
} from '../../interfaces/playerClassifiedInterfaces.js';
import { isValidPositionId } from '../../interfaces/playerClassifiedConstants.js';
import { DateUtils } from '../../utils/dateUtils.js';
import {
  validateRequiredString,
  validateEmail,
  validatePhone,
  validateBirthDate,
  validatePositions,
  collectValidationErrors,
  createValidationResult,
} from '../../utils/validationUtils.js';
import { VALIDATION_LIMITS } from '../../config/playerClassifiedConstants.js';

/**
 * PlayerClassifiedValidationService
 *
 * Handles all validation logic for player classified operations including:
 * - Players Wanted creation and update validation
 * - Teams Wanted creation validation
 * - Position validation for baseball/sports positions
 * - Field length, format, and business rule validation
 *
 * This service follows Single Responsibility Principle by focusing solely on data validation.
 * All validation methods are pure functions that don't modify state or perform side effects.
 *
 * @example
 * ```typescript
 * const validationService = new PlayerClassifiedValidationService();
 * const result = validationService.validatePlayersWantedCreateRequest(request);
 * if (!result.isValid) {
 *   throw new ValidationError(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
 * }
 * ```
 */
export class PlayerClassifiedValidationService {
  /**
   * Validate Players Wanted creation request
   *
   * Performs comprehensive validation of Players Wanted creation data including
   * required field validation, length limits, and position format validation.
   * Uses centralized validation utilities for consistency.
   *
   * @param request - Players Wanted creation request data to validate
   * @returns Validation result with success status and collected error messages
   *
   * @security Validates all user input to prevent injection attacks and ensure
   * data integrity. Uses position validation to prevent invalid data entry.
   *
   * @example
   * ```typescript
   * const validation = validationService.validatePlayersWantedCreateRequest(request);
   * if (!validation.isValid) {
   *   throw new ValidationError(validation.errors.map(e => e.message).join(', '));
   * }
   * ```
   */
  validatePlayersWantedCreateRequest(
    request: IPlayersWantedCreateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      validateRequiredString(
        request.teamEventName,
        'teamEventName',
        VALIDATION_LIMITS.TEAM_EVENT_NAME_MAX_LENGTH,
      ),
      validateRequiredString(
        request.description,
        'description',
        VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
        VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH,
      ),
      validatePositions(
        request.positionsNeeded,
        'positionsNeeded',
        this.validatePositions.bind(this),
      ),
    );

    return createValidationResult(errors);
  }

  /**
   * Validate Teams Wanted creation request
   *
   * Performs comprehensive validation of anonymous Teams Wanted creation data.
   * Validates email format, phone format, birth date constraints (age limits),
   * position formats, and required field completeness.
   *
   * @param request - Teams Wanted creation request from anonymous user
   * @returns Validation result with success status and detailed error messages
   *
   * @security Implements strict validation for public-facing endpoints:
   * - Email format validation to prevent malformed addresses
   * - Phone format validation for data consistency
   * - Age validation to enforce business rules (MIN_AGE to MAX_AGE)
   * - Position validation to prevent invalid sports position codes
   *
   * @example
   * ```typescript
   * const validation = validationService.validateTeamsWantedCreateRequest({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   birthDate: '1990-05-15',
   *   positionsPlayed: 'SS,2B'
   * });
   * ```
   */
  validateTeamsWantedCreateRequest(
    request: ITeamsWantedCreateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      validateRequiredString(request.name, 'name', VALIDATION_LIMITS.NAME_MAX_LENGTH),
      validateEmail(request.email, 'email'),
      validatePhone(request.phone, 'phone'),
      validateRequiredString(
        request.experience,
        'experience',
        VALIDATION_LIMITS.EXPERIENCE_MAX_LENGTH,
      ),
      validatePositions(
        request.positionsPlayed,
        'positionsPlayed',
        this.validatePositions.bind(this),
      ),
      (() => {
        const parsedBirthDate = DateUtils.parseDateForDatabase(request.birthDate);
        return parsedBirthDate
          ? validateBirthDate(
              parsedBirthDate,
              'birthDate',
              VALIDATION_LIMITS.MIN_AGE,
              VALIDATION_LIMITS.MAX_AGE,
            )
          : null;
      })(),
    );

    return createValidationResult(errors);
  }

  /**
   * Validate Players Wanted update request
   *
   * Validates partial update data for Players Wanted classifieds. Only validates
   * fields that are present in the request (undefined fields are ignored).
   * This allows for flexible partial updates while maintaining data integrity.
   *
   * @param request - Update request with potentially partial data
   * @returns Validation result indicating success/failure with detailed error messages
   *
   * @security Validates all provided fields to prevent injection and ensure
   * data integrity. Uses the same validation rules as creation but allows partial updates.
   *
   * @example
   * ```typescript
   * const validation = validationService.validatePlayersWantedUpdateRequest({
   *   description: 'Updated description', // Only description provided
   *   // teamEventName and positionsNeeded are undefined and not validated
   * });
   * ```
   */
  validatePlayersWantedUpdateRequest(
    request: IPlayersWantedUpdateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      request.teamEventName !== undefined
        ? validateRequiredString(
            request.teamEventName,
            'teamEventName',
            VALIDATION_LIMITS.TEAM_EVENT_NAME_MAX_LENGTH,
            1,
          )
        : null,
      request.description !== undefined
        ? validateRequiredString(
            request.description,
            'description',
            VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
            VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH,
          )
        : null,
      request.positionsNeeded !== undefined
        ? validatePositions(
            request.positionsNeeded,
            'positionsNeeded',
            this.validatePositions.bind(this),
          )
        : null,
    );

    return createValidationResult(errors);
  }

  /**
   * Validate Teams Wanted update data for individual fields
   *
   * Performs individual field validation for Teams Wanted update operations.
   * This method is used by the main service to validate each field during updates
   * without requiring a complete request object.
   *
   * @param field - The field name being validated
   * @param value - The value to validate
   * @returns Error message if validation fails, null if valid
   *
   * @security Implements the same validation rules as creation but for individual fields
   * to support partial updates while maintaining security standards.
   *
   * @example
   * ```typescript
   * const error = validationService.validateTeamsWantedField('email', 'invalid-email');
   * if (error) {
   *   throw new ValidationError(error);
   * }
   * ```
   */
  validateTeamsWantedField(field: string, value: unknown): string | null {
    switch (field) {
      case 'name':
        if (typeof value === 'string' && value.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
          return `Name must be ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters or less`;
        }
        break;

      case 'email':
        if (typeof value === 'string') {
          const emailError = validateEmail(value, 'email');
          if (emailError) {
            return 'Invalid email format';
          }
        }
        break;

      case 'phone':
        if (typeof value === 'string') {
          const phoneError = validatePhone(value, 'phone');
          if (phoneError) {
            return 'Invalid phone number format';
          }
        }
        break;

      case 'positionsPlayed':
        if (typeof value === 'string' && !this.validatePositions(value)) {
          return 'Invalid positions specified';
        }
        break;

      case 'birthDate':
        if (typeof value === 'string') {
          const parsedBirthDate = DateUtils.parseDateForDatabase(value);
          if (parsedBirthDate) {
            const birthDateError = validateBirthDate(
              parsedBirthDate,
              'birthDate',
              VALIDATION_LIMITS.MIN_AGE,
              VALIDATION_LIMITS.MAX_AGE,
            );
            if (birthDateError) {
              return `Invalid birth date (must be ${VALIDATION_LIMITS.MIN_AGE}-${VALIDATION_LIMITS.MAX_AGE} years old)`;
            }
          }
        }
        break;
    }

    return null;
  }

  /**
   * Validate positions string (comma-separated position IDs)
   *
   * Validates that a comma-separated string of position codes contains only
   * valid baseball/sports position identifiers. Used for both Players Wanted
   * and Teams Wanted position validation.
   *
   * @param positions - Comma-separated string of position codes (e.g., 'P,1B,SS')
   * @returns True if all positions are valid, false if any are invalid
   *
   * @security Prevents injection of invalid position codes that could cause
   * data integrity issues or display problems in the UI.
   *
   * @example
   * ```typescript
   * validationService.validatePositions('P,1B,SS'); // true - valid positions
   * validationService.validatePositions('P,INVALID,SS'); // false - contains invalid position
   * validationService.validatePositions(''); // false - empty string
   * ```
   */
  validatePositions(positions: string): boolean {
    if (!positions || typeof positions !== 'string') {
      return false;
    }

    const positionList = positions.split(',').map((p) => p.trim());
    return positionList.length > 0 && positionList.every((pos) => isValidPositionId(pos));
  }
}
