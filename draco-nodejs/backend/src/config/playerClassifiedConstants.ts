/**
 * Player Classified Service Constants
 * Centralizes all magic numbers and hardcoded values for player classified functionality
 */

/**
 * Timeout and duration constants
 */
export const TIMEOUT_CONSTANTS = Object.freeze({
  /** Email verification timeout in milliseconds (5 minutes) */
  EMAIL_VERIFICATION_TIMEOUT_MS: 5 * 60 * 1000,

  /** Email sending timeout in milliseconds (30 seconds) */
  EMAIL_SEND_TIMEOUT_MS: 30 * 1000,
} as const);

/**
 * Validation limits for player classified data
 */
export const VALIDATION_LIMITS = Object.freeze({
  /** Maximum length for team event name */
  TEAM_EVENT_NAME_MAX_LENGTH: 50,

  /** Maximum length for description */
  DESCRIPTION_MAX_LENGTH: 1000,

  /** Minimum length for description */
  DESCRIPTION_MIN_LENGTH: 10,

  /** Maximum length for name */
  NAME_MAX_LENGTH: 50,

  /** Maximum length for experience */
  EXPERIENCE_MAX_LENGTH: 255,

  /** Minimum age for birth date validation */
  MIN_AGE: 13,

  /** Maximum age for birth date validation */
  MAX_AGE: 80,
} as const);

/**
 * Email template styling constants
 * Extracted from hardcoded CSS in email generation methods
 */
export const EMAIL_STYLES = Object.freeze({
  /** Container styles for email layout */
  CONTAINER: Object.freeze({
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  }),

  /** Header banner styles */
  HEADER_BANNER: Object.freeze({
    backgroundColor: '#4285F4',
    color: 'white',
    textAlign: 'center' as const,
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px 8px 0 0',
  }),

  /** Header title styles */
  HEADER_TITLE: Object.freeze({
    margin: '0',
    fontSize: '24px',
    fontWeight: 'bold',
  }),

  /** Content area styles */
  CONTENT_AREA: Object.freeze({
    backgroundColor: 'white',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '0 0 8px 8px',
  }),

  /** Main heading styles */
  MAIN_HEADING: Object.freeze({
    color: '#2c5aa0',
    marginBottom: '20px',
    fontSize: '20px',
  }),

  /** Personal greeting styles */
  PERSONAL_GREETING: Object.freeze({
    fontSize: '16px',
    marginBottom: '20px',
  }),

  /** Data summary box styles */
  DATA_SUMMARY: Object.freeze({
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  }),

  /** Data row layout styles */
  DATA_ROW: Object.freeze({
    display: 'flex',
    marginBottom: '10px',
  }),

  /** Data label styles */
  DATA_LABEL: Object.freeze({
    fontWeight: 'bold',
    minWidth: '120px',
    color: '#2c5aa0',
  }),

  /** Data value styles */
  DATA_VALUE: Object.freeze({
    color: '#333',
  }),

  /** Access code box styles */
  ACCESS_CODE_BOX: Object.freeze({
    backgroundColor: '#e3f2fd',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #4285F4',
  }),

  /** Access code text styles */
  ACCESS_CODE: Object.freeze({
    color: '#2c5aa0',
    fontWeight: 'bold',
    fontSize: '18px',
  }),

  /** Verification link styles */
  VERIFICATION_LINK: Object.freeze({
    color: '#4285F4',
    textDecoration: 'none',
    fontWeight: 'bold',
  }),

  /** Verification button styles */
  VERIFICATION_BUTTON: Object.freeze({
    backgroundColor: '#4285F4',
    color: 'white',
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '6px',
    display: 'inline-block',
    margin: '15px 0',
    fontWeight: 'bold',
  }),

  /** Footer styles */
  FOOTER: Object.freeze({
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #ddd',
    fontSize: '14px',
    color: '#666',
  }),
} as const);

/**
 * Email template content constants
 */
export const EMAIL_CONTENT = Object.freeze({
  /** Default email settings */
  DEFAULT_SETTINGS: Object.freeze({
    fromEmail: 'noreply@dracosports.com',
    fromName: 'Draco Sports Manager',
    replyTo: 'support@dracosports.com',
  }),

  /** Email subject templates */
  SUBJECT_TEMPLATES: Object.freeze({
    teamsWantedVerification: (accountName: string) =>
      `${accountName} - Teams Wanted Classified Access Code`,
  }),
} as const);

/**
 * Security constants for content sanitization
 */
export const SECURITY_PATTERNS = Object.freeze({
  /** Patterns to remove from HTML content */
  HTML_DANGEROUS_PATTERNS: Object.freeze([
    /[<>]/g, // Remove < and > to prevent HTML injection
    /javascript:/gi, // Remove javascript: protocol
    /vbscript:/gi, // Remove vbscript: protocol
    /data:/gi, // Remove data: protocol
    /on\w+=/gi, // Remove event handlers
    /[\r\n]/g, // Remove newlines to prevent header injection
  ]),

  /** Patterns to remove from text content */
  TEXT_DANGEROUS_PATTERNS: Object.freeze([
    /[\r\n]/g, // Remove newlines to prevent injection
    /[<>]/g, // Remove HTML tags
  ]),
} as const);

/**
 * Bcrypt configuration constants
 */
export const BCRYPT_CONSTANTS = Object.freeze({
  /** Salt rounds for access code hashing */
  ACCESS_CODE_SALT_ROUNDS: 12,
} as const);

/**
 * Default fallback values
 */
export const DEFAULT_VALUES = Object.freeze({
  /** Default birth date for invalid dates */
  DEFAULT_BIRTH_DATE: new Date(1900, 0, 1), // Year, month (0-based), day

  /** Default pagination page */
  DEFAULT_PAGE: 1,

  /** Default pagination limit */
  DEFAULT_LIMIT: 20,

  /** Default sort field */
  DEFAULT_SORT_BY: 'dateCreated' as const,

  /** Default sort order */
  DEFAULT_SORT_ORDER: 'desc' as const,
} as const);
