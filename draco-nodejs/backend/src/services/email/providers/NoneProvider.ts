// No-op Email Provider for Draco Sports Manager
// Used when outbound email is intentionally disabled

import { EmailConfig } from '../../../config/email.js';
import {
  EmailOptions,
  EmailResult,
  EmailSettings,
  IEmailProvider,
} from '../../../interfaces/emailInterfaces.js';

export class NoneProvider implements IEmailProvider {
  constructor(
    _config: EmailConfig,
    private readonly settings: EmailSettings,
  ) {
    void _config;
    console.warn(
      `Email provider set to "none" – emails will not be sent (from: ${this.settings.fromEmail}, name: ${this.settings.fromName})`,
    );
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    console.info('NoneProvider intercepted email send request; no email dispatched.', {
      to: recipients,
      subject: options.subject,
      hasHtml: Boolean(options.html),
      hasText: Boolean(options.text),
      attachmentCount: options.attachments?.length ?? 0,
    });

    return {
      success: true,
      messageId: 'none-provider',
      previewUrl: undefined,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
