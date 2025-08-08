import { AuthService } from '../authService';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { describe, it, expect } from 'vitest';

interface TestJwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

describe('AuthService', () => {
  const authService = new AuthService();

  describe('verifyPassword', () => {
    it('should return true for a valid password and hash', async () => {
      const password = 'testPassword123!'; // pragma: allowlist secret
      const hash = await bcrypt.hash(password, 10); // pragma: allowlist secret
      // @ts-expect-error: testing private method
      const result = await authService.verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for an invalid password', async () => {
      const password = 'testPassword123!'; // pragma: allowlist secret
      const hash = await bcrypt.hash(password, 10); // pragma: allowlist secret
      // @ts-expect-error: testing private method
      const result = await authService.verifyPassword('wrongPassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      // @ts-expect-error: testing private method
      const token = authService.generateToken('user123', 'testuser');
      const decoded = jwt.decode(token) as TestJwtPayload;
      expect(decoded.userId).toBe('user123');
      expect(decoded.username).toBe('testuser');
    });
  });
});
