import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ContactInputData } from '../../interfaces/contactInterfaces.js';
import {
  validateNameField,
  validateEmail,
  validatePhone,
  validateAddressField,
  validateCityField,
  validateStateField,
  validateZipField,
  validateDateOfBirth,
} from './commonValidation.js';

// Validation error handler middleware
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

// Define shared optional field validations using common validation functions
const sharedOptionalValidations = [
  validateNameField('middlename', false),
  validateEmail('email', false),
  validatePhone('phone1', false),
  validatePhone('phone2', false),
  validatePhone('phone3', false),
  validateAddressField('streetaddress', false),
  validateCityField('city', false),
  validateStateField('state', false),
  validateZipField('zip', false),
  validateDateOfBirth('dateofbirth', false),
];

// Contact update validation rules for photo-only updates (optional fields)
export const validateContactPhotoUpdate = [
  validateNameField('firstname', false),
  validateNameField('lastname', false),

  // Include all optional fields
  ...sharedOptionalValidations,

  handleValidationErrors,
];

// Contact update validation rules (standard fields required)
export const validateContactUpdate = [
  validateNameField('firstname', false),
  validateNameField('lastname', false),

  // Include all optional fields
  ...sharedOptionalValidations,

  handleValidationErrors,
];

// Contact creation validation rules
export const validateContactCreate = [
  validateNameField('firstname', true),
  validateNameField('lastname', true),

  // Include all optional fields from update validation
  ...sharedOptionalValidations,

  handleValidationErrors,
];

// Search query validation
export const validateContactSearch = [
  body('searchQuery')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s\-.'@]*$/)
    .withMessage('Search query contains invalid characters'),

  body('seasonId').optional().isInt({ min: 1 }).withMessage('Season ID must be a positive integer'),

  body('includeRoles').optional().isBoolean().withMessage('Include roles must be a boolean'),

  body('onlyWithRoles').optional().isBoolean().withMessage('Only with roles must be a boolean'),

  body('includeContactDetails')
    .optional()
    .isBoolean()
    .withMessage('Include contact details must be a boolean'),

  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

// File upload validation
export const validatePhotoUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    next();
    return;
  }

  const file = req.file;
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    res.status(400).json({
      error: 'Invalid file type',
      details: `Allowed types: ${allowedMimeTypes.join(', ')}`,
    });
    return;
  }

  if (file.size > maxSize) {
    res.status(400).json({
      error: 'File too large',
      details: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
    });
    return;
  }

  next();
};

// Dynamic validation for contact updates - uses photo validation if only photo present
export const validateContactUpdateDynamic = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log('Dynamic validation - body:', req.body);
  console.log('Dynamic validation - has file:', !!req.file);

  // Check if this request has any form data beyond photo
  const hasFormData = Object.keys(req.body).some(
    (key) => req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '',
  );

  console.log('Dynamic validation - hasFormData:', hasFormData);

  // If we have form data, use standard validation (requires firstname/lastname)
  // If we only have a photo file, use photo validation (optional fields)
  const validationRules = hasFormData ? validateContactUpdate : validateContactPhotoUpdate;

  console.log('Dynamic validation - using rules:', hasFormData ? 'standard' : 'photo-only');

  try {
    // Apply the appropriate validation rules sequentially
    for (const rule of validationRules) {
      if (typeof rule === 'function') {
        await new Promise<void>((resolve, reject) => {
          try {
            rule(req, res, (error?: unknown) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          } catch (err) {
            reject(err);
          }
        });
      }
    }
    next();
  } catch (error) {
    console.error('Dynamic validation error:', error);
    // If validation failed, don't call next() - the validation error handler should have already responded
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Validation error',
      });
    }
  }
};

// Sanitize contact data
export const sanitizeContactData = (data: Record<string, unknown>): ContactInputData => {
  const sanitized: ContactInputData = {};

  // Text fields that need sanitization (trimming)
  const textFields: (keyof ContactInputData)[] = [
    'firstname',
    'lastname',
    'middlename',
    'streetaddress',
    'city',
  ];

  // Copy and sanitize text fields
  textFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] === 'string') {
      sanitized[field] = (data[field] as string).trim();
    }
  });

  // Copy other fields as-is (no trimming needed for these)
  const otherFields: (keyof ContactInputData)[] = [
    'email',
    'phone1',
    'phone2',
    'phone3',
    'state',
    'zip',
    'dateofbirth',
  ];

  otherFields.forEach((field) => {
    if (data[field] !== undefined && typeof data[field] === 'string') {
      sanitized[field] = data[field] as string;
    }
  });

  return sanitized;
};
