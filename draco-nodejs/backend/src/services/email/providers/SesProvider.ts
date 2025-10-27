// AWS SES Email Provider for Draco Sports Manager
// Uses AWS SDK over HTTPS to avoid SMTP limitations in hosted environments

import { SESClient, SendRawEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import type { AwsCredentialIdentity } from '@aws-sdk/types';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

import type { EmailConfig } from '../../../config/email.js';
import type {
  EmailOptions,
  EmailResult,
  IEmailProvider,
} from '../../../interfaces/emailInterfaces.js';
import { htmlToPlainText } from '../../../utils/emailContent.js';

export class SesProvider implements IEmailProvider {
  private readonly client: SESClient;
  private readonly defaultFromEmail: string;

  constructor(config: EmailConfig) {
    const region = config.region || process.env.SES_REGION || process.env.AWS_REGION;

    if (!region) {
      throw new Error('SES region is not configured (set SES_REGION or AWS_REGION)');
    }

    const credentials =
      config.credentials ||
      this.resolveCredentialsFromEnv(process.env, 'SES') ||
      this.resolveCredentialsFromEnv(process.env, 'AWS') ||
      undefined;

    if (!credentials) {
      throw new Error(
        'SES credentials are not configured (set SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY or AWS equivalents)',
      );
    }

    this.client = new SESClient({
      region,
      credentials,
    });

    this.defaultFromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const destinations = Array.isArray(options.to) ? options.to : [options.to];
      const fromAddress = this.formatFromAddress(options.from, options.fromName);
      const mail = new MailComposer({
        from: fromAddress,
        to: destinations.join(', '),
        subject: options.subject,
        text: options.text ?? htmlToPlainText(options.html),
        html: options.html || undefined,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          path: attachment.path,
          contentType: attachment.contentType,
        })),
      });

      const rawMessage = await mail.compile().build();

      const command = new SendRawEmailCommand({
        Source: this.extractEmailAddress(fromAddress) || this.defaultFromEmail,
        Destinations: destinations,
        RawMessage: {
          Data: rawMessage,
        },
        ...(process.env.SES_SOURCE_ARN ? { SourceArn: process.env.SES_SOURCE_ARN } : {}),
        ...(process.env.SES_FROM_ARN ? { FromArn: process.env.SES_FROM_ARN } : {}),
      });

      const response = await this.client.send(command);

      return {
        success: true,
        messageId: response.MessageId,
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
      await this.client.send(new GetSendQuotaCommand({}));
      return true;
    } catch (error) {
      console.error('SES connection test failed:', error);
      return false;
    }
  }

  private resolveCredentialsFromEnv(
    env: NodeJS.ProcessEnv,
    prefix: 'SES' | 'AWS',
  ): AwsCredentialIdentity | null {
    const accessKeyId = env[`${prefix}_ACCESS_KEY_ID`];
    const secretAccessKey = env[`${prefix}_SECRET_ACCESS_KEY`];
    const sessionToken = env[`${prefix}_SESSION_TOKEN`];

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || this.defaultFromEmail;
    const fromName = name?.trim();

    if (fromName) {
      return `"${this.escapeQuotes(fromName)}" <${fromEmail}>`;
    }

    return fromEmail;
  }

  private extractEmailAddress(address: string): string | null {
    const match = address.match(/<([^>]+)>/);
    if (match) {
      return match[1];
    }

    if (address.includes('@')) {
      return address;
    }

    return null;
  }

  private escapeQuotes(value: string): string {
    return value.replace(/"/g, '\\"');
  }
}
