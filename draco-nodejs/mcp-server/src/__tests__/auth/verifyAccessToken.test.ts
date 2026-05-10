import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-32-chars-long',
    MCP_AUDIENCE: 'mcp',
    OAUTH_ISSUER: 'https://test.draco.com',
    MCP_PORT: 3010,
    BACKEND_BASE_URL: 'http://localhost:3001',
    OAUTH_RESOURCE_METADATA_URL: 'http://localhost:3001/.well-known/oauth-protected-resource',
    LOG_LEVEL: 'info',
    NODE_ENV: 'test',
  },
}));

const { verifyAccessToken, AuthenticationError } = await import('../../auth/verifyAccessToken.js');

const SECRET = 'test-secret-at-least-32-chars-long';
const ISSUER = 'https://test.draco.com';
const AUDIENCE = 'mcp';

function makePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'user-123',
    aud: AUDIENCE,
    iss: ISSUER,
    scope: 'mcp:read',
    client_id: 'client-abc',
    jti: 'jti-xyz',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

function signToken(payload: Record<string, unknown>, secret = SECRET): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', noTimestamp: true });
}

describe('verifyAccessToken', () => {
  describe('valid token', () => {
    it('returns parsed claims for a well-formed token', async () => {
      const token = signToken(makePayload());
      const result = await verifyAccessToken(token);
      expect(result.userId).toBe('user-123');
      expect(result.scopes).toEqual(['mcp:read']);
      expect(result.jti).toBe('jti-xyz');
      expect(result.clientId).toBe('client-abc');
      expect(typeof result.expiresAt).toBe('number');
    });

    it('parses multiple scopes correctly', async () => {
      const token = signToken(makePayload({ scope: 'mcp:read mcp:write' }));
      const result = await verifyAccessToken(token);
      expect(result.scopes).toEqual(['mcp:read', 'mcp:write']);
    });
  });

  describe('expired token', () => {
    it('throws AuthenticationError when token is expired', async () => {
      const token = signToken(makePayload({ exp: Math.floor(Date.now() / 1000) - 10 }));
      await expect(verifyAccessToken(token)).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('wrong audience', () => {
    it('throws AuthenticationError when aud does not match', async () => {
      const token = signToken(makePayload({ aud: 'wrong-audience' }));
      await expect(verifyAccessToken(token)).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('wrong issuer', () => {
    it('throws AuthenticationError when iss does not match', async () => {
      const token = signToken(makePayload({ iss: 'https://evil.com' }));
      await expect(verifyAccessToken(token)).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('malformed token', () => {
    it('throws AuthenticationError for garbage input', async () => {
      await expect(verifyAccessToken('not.a.token')).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('throws AuthenticationError for empty string', async () => {
      await expect(verifyAccessToken('')).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('wrong signature', () => {
    it('throws AuthenticationError when signed with wrong secret', async () => {
      const token = signToken(makePayload(), 'different-secret-that-is-long-enough');
      await expect(verifyAccessToken(token)).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('none algorithm rejection', () => {
    it('throws AuthenticationError for none algorithm tokens', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify(makePayload())).toString('base64url');
      const noneToken = `${header}.${body}.`;
      await expect(verifyAccessToken(noneToken)).rejects.toBeInstanceOf(AuthenticationError);
    });
  });
});
