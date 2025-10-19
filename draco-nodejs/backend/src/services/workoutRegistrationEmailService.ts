import validator from 'validator';
import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import type { IEmailProvider, EmailOptions } from '../interfaces/emailInterfaces.js';

type EmailRecipient = {
  name: string;
  email: string;
};

interface WorkoutEmailContext {
  accountId: bigint;
  workoutDescription: string;
  workoutDate: Date;
  subject: string;
  bodyHtml: string;
  recipients: EmailRecipient[];
}

const stripHtml = (value: string): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildWorkoutUrl = (baseUrl: string, accountId: bigint) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}/account/${accountId.toString()}/workouts`;
};

export class WorkoutRegistrationEmailService {
  constructor(
    private readonly getProvider: () => Promise<IEmailProvider> = () =>
      EmailProviderFactory.getProvider(),
    private readonly getEmailSettings = () => EmailConfigFactory.getEmailSettings(),
    private readonly getBaseUrl = () => EmailConfigFactory.getBaseUrl(),
  ) {}

  async sendEmails(context: WorkoutEmailContext): Promise<void> {
    const provider = await this.getProvider();
    const settings = this.getEmailSettings();
    const baseUrl = this.getBaseUrl();
    const workoutUrl = buildWorkoutUrl(baseUrl, context.accountId);

    const htmlFooter = `\n<hr style="margin:24px 0; border:none; border-top:1px solid #e0e0e0;"/>\n<p style="font-size:12px; color:#555;">This message was sent via Draco Sports Manager.<br/>View workouts: <a href="${workoutUrl}">${workoutUrl}</a></p>`;

    const sanitizedRecipients = context.recipients
      .map((recipient) => ({
        name: recipient.name,
        email: recipient.email?.trim() ?? '',
      }))
      .filter((recipient) => this.isValidEmail(recipient.email));

    const dedupedRecipients = Array.from(
      new Map(
        sanitizedRecipients.map((recipient) => [recipient.email.toLowerCase(), recipient]),
      ).values(),
    );

    if (dedupedRecipients.length === 0) {
      return;
    }

    const textBody = [stripHtml(context.bodyHtml), '', `View workouts: ${workoutUrl}`]
      .join('\n')
      .trim();

    const htmlBody = `${context.bodyHtml}${htmlFooter}`;

    await Promise.all(
      dedupedRecipients.map(async (recipient) => {
        const mailOptions: EmailOptions = {
          to: recipient.email,
          subject: context.subject,
          html: htmlBody,
          text: textBody,
          from: settings.fromEmail,
          fromName: settings.fromName,
          replyTo: settings.replyTo,
        };

        try {
          await provider.sendEmail(mailOptions);
        } catch (error) {
          console.error(`Failed to send workout registration email to ${recipient.email}:`, error);
        }
      }),
    );
  }

  private isValidEmail(email: string): boolean {
    return Boolean(email) && validator.isEmail(email, { allow_display_name: false });
  }
}
