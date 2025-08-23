import { Request } from 'express';
import { DateUtils } from './dateUtils.js';

type RegistrationEvent =
  | 'registration_newUser'
  | 'registration_existingUser'
  | 'registration_selfRegister'
  | 'registration_linkByName'
  | 'registration_revoke';

type RegistrationStatus =
  | 'attempt'
  | 'success'
  | 'already_linked'
  | 'duplicate_matches'
  | 'not_found'
  | 'validation_error'
  | 'auth_error'
  | 'server_error';

interface RegistrationLogDetails {
  accountId?: string | number | bigint;
  userId?: string;
  mode?: 'newUser' | 'existingUser';
  timingMs?: number;
  // Allow extra arbitrary structured fields but avoid sensitive data
  [key: string]: string | number | bigint | boolean | undefined;
}

function getClientIp(req: Request): string | undefined {
  const forwarded = (req.headers['x-forwarded-for'] as string) || '';
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.ip as string) || req.socket?.remoteAddress || undefined;
}

/**
 * Generic secure logging function that redacts sensitive data
 * Follows DRY principles and centralized security practices
 *
 * @param level - Log level ('info', 'warn', 'error', 'debug')
 * @param message - Log message or context description
 * @param data - Data object to log (will be sanitized)
 * @param options - Additional logging options
 */
export function logSecurely(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data: Record<string, unknown> = {},
  options: {
    requestId?: string;
    accountId?: string | number | bigint;
    userId?: string;
    skipSensitiveRedaction?: boolean; // For testing purposes only
  } = {},
): void {
  // Skip logging if explicitly disabled
  if (process.env.NODE_ENV === 'test' && !options.skipSensitiveRedaction) {
    return;
  }

  // List of sensitive field names that should be redacted
  const sensitiveFields = [
    'accesscode',
    'accessCode',
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'ssn',
    'socialsecuritynumber',
    'creditcard',
    'cardnumber',
    'cvv',
    'pin',
    'otp',
    'verification_code',
    'verificationCode',
    'reset_token',
    'resetToken',
    'refresh_token',
    'refreshToken',
    'api_key',
    'apiKey',
    'private_key',
    'privateKey',
    'client_secret',
    'clientSecret',
  ];

  // Recursively sanitize the data object
  const sanitizedData = sanitizeObject(data, sensitiveFields);

  const logPayload = {
    ts: DateUtils.formatDateTimeForResponse(new Date()),
    level,
    message,
    requestId: options.requestId,
    accountId: options.accountId !== undefined ? String(options.accountId) : undefined,
    userId: options.userId,
    data: sanitizedData,
  };

  // Remove undefined fields for cleaner logs
  const cleanPayload = Object.fromEntries(
    Object.entries(logPayload).filter(([_, value]) => value !== undefined),
  );

  // Print as single-line JSON for log aggregation
  // Intentionally avoid logging sensitive fields
  console.log(JSON.stringify(cleanPayload));
}

/**
 * Recursively sanitize an object by redacting sensitive fields
 * Handles nested objects and arrays while preserving structure
 *
 * @param obj - Object to sanitize
 * @param sensitiveFields - Array of field names to redact
 * @returns Sanitized object with sensitive fields redacted
 */
function sanitizeObject(obj: unknown, sensitiveFields: string[]): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Basic string sanitization to prevent log injection
    return obj.replace(/[\r\n\t]/g, ' ').trim();
  }

  if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') {
    return obj;
  }

  if (obj instanceof Date) {
    return DateUtils.formatDateTimeForResponse(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if this field should be redacted
      const isSensitive = sensitiveFields.some((sensitiveField) =>
        lowerKey.includes(sensitiveField.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeObject(value, sensitiveFields);
      }
    }

    return sanitized;
  }

  return obj;
}

export function logRegistrationEvent(
  req: Request,
  event: RegistrationEvent,
  status: RegistrationStatus,
  details: RegistrationLogDetails = {},
): void {
  if (process.env.LOG_REGISTRATION === 'false') {
    return;
  }

  const payload = {
    ts: DateUtils.formatDateTimeForResponse(new Date()),
    requestId: (req as Request & { requestId?: string }).requestId,
    ip: getClientIp(req),
    event,
    status,
    accountId: details.accountId !== undefined ? String(details.accountId) : undefined,
    userId: details.userId,
    mode: details.mode,
    timingMs: details.timingMs,
  };

  // Print as single-line JSON for log aggregation
  // Intentionally avoid logging sensitive fields
  console.log(JSON.stringify(payload));
}
