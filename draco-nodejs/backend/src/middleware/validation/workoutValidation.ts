import { body, query } from 'express-validator';
import { handleValidationErrors } from './contactValidation.js';
// Simple validation helpers to replace commonValidation.js imports
const validateRequiredString = (fieldName: string, maxLength: number, pattern?: RegExp, patternMessage?: string, minLength?: number) => {
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

const validateOptionalString = (fieldName: string, maxLength: number, pattern?: RegExp, patternMessage?: string) => {
  let validation = body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must not exceed ${maxLength} characters`);

  if (pattern) {
    validation = validation.custom((value: string) => {
      if (!value || value === '') return true;
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

const validateInteger = (fieldName: string, min: number, max: number, isRequired: boolean = true) => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isInt({ min, max })
    .withMessage(`${fieldName} must be an integer between ${min} and ${max}`);
};

const validateBoolean = (fieldName: string, isRequired: boolean = true) => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation.isBoolean().withMessage(`${fieldName} must be a boolean value`);
};

const validateDate = (fieldName: string, isRequired: boolean = true) => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation.isISO8601().withMessage(`${fieldName} must be a valid ISO8601 date`);
};

const validateArray = (fieldName: string, minItems: number = 1, isRequired: boolean = true) => {
  const validation = isRequired
    ? body(fieldName).exists().withMessage(`${fieldName} is required`)
    : body(fieldName).optional();

  return validation
    .isArray({ min: minItems })
    .withMessage(`${fieldName} must be an array with at least ${minItems} item(s)`);
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
        throw new Error(`${fieldName} can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"`);
      }
      return true;
    })
    .isLength({ max: 50 })
    .withMessage(`${fieldName} must not exceed 50 characters`);
};

export const validateListWorkouts = [
  query('status').optional().isIn(['upcoming', 'past', 'all']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('before').optional().isISO8601(),
  query('after').optional().isISO8601(),
  handleValidationErrors,
];

export const validateWorkoutCreate = [
  validateRequiredString('workoutDesc', 1000),
  validateDate('workoutDate', true),
  validateOptionalString('fieldId', 100),
  body('comments').optional().isString(),
  handleValidationErrors,
];

export const validateWorkoutUpdate = [
  validateOptionalString('workoutDesc', 1000),
  validateDate('workoutDate', false),
  validateOptionalString('fieldId', 100),
  body('comments').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

export const validateRegistrationCreate = [
  validateRequiredString('name', 100),
  validateEmail('email', true),
  validateInteger('age', 0, 200, true),
  validatePhone('phone1', false),
  validatePhone('phone2', false),
  validatePhone('phone3', false),
  validatePhone('phone4', false),
  validateRequiredString('positions', 50),
  validateBoolean('isManager', true),
  validateRequiredString('whereHeard', 25),
  handleValidationErrors,
];

export const validateRegistrationUpdate = [
  validateOptionalString('name', 100),
  validateEmail('email', false),
  validateInteger('age', 0, 200, false),
  validatePhone('phone1', false),
  validatePhone('phone2', false),
  validatePhone('phone3', false),
  validatePhone('phone4', false),
  validateOptionalString('positions', 50),
  validateBoolean('isManager', false),
  validateOptionalString('whereHeard', 25),
  handleValidationErrors,
];

export const validateSourcesUpdate = [
  validateArray('options', 1, true),
  body('options.*').isString().trim().isLength({ max: 25 }),
  handleValidationErrors,
];
