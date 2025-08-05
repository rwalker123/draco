import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ContactInputData } from '../../interfaces/contactInterfaces';

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

// Define shared optional field validations
const sharedOptionalValidations = [
  body('middlename')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Middle name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s\-']*$/)
    .withMessage('Middle name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email format')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('phone1')
    .optional()
    .trim()
    .matches(/^[\d\s\-()'.ext]*$/)
    .withMessage(
      'Phone number can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"',
    )
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),

  body('phone2')
    .optional()
    .trim()
    .matches(/^[\d\s\-()'.ext]*$/)
    .withMessage(
      'Phone number can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"',
    )
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),

  body('phone3')
    .optional()
    .trim()
    .matches(/^[\d\s\-()'.ext]*$/)
    .withMessage(
      'Phone number can only contain digits, spaces, hyphens, parentheses, plus signs, dots, and "ext"',
    )
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),

  body('streetaddress')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Street address must not exceed 255 characters')
    .matches(/^[a-zA-Z0-9\s\-.,#']*$/)
    .withMessage('Street address contains invalid characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters')
    .matches(/^[a-zA-Z\s\-']*$/)
    .withMessage('City can only contain letters, spaces, hyphens, and apostrophes'),

  body('state')
    .optional()
    .trim()
    .custom((value: string) => {
      if (!value || value === '') {
        return true; // Allow empty state
      }
      if (value.length !== 2) {
        throw new Error('State must be a 2-letter abbreviation (e.g., CA, NY, TX)');
      }
      if (!/^[A-Za-z]{2}$/.test(value)) {
        throw new Error('State must contain only letters');
      }
      return true;
    })
    .toUpperCase(),

  body('zip')
    .optional()
    .trim()
    .matches(/^(\d{5}(-\d{4})?)?$/)
    .withMessage('ZIP code must be in format 12345 or 12345-6789'),

  body('dateofbirth')
    .optional()
    .trim()
    .isDate()
    .withMessage('Invalid date format')
    .custom((value: string) => {
      const date = new Date(value);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (date < minDate || date > maxDate) {
        throw new Error('Date of birth must be between 1 and 120 years ago');
      }
      return true;
    }),
];

// Contact update validation rules for photo-only updates (optional fields)
export const validateContactPhotoUpdate = [
  body('firstname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Include all optional fields
  ...sharedOptionalValidations,

  handleValidationErrors,
];

// Contact update validation rules (standard fields required)
export const validateContactUpdate = [
  body('firstname')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastname')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Include all optional fields
  ...sharedOptionalValidations,

  handleValidationErrors,
];

// Contact creation validation rules
export const validateContactCreate = [
  body('firstname')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastname')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Include all optional fields from update validation
  ...validateContactUpdate.slice(2, -1), // Skip firstname, lastname, and handleValidationErrors

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
