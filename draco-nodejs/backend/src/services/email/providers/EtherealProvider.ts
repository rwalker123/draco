// Ethereal Email Provider
// Follows LSP - implements IEmailProvider interface

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  IEmailProvider,
  EmailOptions,
  EmailResult,
  EtherealTestAccount,
} from '../../../interfaces/emailInterfaces.js';
import { EmailConfig } from '../../../config/email.js';

export class EtherealProvider implements IEmailProvider {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private testAccount: EtherealTestAccount | null = null;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Initialize transporter if not already done
      if (!this.transporter) {
        await this.initializeTransporter();
      }

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

      const result = await this.transporter!.sendMail(mailOptions);

      // Generate preview URL for Ethereal Email
      const previewUrl = nodemailer.getTestMessageUrl(result) || undefined;

      return {
        success: true,
        messageId: result.messageId,
        previewUrl,
      };
    } catch (error) {
      console.error('Ethereal email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email send error',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      await this.transporter!.verify();
      return true;
    } catch (error) {
      console.error('Ethereal connection test failed:', error);
      return false;
    }
  }

  private async initializeTransporter(): Promise<void> {
    try {
      // Use existing credentials if provided, otherwise create test account
      if (this.config.auth?.user && this.config.auth?.pass) {
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure ?? false,
          auth: this.config.auth,
        });
      } else {
        // Create dynamic test account for development
        this.testAccount = await nodemailer.createTestAccount();

        const testConfig = {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure ?? false,
          auth: {
            user: this.testAccount?.user || '',
            pass: this.testAccount?.pass || '',
          },
        };

        this.transporter = nodemailer.createTransport(testConfig);

        console.log('Ethereal Email test account created:');
        console.log(`  User: ${this.testAccount?.user}`);
        console.log(`  Pass: ${this.testAccount?.pass}`);
        console.log('  Emails will be captured at https://ethereal.email');
      }
    } catch (error) {
      throw new Error(`Failed to initialize Ethereal Email provider: ${error}`);
    }
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || 'noreply@ezrecsports.com';
    const fromName = name || 'ezRecSports.com';
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * Get test account info for debugging
   */
  getTestAccountInfo(): EtherealTestAccount | null {
    return this.testAccount;
  }
}
