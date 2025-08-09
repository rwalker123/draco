// SendGrid Email Provider for Draco Sports Manager
// Follows LSP - implements IEmailProvider interface

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');
import type { Transporter } from 'nodemailer';
import { IEmailProvider, EmailOptions, EmailResult } from '../../../interfaces/emailInterfaces';
import { EmailConfig } from '../../../config/email';

export class SendGridProvider implements IEmailProvider {
  private transporter: Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter(config);
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
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
        })),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('SendGrid email send error:', error);
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
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || 'noreply@example.com';
    const fromName = name || 'Draco Sports Manager';
    return `"${fromName}" <${fromEmail}>`;
  }
}
