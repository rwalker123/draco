// AWS SES Email Provider for Draco Sports Manager
// Implements IEmailProvider interface using Nodemailer's SMTP transport

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { EmailConfig } from '../../../config/email.js';
import type { EmailOptions, EmailResult, IEmailProvider } from '../../../interfaces/emailInterfaces.js';

export class SesProvider implements IEmailProvider {
  private readonly transporter: Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: this.formatFromAddress(options.from, options.fromName),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          path: attachment.path,
          contentType: attachment.contentType,
        })),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('SES email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email send error',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SES connection test failed:', error);
      return false;
    }
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || 'noreply@example.com';
    const fromName = name || 'Draco Sports Manager';
    return `"${fromName}" <${fromEmail}>`;
  }
}
