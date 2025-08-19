// Cleanup Validation Middleware for Draco Sports Manager
// Comprehensive input validation for all cleanup-related operations

import { body, param, query } from 'express-validator';
import { handleValidationErrors } from './contactValidation.js';

/**
 * Validate cleanup parameters for manual trigger
 * Ensures all parameters are within safe bounds
 */
export const validateCleanupTrigger = [
  // Optional batch size override (with bounds checking)
  body('batchSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Batch size must be between 1 and 1000')
    .toInt(),

  // Optional expiration days override (with bounds checking)
  body('expirationDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiration days must be between 1 and 365')
    .toInt(),

  // Optional table filter (only allow supported tables)
  body('tableFilter')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Table filter must not exceed 50 characters')
    .custom((value: string) => {
      if (!value) return true;

      const allowedTables = ['playerswantedclassified', 'teamswantedclassified'];
      if (!allowedTables.includes(value)) {
        throw new Error(
          'Table filter must be one of: playerswantedclassified, teamswantedclassified',
        );
      }
      return true;
    }),

  // Optional dry run flag
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean value'),

  handleValidationErrors,
];

/**
 * Validate cleanup status query parameters
 * Ensures pagination and filtering parameters are valid
 */
export const validateCleanupStatus = [
  // Optional page parameter for pagination
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  // Optional limit parameter for pagination
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  // Optional includeHistory flag
  query('includeHistory')
    .optional()
    .isBoolean()
    .withMessage('Include history must be a boolean value'),

  // Optional date range filters
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate: string, { req }) => {
      const startDate = req.query?.startDate;
      if (startDate && endDate && new Date(endDate) <= new Date(startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validate cleanup configuration update parameters
 * Ensures configuration changes are within safe bounds
 */
export const validateCleanupConfigUpdate = [
  // Batch size validation
  body('batchSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Batch size must be between 1 and 1000')
    .toInt(),

  // Cleanup hour validation (0-23)
  body('cleanupHour')
    .optional()
    .isInt({ min: 0, max: 23 })
    .withMessage('Cleanup hour must be between 0 and 23')
    .toInt(),

  // Cleanup interval validation (minimum 1 hour, maximum 168 hours/1 week)
  body('cleanupIntervalHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Cleanup interval must be between 1 and 168 hours (1 week)')
    .toInt(),

  // Expiration days validation
  body('expirationDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiration days must be between 1 and 365')
    .toInt(),

  handleValidationErrors,
];

/**
 * Validate cleanup operation ID for specific operations
 * Ensures operation IDs are valid bigint values
 */
export const validateCleanupOperationId = [
  param('operationId')
    .isString()
    .withMessage('Operation ID must be a string')
    .trim()
    .notEmpty()
    .withMessage('Operation ID is required')
    .custom((value: string) => {
      // Check if it's a valid bigint string
      if (!/^\d+$/.test(value)) {
        throw new Error('Operation ID must be a valid numeric string');
      }

      // Check if it's within safe bounds (max 64-bit integer)
      const num = BigInt(value);
      if (num < 0 || num > BigInt('9223372036854775807')) {
        throw new Error('Operation ID must be a valid positive 64-bit integer');
      }

      return true;
    }),

  handleValidationErrors,
];

/**
 * Validate cleanup rollback parameters
 * Ensures rollback operations are safe and valid
 */
export const validateCleanupRollback = [
  // Operation ID validation
  body('operationId')
    .isString()
    .withMessage('Operation ID is required')
    .trim()
    .notEmpty()
    .withMessage('Operation ID cannot be empty')
    .custom((value: string) => {
      if (!/^\d+$/.test(value)) {
        throw new Error('Operation ID must be a valid numeric string');
      }
      return true;
    }),

  // Rollback reason validation
  body('reason')
    .isString()
    .withMessage('Rollback reason is required')
    .trim()
    .notEmpty()
    .withMessage('Rollback reason cannot be empty')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rollback reason must be between 10 and 500 characters'),

  // Confirmation flag
  body('confirmed')
    .isBoolean()
    .withMessage('Confirmation flag must be a boolean value')
    .custom((value: boolean) => {
      if (!value) {
        throw new Error('Rollback must be explicitly confirmed');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Sanitize cleanup request data
 * Removes any potentially dangerous content and normalizes data
 */
export const sanitizeCleanupData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  // Text fields that need sanitization
  const textFields = ['tableFilter', 'reason'];

  textFields.forEach((field) => {
    if (data[field] !== undefined && typeof data[field] === 'string') {
      sanitized[field] = (data[field] as string).trim();
    }
  });

  // Numeric fields (already validated by middleware)
  const numericFields = ['batchSize', 'expirationDays', 'cleanupHour', 'cleanupIntervalHours'];
  numericFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });

  // Boolean fields
  const booleanFields = ['dryRun', 'includeHistory', 'confirmed'];
  booleanFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = Boolean(data[field]);
    }
  });

  return sanitized;
};
