import { EmailService, EmailConfig } from '../emailService';
import * as nodemailer from 'nodemailer';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('nodemailer');

const mockSendMail = vi.fn();
const mockVerify = vi.fn();

(nodemailer.createTransport as vi.MockedFunction).mockReturnValue({
  sendMail: mockSendMail,
  verify: mockVerify,
});

describe('EmailService', () => {
  const config: EmailConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'user', pass: 'pass' },
  };
  const fromEmail = 'noreply@example.com';
  const baseUrl = 'https://example.com';
  const emailService = new EmailService(config, fromEmail, baseUrl);

  beforeEach(() => {
    vi.clearAllMocks();
    (nodemailer.createTransport as vi.MockedFunction).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  it('should send a password reset email', async () => {
    mockSendMail.mockResolvedValueOnce(true);
    const result = await emailService.sendPasswordResetEmail(
      'to@example.com',
      'testuser',
      'token123',
    );
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should return false if sendMail throws', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('fail'));
    const result = await emailService.sendPasswordResetEmail(
      'to@example.com',
      'testuser',
      'token123',
    );
    expect(result).toBe(false);
  });

  it('should verify email connection', async () => {
    mockVerify.mockResolvedValueOnce(true);
    const result = await emailService.testConnection();
    expect(result).toBe(true);
    expect(mockVerify).toHaveBeenCalled();
  });

  it('should return false if verify throws', async () => {
    mockVerify.mockRejectedValueOnce(new Error('fail'));
    const result = await emailService.testConnection();
    expect(result).toBe(false);
  });
});
