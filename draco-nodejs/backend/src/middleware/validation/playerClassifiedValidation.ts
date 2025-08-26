// PlayerClassifieds Validation Middleware for Draco Sports Manager
// Comprehensive input validation for all classified-related operations

import { body, param, query } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { handleValidationErrors } from './contactValidation.js';
import { isValidPositionId } from '../../interfaces/playerClassifiedConstants.js';
// Simple validation helpers to replace commonValidation.js imports
const validateRequiredString = (
  fieldName: string,
  maxLength: number,
  pattern?: RegExp,
  patternMessage?: string,
  minLength?: number,
) => {
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
    validation = validation.custom((value: string) => {
      if (!pattern.test(value)) {
        throw new Error(patternMessage || `${fieldName} contains invalid characters`);
      }
      return true;
    });
  }

  return validation;
};

const validateEmail = (fieldName: string = 'email', isRequired: boolean = true) => {
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

const validatePhone = (fieldName: string, isRequired: boolean = false) => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .custom((value: string) => {
      if (!value) return true;
      if (!/^[\d\s\-()'.ext]*$/.test(value)) {
        throw new Error(
          `${fieldName} can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"`,
        );
      }
      return true;
    })
    .isLength({ max: 50 })
    .withMessage(`${fieldName} must not exceed 50 characters`);
};

const sanitizeText = (fieldName: string) => {
  return body(fieldName).trim().escape();
};

/**
 * Validate baseball position IDs (comma-separated)
 * Positions use string IDs like 'pitcher', 'catcher', 'first-base'
 */
const validatePositionIds = (fieldName: string) => {
  return body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ max: 100 })
    .withMessage(`${fieldName} must not exceed 100 characters`)
    .custom((value: string) => {
      if (!value) return true;

      const positions = value.split(',').map((p) => p.trim());
      if (positions.length === 0) {
        throw new Error(`${fieldName} must contain at least one position`);
      }

      // Validate each position ID is a valid string ID
      for (const pos of positions) {
        if (!pos || !isValidPositionId(pos)) {
          throw new Error(
            `${fieldName} must contain valid position IDs separated by commas (e.g., 'pitcher,catcher,first-base')`,
          );
        }
      }

      return true;
    });
};

/**
 * Validate Players Wanted creation
 */
export const validatePlayersWantedCreate = [
  validateRequiredString(
    'teamEventName',
    50,
    /^[a-zA-Z0-9\s'&()-]+$/,
    'Team event name can only contain letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses',
  ),

  validateRequiredString('description', 1000, undefined, undefined, 10),

  validatePositionIds('positionsNeeded'),

  handleValidationErrors,
];

/**
 * Validate Players Wanted update
 */
export const validatePlayersWantedUpdate = [
  sanitizeText('teamEventName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Team event name must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s'&()-]+$/)
    .withMessage(
      'Team event name can only contain letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses',
    ),

  sanitizeText('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('positionsNeeded')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Positions needed must not exceed 100 characters')
    .custom((value: string) => {
      if (!value) return true;

      const positions = value.split(',').map((p) => p.trim());
      for (const pos of positions) {
        if (!pos || !isValidPositionId(pos)) {
          throw new Error(
            'Positions needed must contain valid position IDs separated by commas (e.g., "pitcher,catcher,first-base")',
          );
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================================================
// TEAMS WANTED VALIDATION
// ============================================================================

/**
 * Validate Teams Wanted creation
 */
export const validateTeamsWantedCreate = [
  validateRequiredString(
    'name',
    50,
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes',
  ),

  validateEmail('email', true),

  validatePhone('phone', true),

  validateRequiredString('experience', 255),

  validatePositionIds('positionsPlayed'),

  body('birthDate')
    .notEmpty()
    .withMessage('Birth date is required')
    .isISO8601()
    .withMessage('Birth date must be a valid date')
    .custom((value: string) => {
      if (!value) return true;

      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        actualAge = age - 1;
      }

      if (actualAge < 13 || actualAge > 90) {
        throw new Error('Birth date must be between 13 and 90 years old');
      }

      return true;
    }),

  handleValidationErrors,
];

/**
 * Validate Teams Wanted update
 */
export const validateTeamsWantedUpdate = [
  body('accessCode')
    .trim()
    .notEmpty()
    .withMessage('Access code is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Access code must be between 10 and 1000 characters'),

  sanitizeText('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must not exceed 20 characters')
    .custom((value: string) => {
      if (!value) return true;

      const cleaned = value.replace(/[\s\-()]/g, '');
      if (!/^[+]?[1-9][\d]{0,15}$/.test(cleaned)) {
        throw new Error('Phone must be a valid phone number');
      }
      return true;
    }),

  body('experience')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Experience must not exceed 255 characters'),

  body('positionsPlayed')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Positions played must not exceed 100 characters')
    .custom((value: string) => {
      if (!value) return true;

      const positions = value.split(',').map((p) => p.trim());
      for (const pos of positions) {
        if (!pos || !isValidPositionId(pos)) {
          throw new Error(
            'Positions played must contain valid position IDs separated by commas (e.g., "pitcher,catcher,first-base")',
          );
        }
      }
      return true;
    }),

  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date')
    .custom((value: string) => {
      if (!value) return true;

      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        actualAge = age - 1;
      }

      if (actualAge < 13 || actualAge > 80) {
        throw new Error('Birth date must be between 13 and 80 years old');
      }

      return true;
    }),

  handleValidationErrors,
];

// ============================================================================
// ACCESS CODE VALIDATION
// ============================================================================

/**
 * Validate access code for Teams Wanted operations
 */
export const validateAccessCode = [
  body('accessCode')
    .trim()
    .notEmpty()
    .withMessage('Access code is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Access code must be between 10 and 1000 characters'),

  handleValidationErrors,
];

// ============================================================================
// QUERY PARAMETER VALIDATION
// ============================================================================

/**
 * Validate search and pagination parameters
 */
export const validateSearchParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sortBy')
    .optional()
    .isIn(['dateCreated', 'relevance'])
    .withMessage('Sort by must be one of: dateCreated, relevance'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),

  query('searchQuery')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must not exceed 200 characters'),

  handleValidationErrors,
];

// ============================================================================
// PATH PARAMETER VALIDATION
// ============================================================================

/**
 * Validate account ID parameter
 */
export const validateAccountId = [
  param('accountId')
    .notEmpty()
    .withMessage('Account ID is required')
    .isInt({ min: 1 })
    .withMessage('Account ID must be a positive integer')
    .toInt(),

  handleValidationErrors,
];

/**
 * Validate classified ID parameter
 */
export const validateClassifiedId = [
  param('classifiedId')
    .notEmpty()
    .withMessage('Classified ID is required')
    .isInt({ min: 1 })
    .withMessage('Classified ID must be a positive integer')
    .toInt(),

  handleValidationErrors,
];

// ============================================================================
// COMPOSITE VALIDATION CHAINS
// ============================================================================

/**
 * Validate Teams Wanted verification endpoint
 */
export const validateTeamsWantedVerification = [
  validateAccountId,
  validateClassifiedId,
  validateAccessCode,
];

/**
 * Validate Teams Wanted update endpoint
 */
export const validateTeamsWantedUpdateEndpoint = [
  validateAccountId,
  validateClassifiedId,
  validateTeamsWantedUpdate,
];

/**
 * Validate Teams Wanted deletion endpoint
 */
export const validateTeamsWantedDeletion = [
  validateAccountId,
  validateClassifiedId,
  validateAccessCode,
];

/**
 * Validate Players Wanted deletion endpoint
 */
export const validatePlayersWantedDeletion = [validateAccountId, validateClassifiedId];

// ============================================================================
// CUSTOM VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate that positions exist in the system
 * This would typically check against the database
 */
export const validatePositionsExist = (req: Request, res: Response, next: NextFunction): void => {
  // This is a placeholder for database validation
  // In a real implementation, you would check if the position IDs exist
  next();
};

/**
 * Rate limiting validation (complements service layer rate limiting)
 */
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This is a placeholder for additional rate limiting validation
  // The service layer already handles rate limiting, but this could add extra checks
  next();
};
