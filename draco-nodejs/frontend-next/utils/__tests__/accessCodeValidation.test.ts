import { describe, expect, it, beforeEach } from 'vitest';
import {
  validateAccessCode,
  validatePartialAccessCode,
  sanitizeAccessCodeInput,
  formatAccessCodeForDisplay,
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  hasValidAccessCodePotential,
  getValidationProgress,
  ACCESS_CODE_LENGTH,
  ACCESS_CODE_MIN_LENGTH,
  RATE_LIMIT_CONFIG,
} from '../accessCodeValidation';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('validateAccessCode', () => {
  it('returns invalid for empty input', () => {
    const result = validateAccessCode('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Access code is required');
  });

  it('returns invalid for whitespace-only', () => {
    const result = validateAccessCode('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Access code cannot be empty');
  });

  it('returns invalid for wrong length', () => {
    const result = validateAccessCode('too-short');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(`${ACCESS_CODE_LENGTH} characters`);
  });

  it('returns invalid for non-UUID format', () => {
    const result = validateAccessCode('x'.repeat(ACCESS_CODE_LENGTH));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('UUID format');
  });

  it('returns valid with sanitized lowercase value for valid UUID', () => {
    const result = validateAccessCode(VALID_UUID);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(VALID_UUID.toLowerCase());
  });

  it('handles uppercase UUID', () => {
    const result = validateAccessCode(VALID_UUID.toUpperCase());
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(VALID_UUID.toLowerCase());
  });
});

describe('validatePartialAccessCode', () => {
  it('returns invalid for empty input', () => {
    const result = validatePartialAccessCode('');
    expect(result.isValid).toBe(false);
  });

  it('returns error for too-short partial', () => {
    const result = validatePartialAccessCode('123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(`${ACCESS_CODE_MIN_LENGTH}`);
  });

  it('returns error for too-long partial', () => {
    const result = validatePartialAccessCode('a'.repeat(ACCESS_CODE_LENGTH + 5));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed');
  });

  it('returns sanitized value for valid-length partial', () => {
    const partial = 'a'.repeat(ACCESS_CODE_MIN_LENGTH);
    const result = validatePartialAccessCode(partial);
    expect(result.sanitizedValue).toBe(partial.toLowerCase());
  });
});

describe('sanitizeAccessCodeInput', () => {
  it('returns empty for empty input', () => {
    expect(sanitizeAccessCodeInput('')).toBe('');
  });

  it('removes non-hex/non-hyphen characters', () => {
    expect(sanitizeAccessCodeInput('abc-xyz-123!')).toBe('abc--123');
  });

  it('truncates UUID parts to correct lengths', () => {
    const result = sanitizeAccessCodeInput('12345678-1234-1234-1234-123456789abc');
    expect(result).toBe('12345678-1234-1234-1234-123456789abc');
  });
});

describe('formatAccessCodeForDisplay', () => {
  it('returns empty for empty input', () => {
    expect(formatAccessCodeForDisplay('')).toBe('');
  });

  it('formats 32 hex chars as UUID', () => {
    const hex = '123e4567e89b12d3a456426614174000'; // pragma: allowlist secret
    const result = formatAccessCodeForDisplay(hex);
    expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('returns original if not 32 hex chars', () => {
    expect(formatAccessCodeForDisplay('short')).toBe('short');
  });
});

describe('checkRateLimit and recordAttempt', () => {
  const testAccountId = 'test-rate-limit-account';

  beforeEach(() => {
    resetRateLimit(testAccountId);
  });

  it('returns full attempts for new account', () => {
    const result = checkRateLimit(testAccountId);
    expect(result.attemptsRemaining).toBe(RATE_LIMIT_CONFIG.maxAttempts);
    expect(result.isBlocked).toBe(false);
  });

  it('decrements attempts after failed attempt', () => {
    recordAttempt(testAccountId, false);
    const result = checkRateLimit(testAccountId);
    expect(result.attemptsRemaining).toBe(RATE_LIMIT_CONFIG.maxAttempts - 1);
  });

  it('blocks after max attempts', () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxAttempts; i++) {
      recordAttempt(testAccountId, false);
    }
    const result = checkRateLimit(testAccountId);
    expect(result.isBlocked).toBe(true);
    expect(result.attemptsRemaining).toBe(0);
  });

  it('resets on successful attempt', () => {
    recordAttempt(testAccountId, false);
    recordAttempt(testAccountId, false);
    recordAttempt(testAccountId, true);
    const result = checkRateLimit(testAccountId);
    expect(result.attemptsRemaining).toBe(RATE_LIMIT_CONFIG.maxAttempts);
    expect(result.isBlocked).toBe(false);
  });
});

describe('hasValidAccessCodePotential', () => {
  it('returns false for empty/null', () => {
    expect(hasValidAccessCodePotential('')).toBe(false);
  });

  it('returns false for too short', () => {
    expect(hasValidAccessCodePotential('abc')).toBe(false);
  });

  it('returns false for invalid characters', () => {
    expect(hasValidAccessCodePotential('z'.repeat(ACCESS_CODE_MIN_LENGTH))).toBe(false);
  });

  it('returns true for valid hex string of valid length', () => {
    expect(hasValidAccessCodePotential('a'.repeat(ACCESS_CODE_MIN_LENGTH))).toBe(true);
  });
});

describe('getValidationProgress', () => {
  it('returns 0 for empty input', () => {
    expect(getValidationProgress('')).toBe(0);
  });

  it('returns 100 for full-length input', () => {
    expect(getValidationProgress(VALID_UUID)).toBe(100);
  });

  it('returns proportional percentage for partial input', () => {
    const half = VALID_UUID.slice(0, Math.floor(ACCESS_CODE_LENGTH / 2));
    const progress = getValidationProgress(half);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });
});
