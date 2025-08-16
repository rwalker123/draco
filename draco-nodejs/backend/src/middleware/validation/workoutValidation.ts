import { body, query } from 'express-validator';
import { handleValidationErrors } from './contactValidation.js';
import {
  validateRequiredString,
  validateOptionalString,
  validateEmail,
  validateInteger,
  validateBoolean,
  validateDate,
  validateArray,
  validatePhone,
} from './commonValidation.js';

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
