// Service-Level Validation Utilities for Draco Sports Manager
// Centralized validation logic for service classes to eliminate duplication

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Common field validation functions for service classes
 */

/**
 * Validate required string field
 */
export const validateRequiredString = (
  value: string | undefined | null,
  fieldName: string,
  maxLength: number,
  minLength?: number,
): ValidationError | null => {
  if (!value?.trim()) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  if (minLength && value.trim().length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`,
      code: 'FIELD_TOO_SHORT',
    };
  }

  if (value.trim().length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be ${maxLength} characters or less`,
      code: 'FIELD_TOO_LONG',
    };
  }

  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (
  email: string | undefined | null,
  fieldName: string = 'email',
): ValidationError | null => {
  if (!email?.trim()) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      field: fieldName,
      message: `Invalid ${fieldName} format`,
      code: 'INVALID_EMAIL',
    };
  }

  if (email.trim().length > 255) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed 255 characters`,
      code: 'FIELD_TOO_LONG',
    };
  }

  return null;
};

/**
 * Validate phone number format
 */
export const validatePhone = (
  phone: string | undefined | null,
  fieldName: string = 'phone',
): ValidationError | null => {
  if (!phone?.trim()) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (!phoneRegex.test(cleaned)) {
    return {
      field: fieldName,
      message: `Invalid ${fieldName} number format`,
      code: 'INVALID_PHONE',
    };
  }

  if (phone.trim().length > 50) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed 50 characters`,
      code: 'FIELD_TOO_LONG',
    };
  }

  return null;
};

/**
 * Validate birth date (age range)
 */
export const validateBirthDate = (
  birthDate: Date | undefined | null,
  fieldName: string = 'birthDate',
  minAge: number = 13,
  maxAge: number = 80,
): ValidationError | null => {
  if (!birthDate) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    actualAge = age - 1;
  }

  if (actualAge < minAge || actualAge > maxAge) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be between ${minAge} and ${maxAge} years old`,
      code: 'INVALID_BIRTH_DATE',
    };
  }

  return null;
};

/**
 * Validate positions string (comma-separated)
 */
export const validatePositions = (
  positions: string | undefined | null,
  fieldName: string,
  isValidPositionId: (pos: string) => boolean,
): ValidationError | null => {
  if (!positions?.trim()) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  const positionList = positions.split(',').map((p) => p.trim());
  if (positionList.length === 0) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must contain at least one position`,
      code: 'INVALID_POSITIONS',
    };
  }

  for (const pos of positionList) {
    if (!pos || !isValidPositionId(pos)) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must contain valid position IDs separated by commas`,
        code: 'INVALID_POSITIONS',
      };
    }
  }

  return null;
};

/**
 * Helper function to collect validation errors
 */
export const collectValidationErrors = (
  ...validations: (ValidationError | null)[]
): ValidationError[] => {
  return validations.filter((error): error is ValidationError => error !== null);
};

/**
 * Helper function to create validation result
 */
export const createValidationResult = (
  errors: ValidationError[],
  warnings: ValidationError[] = [],
): ValidationResult => {
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
