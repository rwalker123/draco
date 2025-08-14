import { body, query } from 'express-validator';
import { handleValidationErrors } from './contactValidation.js';

export const validateListWorkouts = [
  query('status').optional().isIn(['upcoming', 'past', 'all']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('before').optional().isISO8601(),
  query('after').optional().isISO8601(),
  handleValidationErrors,
];

export const validateWorkoutCreate = [
  body('workoutDesc').exists().isString().trim(),
  body('workoutDate').exists().isISO8601(),
  body('fieldId').optional().isString().trim(),
  body('comments').optional().isString(),
  handleValidationErrors,
];

export const validateWorkoutUpdate = [
  body('workoutDesc').optional().isString().trim(),
  body('workoutDate').optional().isISO8601(),
  body('fieldId').optional().isString().trim(),
  body('comments').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

export const validateRegistrationCreate = [
  body('name').exists().isString().trim().isLength({ max: 100 }),
  body('email').exists().isString().trim().isEmail().isLength({ max: 100 }),
  body('age').exists().isInt({ min: 0, max: 200 }),
  body('phone1').optional().isString().trim().isLength({ max: 14 }),
  body('phone2').optional().isString().trim().isLength({ max: 14 }),
  body('phone3').optional().isString().trim().isLength({ max: 14 }),
  body('phone4').optional().isString().trim().isLength({ max: 14 }),
  body('positions').exists().isString().trim().isLength({ max: 50 }),
  body('isManager').exists().isBoolean(),
  body('whereHeard').exists().isString().trim().isLength({ max: 25 }),
  handleValidationErrors,
];

export const validateRegistrationUpdate = [
  body('name').optional().isString().trim().isLength({ max: 100 }),
  body('email').optional().isString().trim().isEmail().isLength({ max: 100 }),
  body('age').optional().isInt({ min: 0, max: 200 }),
  body('phone1').optional().isString().trim().isLength({ max: 14 }),
  body('phone2').optional().isString().trim().isLength({ max: 14 }),
  body('phone3').optional().isString().trim().isLength({ max: 14 }),
  body('phone4').optional().isString().trim().isLength({ max: 14 }),
  body('positions').optional().isString().trim().isLength({ max: 50 }),
  body('isManager').optional().isBoolean(),
  body('whereHeard').optional().isString().trim().isLength({ max: 25 }),
  handleValidationErrors,
];

export const validateSourcesUpdate = [
  body('options').isArray({ min: 1 }),
  body('options.*').isString().trim().isLength({ max: 25 }),
  handleValidationErrors,
];
