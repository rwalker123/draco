/**
 * Contact validation utilities
 * Following DRY principle by providing reusable validation functions
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates email address format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: true }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());

  return {
    isValid,
    message: isValid ? undefined : 'Please enter a valid email address',
  };
};

/**
 * Validates required text fields
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const isValid = Boolean(value && value.trim().length > 0);

  return {
    isValid,
    message: isValid ? undefined : `${fieldName} is required`,
  };
};

/**
 * Validates phone number format (accepts various formats)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if it's a valid US phone number (10 digits) or international (7-15 digits)
  const isValid = digitsOnly.length >= 7 && digitsOnly.length <= 15;

  return {
    isValid,
    message: isValid ? undefined : 'Please enter a valid phone number',
  };
};

/**
 * Validates ZIP code format (US format)
 */
export const validateZipCode = (zip: string): ValidationResult => {
  if (!zip || zip.trim() === '') {
    return { isValid: true }; // ZIP is optional
  }

  // US ZIP code format: 12345 or 12345-6789
  const zipRegex = /^\d{5}(-\d{4})?$/;
  const isValid = zipRegex.test(zip.trim());

  return {
    isValid,
    message: isValid ? undefined : 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
  };
};

/**
 * Validates date of birth
 */
export const validateDateOfBirth = (dateString: string): ValidationResult => {
  if (!dateString || dateString.trim() === '') {
    return { isValid: true }; // DOB is optional
  }

  const date = new Date(dateString);
  const now = new Date();

  // Check if date is valid and not in the future
  const isValidDate = !isNaN(date.getTime());
  const isNotFuture = date <= now;

  // Check if person is not too old (reasonable age limit)
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 120);
  const isNotTooOld = date >= minDate;

  const isValid = isValidDate && isNotFuture && isNotTooOld;

  let message: string | undefined;
  if (!isValidDate) {
    message = 'Please enter a valid date';
  } else if (!isNotFuture) {
    message = 'Date of birth cannot be in the future';
  } else if (!isNotTooOld) {
    message = 'Please enter a reasonable date of birth';
  }

  return {
    isValid,
    message,
  };
};

/**
 * Validates complete contact form data
 */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  middlename?: string;
  email: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth?: string;
}

export interface ContactValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  zip?: string;
  dateofbirth?: string;
}

/**
 * Validates entire contact form and returns all errors
 */
export const validateContactForm = (data: ContactFormData): ContactValidationErrors => {
  const errors: ContactValidationErrors = {};

  // Required fields
  const firstNameValidation = validateRequired(data.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.message;
  }

  const lastNameValidation = validateRequired(data.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.message;
  }

  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Phone number validations
  const phone1Validation = validatePhoneNumber(data.phone1 || '');
  if (!phone1Validation.isValid) {
    errors.phone1 = phone1Validation.message;
  }

  const phone2Validation = validatePhoneNumber(data.phone2 || '');
  if (!phone2Validation.isValid) {
    errors.phone2 = phone2Validation.message;
  }

  const phone3Validation = validatePhoneNumber(data.phone3 || '');
  if (!phone3Validation.isValid) {
    errors.phone3 = phone3Validation.message;
  }

  // ZIP code validation
  const zipValidation = validateZipCode(data.zip || '');
  if (!zipValidation.isValid) {
    errors.zip = zipValidation.message;
  }

  // Date of birth validation
  const dobValidation = validateDateOfBirth(data.dateofbirth || '');
  if (!dobValidation.isValid) {
    errors.dateofbirth = dobValidation.message;
  }

  return errors;
};

/**
 * Checks if contact form has any validation errors
 */
export const hasValidationErrors = (errors: ContactValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined && error !== '');
};

/**
 * Sanitizes form data by trimming whitespace and handling empty strings
 */
export const sanitizeContactFormData = (data: ContactFormData): ContactFormData => {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    middlename: data.middlename?.trim() || undefined,
    email: data.email.trim(),
    phone1: data.phone1?.trim() || undefined,
    phone2: data.phone2?.trim() || undefined,
    phone3: data.phone3?.trim() || undefined,
    streetaddress: data.streetaddress?.trim() || undefined,
    city: data.city?.trim() || undefined,
    state: data.state?.trim() || undefined,
    zip: data.zip?.trim() || undefined,
    dateofbirth: data.dateofbirth?.trim() || undefined,
  };
};
