import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

function decodeJti(token: string): string | undefined {
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object' && typeof decoded.jti === 'string') {
      return decoded.jti;
    }
  } catch {
    // fall through
  }
  return undefined;
}

describe('rate-limit jti extraction', () => {
  it('extracts jti from a valid JWT without verifying signature', () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        jti: 'abc-123',
        scope: 'mcp:read',
        aud: 'mcp',
        iss: 'https://test.draco.com',
      },
      'any-secret',
    );
    expect(decodeJti(token)).toBe('abc-123');
  });

  it('returns undefined for a non-JWT string', () => {
    expect(decodeJti('not-a-jwt')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(decodeJti('')).toBeUndefined();
  });

  it('returns undefined when jti claim is missing', () => {
    const token = jwt.sign({ sub: 'user-1', scope: 'mcp:read' }, 'secret');
    expect(decodeJti(token)).toBeUndefined();
  });

  it('returns undefined when jti is not a string', () => {
    const token = jwt.sign({ sub: 'user-1', jti: 42 }, 'secret');
    expect(decodeJti(token)).toBeUndefined();
  });
});
