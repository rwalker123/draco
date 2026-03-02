import { describe, expect, it } from 'vitest';
import {
  ApiClientError,
  getApiErrorMessage,
  unwrapApiResult,
  assertNoApiError,
} from '../apiResult';

describe('ApiClientError', () => {
  it('creates an error with message', () => {
    const err = new ApiClientError('Something failed');
    expect(err.message).toBe('Something failed');
    expect(err.name).toBe('ApiClientError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiClientError);
  });

  it('stores status and details', () => {
    const details = { message: 'Not found' };
    const err = new ApiClientError('Not found', { status: 404, details });
    expect(err.status).toBe(404);
    expect(err.details).toEqual(details);
  });

  it('sets cause when details is an Error', () => {
    const original = new Error('original');
    const err = new ApiClientError('wrapped', { details: original });
    expect((err as { cause?: unknown }).cause).toBe(original);
  });
});

describe('getApiErrorMessage', () => {
  it('returns fallback for null/undefined', () => {
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('extracts detail string', () => {
    expect(getApiErrorMessage({ detail: 'Custom detail' }, 'fallback')).toBe('Custom detail');
  });

  it('extracts message string', () => {
    expect(getApiErrorMessage({ message: 'Custom message' }, 'fallback')).toBe('Custom message');
  });

  it('prefers detail over message', () => {
    expect(
      getApiErrorMessage({ detail: 'Detail wins', message: 'Message loses' }, 'fallback'),
    ).toBe('Detail wins');
  });

  it('returns fallback for empty detail/message', () => {
    expect(getApiErrorMessage({ detail: '  ', message: '  ' }, 'fallback')).toBe('fallback');
  });

  it('returns fallback for non-object error', () => {
    expect(getApiErrorMessage('string error', 'fallback')).toBe('fallback');
  });
});

describe('unwrapApiResult', () => {
  it('returns data when present and no error', () => {
    const result = { data: { id: '1' } };
    expect(unwrapApiResult(result, 'fail')).toEqual({ id: '1' });
  });

  it('throws ApiClientError when error is present', () => {
    const result = { error: { message: 'Bad request' }, response: { status: 400 } as Response };
    expect(() => unwrapApiResult(result, 'fallback')).toThrow(ApiClientError);
    try {
      unwrapApiResult(result, 'fallback');
    } catch (e) {
      const err = e as ApiClientError;
      expect(err.message).toBe('Bad request');
      expect(err.status).toBe(400);
    }
  });

  it('throws ApiClientError when data is undefined and no error', () => {
    const result = { data: undefined };
    expect(() => unwrapApiResult(result, 'No data')).toThrow(ApiClientError);
    expect(() => unwrapApiResult(result, 'No data')).toThrow('No data');
  });
});

describe('assertNoApiError', () => {
  it('does not throw when no error', () => {
    expect(() => assertNoApiError({}, 'fallback')).not.toThrow();
  });

  it('throws ApiClientError when error is present', () => {
    const result = { error: { detail: 'Forbidden' }, response: { status: 403 } as Response };
    expect(() => assertNoApiError(result, 'fallback')).toThrow(ApiClientError);
    expect(() => assertNoApiError(result, 'fallback')).toThrow('Forbidden');
  });
});
