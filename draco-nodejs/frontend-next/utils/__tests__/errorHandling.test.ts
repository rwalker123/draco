import { describe, expect, it, beforeEach } from 'vitest';
import {
  createEmailRecipientError,
  normalizeError,
  handleApiError,
  getErrorSeverity,
  getRecoveryActions,
  withRetry,
  safeAsync,
  safe,
  parseApiError,
  createApiErrorMessage,
  configureErrorHandling,
} from '../errorHandling';
import { EmailRecipientErrorCode, ErrorSeverity } from '../../types/errors';

beforeEach(() => {
  configureErrorHandling({ enableLogging: false });
});

describe('createEmailRecipientError', () => {
  it('creates error with defaults', () => {
    const error = createEmailRecipientError(
      EmailRecipientErrorCode.NETWORK_ERROR,
      'Connection failed',
    );
    expect(error.code).toBe(EmailRecipientErrorCode.NETWORK_ERROR);
    expect(error.message).toBe('Connection failed');
    expect(error.userMessage).toBeTruthy();
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.recoverable).toBe(true);
    expect(error.retryable).toBe(true);
  });

  it('allows custom options', () => {
    const error = createEmailRecipientError(
      EmailRecipientErrorCode.VALIDATION_FAILED,
      'Bad input',
      { userMessage: 'Custom message', recoverable: false, retryable: false },
    );
    expect(error.userMessage).toBe('Custom message');
    expect(error.recoverable).toBe(false);
    expect(error.retryable).toBe(false);
  });
});

describe('normalizeError', () => {
  it('normalizes standard Error', () => {
    const error = normalizeError(new Error('Something broke'));
    expect(error.code).toBeTruthy();
    expect(error.message).toBe('Something broke');
  });

  it('normalizes string error', () => {
    const error = normalizeError('string error');
    expect(error.code).toBe(EmailRecipientErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('string error');
  });

  it('passes through EmailRecipientError', () => {
    const original = createEmailRecipientError(EmailRecipientErrorCode.RATE_LIMITED, 'Too many');
    const normalized = normalizeError(original);
    expect(normalized.code).toBe(EmailRecipientErrorCode.RATE_LIMITED);
  });

  it('infers error codes from message patterns', () => {
    const networkError = normalizeError(new Error('network connection lost'));
    expect(networkError.code).toBe(EmailRecipientErrorCode.NETWORK_ERROR);

    const timeoutError = normalizeError(new Error('request timeout'));
    expect(timeoutError.code).toBe(EmailRecipientErrorCode.API_TIMEOUT);

    const authError = normalizeError(new Error('unauthorized access'));
    expect(authError.code).toBe(EmailRecipientErrorCode.AUTHENTICATION_REQUIRED);
  });
});

describe('handleApiError', () => {
  it('handles 401 status', () => {
    const response = new Response(null, { status: 401, statusText: 'Unauthorized' });
    const error = handleApiError(response);
    expect(error.code).toBe(EmailRecipientErrorCode.AUTHENTICATION_REQUIRED);
    expect(error.retryable).toBe(false);
  });

  it('handles 403 status', () => {
    const response = new Response(null, { status: 403, statusText: 'Forbidden' });
    const error = handleApiError(response);
    expect(error.code).toBe(EmailRecipientErrorCode.AUTHORIZATION_DENIED);
  });

  it('handles 404 status', () => {
    const response = new Response(null, { status: 404, statusText: 'Not Found' });
    const error = handleApiError(response);
    expect(error.code).toBe(EmailRecipientErrorCode.CONTACT_NOT_FOUND);
  });

  it('handles 429 rate limit', () => {
    const response = new Response(null, { status: 429 });
    const error = handleApiError(response);
    expect(error.code).toBe(EmailRecipientErrorCode.RATE_LIMITED);
    expect(error.retryable).toBe(true);
  });

  it('handles 500 server error', () => {
    const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });
    const error = handleApiError(response);
    expect(error.code).toBe(EmailRecipientErrorCode.SERVICE_UNAVAILABLE);
    expect(error.retryable).toBe(true);
  });
});

describe('getErrorSeverity', () => {
  it('returns HIGH for authentication errors', () => {
    const error = createEmailRecipientError(
      EmailRecipientErrorCode.AUTHENTICATION_REQUIRED,
      'Auth required',
    );
    expect(getErrorSeverity(error)).toBe(ErrorSeverity.HIGH);
  });

  it('returns MEDIUM for authorization errors', () => {
    const error = createEmailRecipientError(EmailRecipientErrorCode.AUTHORIZATION_DENIED, 'Denied');
    expect(getErrorSeverity(error)).toBe(ErrorSeverity.MEDIUM);
  });

  it('returns LOW for validation errors', () => {
    const error = createEmailRecipientError(EmailRecipientErrorCode.VALIDATION_FAILED, 'Invalid');
    expect(getErrorSeverity(error)).toBe(ErrorSeverity.LOW);
  });
});

describe('getRecoveryActions', () => {
  it('suggests login for auth errors', () => {
    const error = createEmailRecipientError(
      EmailRecipientErrorCode.AUTHENTICATION_REQUIRED,
      'Auth',
    );
    const actions = getRecoveryActions(error);
    expect(actions).toContain('Please log in again');
  });

  it('suggests connection check for network errors', () => {
    const error = createEmailRecipientError(EmailRecipientErrorCode.NETWORK_ERROR, 'Network');
    const actions = getRecoveryActions(error);
    expect(actions).toContain('Check your internet connection');
  });

  it('suggests retry for retryable unknown errors', () => {
    const error = createEmailRecipientError(EmailRecipientErrorCode.UNKNOWN_ERROR, 'Unknown', {
      retryable: true,
    });
    const actions = getRecoveryActions(error);
    expect(actions).toContain('Try again');
  });
});

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const result = await withRetry(() => Promise.resolve('success'));
    expect(result).toBe('success');
  });

  it('retries on failure and succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 2) throw new Error('network error');
        return Promise.resolve('recovered');
      },
      { maxRetries: 3, initialDelayMs: 1 },
    );
    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('throws after exhausting retries', async () => {
    await expect(
      withRetry(
        () => {
          throw new Error('network error');
        },
        { maxRetries: 1, initialDelayMs: 1 },
      ),
    ).rejects.toBeTruthy();
  });
});

describe('safeAsync', () => {
  it('returns success result', async () => {
    const result = await safeAsync(() => Promise.resolve(42));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it('catches errors and returns failure', async () => {
    const result = await safeAsync(() => Promise.reject(new Error('fail')));
    expect(result.success).toBe(false);
  });
});

describe('safe', () => {
  it('returns success result', () => {
    const result = safe(() => 'hello');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello');
    }
  });

  it('catches thrown errors', () => {
    const result = safe(() => {
      throw new Error('oops');
    });
    expect(result.success).toBe(false);
  });
});

describe('parseApiError', () => {
  it('returns default for null/undefined', () => {
    expect(parseApiError(null).message).toBe('An unexpected error occurred');
    expect(parseApiError(undefined).message).toBe('An unexpected error occurred');
  });

  it('returns string response directly', () => {
    expect(parseApiError('Custom error').message).toBe('Custom error');
  });

  it('extracts message from object', () => {
    expect(parseApiError({ message: 'Server error' }).message).toBe('Server error');
  });

  it('extracts error field from object', () => {
    expect(parseApiError({ error: 'Bad request' }).message).toBe('Bad request');
  });

  it('handles validation errors with details array', () => {
    const result = parseApiError({
      message: 'Validation failed',
      details: [{ type: 'field', msg: 'Required', path: 'email' }],
    });
    expect(result.hasValidationErrors).toBe(true);
    expect(result.message).toContain('email');
  });

  it('handles structured validation errors', () => {
    const result = parseApiError({
      message: 'Validation failed',
      errors: { name: ['is required'], email: ['is invalid'] },
    });
    expect(result.hasValidationErrors).toBe(true);
    expect(result.message).toContain('name');
    expect(result.message).toContain('email');
  });

  it('handles array validation errors', () => {
    const result = parseApiError({
      errors: ['Error 1', 'Error 2'],
    });
    expect(result.hasValidationErrors).toBe(true);
    expect(result.message).toContain('Error 1');
  });
});

describe('createApiErrorMessage', () => {
  it('uses parsed message when available', () => {
    const response = new Response(null, { status: 400, statusText: 'Bad Request' });
    const result = createApiErrorMessage('Create user', response, {
      message: 'Email already exists',
    });
    expect(result).toBe('Create user: Email already exists');
  });

  it('falls back to status text', () => {
    const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });
    const result = createApiErrorMessage('Delete item', response);
    expect(result).toBe('Delete item: Internal Server Error');
  });
});
