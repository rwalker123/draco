import { EmailService, EmailConfig } from '../email/emailService.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Ensure we run in development provider mode (Ethereal)
process.env.NODE_ENV = 'development';

describe('EmailService (development provider)', () => {
  const config: EmailConfig = {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: '', pass: '' },
  };
  const fromEmail = 'noreply@example.com';
  const baseUrl = 'https://example.com';
  const emailService = new EmailService(config, fromEmail, baseUrl);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a password reset email (Ethereal)', async () => {
    const result = await emailService.sendPasswordResetEmail(
      'to@example.com',
      'testuser',
      'token123',
    );
    // With Ethereal, sending should succeed and return true
    expect(result).toBe(true);
  });

  it('should verify email connection (Ethereal)', async () => {
    const result = await emailService.testConnection();
    expect(result).toBe(true);
  });
});
