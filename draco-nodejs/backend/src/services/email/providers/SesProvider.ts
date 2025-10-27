// AWS SES Email Provider for Draco Sports Manager
// Uses AWS SDK over HTTPS to avoid SMTP limitations in hosted environments

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { SESClient, SendRawEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

import type { EmailConfig } from '../../../config/email.js';
import type {
  EmailOptions,
  EmailResult,
  IEmailProvider,
  ServerEmailAttachment,
} from '../../../interfaces/emailInterfaces.js';

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
      const rawMessage = await this.buildRawMessage(options, fromAddress, destinations);

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

  private async buildRawMessage(
    options: EmailOptions,
    fromAddress: string,
    destinations: string[],
  ): Promise<Uint8Array> {
    const mixedBoundary = `Mixed_${randomUUID()}`;
    const alternativeBoundary = `Alt_${randomUUID()}`;

    const headers: string[] = [
      `From: ${fromAddress}`,
      `To: ${destinations.join(', ')}`,
      `Subject: ${this.encodeHeader(options.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    ];

    if (options.replyTo) {
      headers.splice(2, 0, `Reply-To: ${options.replyTo}`);
    }

    const body: string[] = [];

    body.push(`--${mixedBoundary}`);
    body.push(`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`);
    body.push('');

    const textContent = options.text ?? this.toPlainText(options.html);
    body.push(`--${alternativeBoundary}`);
    body.push('Content-Type: text/plain; charset="utf-8"');
    body.push('Content-Transfer-Encoding: 7bit');
    body.push('');
    body.push(textContent || '');
    body.push('');

    body.push(`--${alternativeBoundary}`);
    body.push('Content-Type: text/html; charset="utf-8"');
    body.push('Content-Transfer-Encoding: 7bit');
    body.push('');
    body.push(options.html || '');
    body.push('');
    body.push(`--${alternativeBoundary}--`);
    body.push('');

    const attachments = options.attachments ?? [];
    for (const attachment of attachments) {
      const attachmentPart = await this.buildAttachmentPart(attachment, mixedBoundary);
      if (attachmentPart) {
        body.push(attachmentPart);
      }
    }

    body.push(`--${mixedBoundary}--`);
    body.push('');

    const message = [...headers, '', ...body].join('\r\n');
    return Buffer.from(message, 'utf-8');
  }

  private async buildAttachmentPart(
    attachment: ServerEmailAttachment,
    boundary: string,
  ): Promise<string | null> {
    let data: Buffer | undefined;

    if (attachment.content) {
      data = attachment.content;
    } else if (attachment.path) {
      try {
        data = await readFile(attachment.path);
      } catch (error) {
        console.error(`Failed to read attachment at path ${attachment.path}:`, error);
      }
    }

    if (!data) {
      return null;
    }

    const contentType = attachment.contentType || 'application/octet-stream';
    const encoded = this.chunkBase64(data.toString('base64'));
    const safeFilename = this.escapeQuotes(attachment.filename);

    return [
      `--${boundary}`,
      `Content-Type: ${contentType}; name="${safeFilename}"`,
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      encoded,
      '',
    ].join('\r\n');
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

  private chunkBase64(value: string, size = 76): string {
    return value.replace(new RegExp(`(.{${size}})`, 'g'), '$1\r\n');
  }

  private encodeHeader(value: string): string {
    return /[\u007f-\uffff]/.test(value)
      ? `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`
      : value;
  }

  private toPlainText(html?: string): string {
    if (!html) {
      return '';
    }

    return html
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .trim();
  }
}
