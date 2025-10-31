import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoneProvider } from '../NoneProvider.js';
import type { EmailConfig } from '../../../../config/email.js';

describe('NoneProvider', () => {
  const emailSettings = {
    fromEmail: 'no-reply@example.com',
    fromName: 'Draco Sports Manager',
    provider: 'none' as const,
  };

  const emailConfig: EmailConfig = {};

  let provider: NoneProvider;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    provider = new NoneProvider(emailConfig, emailSettings);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success when sending email without dispatching', async () => {
    const result = await provider.sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('none-provider');
    expect(infoSpy).toHaveBeenCalled();
  });

  it('reports connection success', async () => {
    await expect(provider.testConnection()).resolves.toBe(true);
  });

  it('logs a warning when initialized', () => {
    expect(warnSpy).toHaveBeenCalled();
  });
});
