import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import { DateUtils } from '../utils/dateUtils.js';
import { logSecurely } from '../utils/auditLogger.js';
import validator from 'validator';

interface WorkoutRegistrationAccessEmail {
  accountId: bigint;
  accountName: string;
  workoutId: bigint;
  registrationId: bigint;
  accessCode: string;
  recipient: { name: string; email: string };
  workoutDesc: string;
  workoutDate: Date;
}

export class WorkoutRegistrantAccessEmailService {
  constructor(
    private readonly getProvider = () => EmailProviderFactory.getProvider(),
    private readonly getEmailSettings = () => EmailConfigFactory.getEmailSettings(),
    private readonly getBaseUrl = () => EmailConfigFactory.getBaseUrl(),
  ) {}

  async sendAccessEmail(payload: WorkoutRegistrationAccessEmail): Promise<void> {
    const provider = await this.getProvider();
    const settings = this.getEmailSettings();
    const baseUrl = this.getBaseUrl().replace(/\/$/, '');
    const verificationUrl = `${baseUrl}/account/${payload.accountId.toString()}/workouts/${payload.workoutId.toString()}/verify-registration/${payload.registrationId.toString()}?code=${payload.accessCode}`;

    const formattedDate =
      DateUtils.formatDateTimeForResponse(payload.workoutDate) ?? payload.workoutDate.toISOString();

    const accountName = this.escapeHtml(payload.accountName || 'Your account');
    const workoutDesc = this.escapeHtml(payload.workoutDesc);
    const greetingName = this.escapeHtml(payload.recipient.name?.trim() || 'there');
    const sanitizedVerificationUrl = this.escapeHtml(verificationUrl);
    const sanitizedAccessCode = this.escapeHtml(payload.accessCode);
    const sanitizedDate = this.escapeHtml(formattedDate);

    const htmlBody = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 28px rgba(31, 41, 55, 0.08); overflow: hidden;">
          <div style="background: #1f3a60; color: #ffffff; padding: 18px 24px;">
            <div style="font-size: 18px; font-weight: 700;">${accountName}</div>
            <div style="margin-top: 4px; font-size: 14px; opacity: 0.9;">Workout registration confirmation</div>
          </div>
          <div style="padding: 24px; color: #0f172a; font-size: 15px; line-height: 1.6;">
            <p style="margin: 0 0 12px;">Hi ${greetingName},</p>
            <p style="margin: 0 0 12px;">Registration successful for <strong>${workoutDesc}</strong> at ${accountName}.</p>
            <p style="margin: 0 0 12px;">You can view, edit, or cancel your registration using this secure link:</p>
            <p style="margin: 0 0 16px;">
              <a href="${sanitizedVerificationUrl}" style="background: #1f7ae0; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">Manage registration</a>
            </p>
            <p style="margin: 0 0 16px; color: #1f7ae0; word-break: break-all;">${sanitizedVerificationUrl}</p>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 0 0 16px;">
              <div style="font-weight: 700; margin-bottom: 6px; color: #0f172a;">Access code</div>
              <div style="font-size: 16px; letter-spacing: 0.3px; color: #0f172a;">${sanitizedAccessCode}</div>
              <div style="margin-top: 10px; color: #475569;">Workout date and time: ${sanitizedDate}</div>
            </div>
            <p style="margin: 0 0 4px; color: #475569;">If you did not request this, you can ignore this email.</p>
          </div>
        </div>
      </div>
    `;

    const textBody = [
      `Registration successful for ${payload.accountName} ${payload.workoutDesc}`,
      '',
      `Hi ${payload.recipient.name?.trim() || 'there'},`,
      '',
      `You can view, edit, or cancel your registration using this secure link:`,
      verificationUrl,
      '',
      `Access code: ${payload.accessCode}`,
      `Workout date and time: ${formattedDate}`,
      '',
      `If you did not request this, you can ignore this email.`,
    ].join('\n');

    try {
      await provider.sendEmail({
        to: payload.recipient.email,
        subject: `Registration successful for ${payload.accountName} ${payload.workoutDesc}`,
        html: htmlBody,
        text: textBody,
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      });
    } catch (error) {
      logSecurely('error', 'Failed to send workout registration access email', {
        error,
        registrationId: payload.registrationId.toString(),
      });
    }
  }

  private escapeHtml(value: string): string {
    return validator.escape(value ?? '');
  }
}
