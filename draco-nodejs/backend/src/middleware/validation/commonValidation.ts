// Common Validation Utilities for Draco Sports Manager
// Centralized validation logic to eliminate duplication across endpoints

import { body, param, ValidationChain } from 'express-validator';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Initialize DOMPurify with JSDOM for server-side sanitization
const window = new JSDOM('').window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

/**
 * HTML sanitization function to prevent XSS attacks
 * Uses DOMPurify for comprehensive protection against sophisticated XSS vectors
 */
export const sanitizeHtml = (value: string): string => {
  if (typeof value !== 'string') return value;

  // Use DOMPurify with strict HTML-only profile for maximum security
  return purify
    .sanitize(value, {
      USE_PROFILES: { html: true }, // Allow only safe HTML elements
      FORBID_TAGS: ['svg', 'math'], // Explicitly forbid SVG and MathML for security
      FORBID_ATTR: ['style'], // Remove style attributes to prevent CSS injection
      KEEP_CONTENT: true, // Preserve text content when removing tags
      RETURN_DOM: false, // Return string, not DOM object
      SANITIZE_DOM: true, // Enable DOM clobbering protection
      SANITIZE_NAMED_PROPS: true, // Enforce strict DOM clobbering protection
    })
    .trim();
};

/**
 * Custom sanitization middleware for text fields
 */
export const sanitizeText = (fieldName: string): ValidationChain => {
  return body(fieldName).customSanitizer(sanitizeHtml).trim();
};

/**
 * Common string validation with required field handling
 */
export const validateRequiredString = (
  fieldName: string,
  maxLength: number,
  pattern?: RegExp,
  patternMessage?: string,
  minLength?: number,
): ValidationChain => {
  let validation = body(fieldName)
    .exists()
    .withMessage(`${fieldName} is required`)
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} cannot be empty`)
    .isLength({ max: maxLength, ...(minLength && { min: minLength }) })
    .withMessage(
      minLength
        ? `${fieldName} must be between ${minLength} and ${maxLength} characters`
        : `${fieldName} must not exceed ${maxLength} characters`,
    );

  if (pattern) {
    validation = validation.matches(
      pattern,
      patternMessage || `${fieldName} contains invalid characters`,
    );
  }

  return validation;
};

/**
 * Common string validation with optional field handling
 */
export const validateOptionalString = (
  fieldName: string,
  maxLength: number,
  pattern?: RegExp,
  patternMessage?: string,
): ValidationChain => {
  let validation = body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must not exceed ${maxLength} characters`);

  if (pattern) {
    validation = validation.matches(
      pattern,
      patternMessage || `${fieldName} contains invalid characters`,
    );
  }

  return validation;
};

/**
 * Common email validation
 */
export const validateEmail = (
  fieldName: string = 'email',
  isRequired: boolean = true,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage(`Invalid ${fieldName} format`)
    .isLength({ max: 255 })
    .withMessage(`${fieldName} must not exceed 255 characters`);
};

/**
 * Common phone number validation
 */
export const validatePhone = (fieldName: string, isRequired: boolean = false): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .matches(
      /^[\d\s\-()'.ext]*$/,
      `${fieldName} can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"`,
    )
    .isLength({ max: 50 })
    .withMessage(`${fieldName} must not exceed 50 characters`);
};

/**
 * Common integer validation
 */
export const validateInteger = (
  fieldName: string,
  min: number,
  max: number,
  isRequired: boolean = true,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} must be a string`)
    : body(fieldName).optional();

  return validation
    .isInt({ min, max })
    .withMessage(`${fieldName} must be an integer between ${min} and ${max}`);
};

/**
 * Common boolean validation
 */
export const validateBoolean = (fieldName: string, isRequired: boolean = true): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation.isBoolean().withMessage(`${fieldName} must be a boolean value`);
};

/**
 * Common date validation (ISO8601)
 */
export const validateDate = (fieldName: string, isRequired: boolean = true): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation.isISO8601().withMessage(`${fieldName} must be a valid ISO8601 date`);
};

/**
 * Common array validation
 */
export const validateArray = (
  fieldName: string,
  minItems: number = 1,
  isRequired: boolean = true,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isArray({ min: minItems })
    .withMessage(`${fieldName} must be an array with at least ${minItems} item(s)`);
};

/**
 * Common name field validation (letters, numbers, spaces, hyphens, apostrophes, asterisks)
 */
export const validateNameField = (
  fieldName: string,
  isRequired: boolean = false,
  maxLength: number = 100,
): ValidationChain => {
  const validation = isRequired
    ? validateRequiredString(
        fieldName,
        maxLength,
        /^[a-zA-Z0-9\s\-'*]+$/,
        `${fieldName} can only contain letters, numbers, spaces, hyphens, apostrophes, and asterisks`,
      )
    : validateOptionalString(
        fieldName,
        maxLength,
        /^[a-zA-Z0-9\s\-'*]+$/,
        `${fieldName} can only contain letters, numbers, spaces, hyphens, apostrophes, and asterisks`,
      );

  return validation;
};

/**
 * Common ID validation for route parameters
 */
export const validateIdParam = (paramName: string = 'id'): ValidationChain => {
  return param(paramName).isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`);
};

/**
 * Common account ID validation for route parameters
 */
export const validateAccountIdParam = (): ValidationChain => {
  return param('accountId').isInt({ min: 1 }).withMessage('Account ID must be a positive integer');
};

/**
 * Common address field validation
 */
export const validateAddressField = (
  fieldName: string,
  isRequired: boolean = false,
  maxLength: number = 255,
): ValidationChain => {
  const validation = isRequired
    ? validateRequiredString(
        fieldName,
        maxLength,
        /^[a-zA-Z0-9\s\-.,#']*$/,
        `${fieldName} contains invalid characters`,
      )
    : validateOptionalString(
        fieldName,
        maxLength,
        /^[a-zA-Z0-9\s\-.,#']*$/,
        `${fieldName} contains invalid characters`,
      );

  return validation;
};

/**
 * Common city field validation (letters, spaces, hyphens, apostrophes)
 */
export const validateCityField = (
  fieldName: string,
  isRequired: boolean = false,
  maxLength: number = 100,
): ValidationChain => {
  const validation = isRequired
    ? validateRequiredString(
        fieldName,
        maxLength,
        /^[a-zA-Z\s\-']*$/,
        `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
      )
    : validateOptionalString(
        fieldName,
        maxLength,
        /^[a-zA-Z\s\-']*$/,
        `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
      );

  return validation;
};

/**
 * Common state field validation (2-letter abbreviation)
 */
export const validateStateField = (
  fieldName: string,
  isRequired: boolean = false,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .custom((value: string) => {
      if (!value || value === '') {
        return isRequired ? false : true; // Allow empty for optional fields
      }
      if (value.length !== 2) {
        throw new Error(`${fieldName} must be a 2-letter abbreviation (e.g., CA, NY, TX)`);
      }
      if (!/^[A-Za-z]{2}$/.test(value)) {
        throw new Error(`${fieldName} must contain only letters`);
      }
      return true;
    })
    .toUpperCase();
};

/**
 * Common ZIP code validation
 */
export const validateZipField = (
  fieldName: string,
  isRequired: boolean = false,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .matches(/^(\d{5}(-\d{4})?)?$/, `${fieldName} must be in format 12345 or 12345-6789`);
};

/**
 * Common date of birth validation
 */
export const validateDateOfBirth = (
  fieldName: string,
  isRequired: boolean = false,
): ValidationChain => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .custom((value: string) => {
      // Allow empty strings for optional fields
      if (!value || value === '') {
        return isRequired ? false : true;
      }

      // Validate date format if a value is provided
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid ${fieldName} format`);
      }

      // Validate date range if a valid date is provided
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (date < minDate || date > maxDate) {
        throw new Error(`${fieldName} must be between 1 and 120 years ago`);
      }
      return true;
    });
};
