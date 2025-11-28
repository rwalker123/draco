import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import { htmlToPlainText } from '../utils/emailContent.js';
import { DateUtils } from '../utils/dateUtils.js';
import { logSecurely } from '../utils/auditLogger.js';

interface WorkoutRegistrationAccessEmail {
  accountId: bigint;
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

    const greetingName = payload.recipient.name?.trim() || 'there';

    const htmlBody = `
      <p>Hi ${greetingName},</p>
      <p>Thank you for registering for <strong>${payload.workoutDesc}</strong>.</p>
      <p>You can edit or cancel your registration anytime using this secure link:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p><strong>Your access code:</strong> ${payload.accessCode}</p>
      <p>Workout date and time: ${formattedDate}</p>
      <p>If you did not request this, you can ignore this email.</p>
    `;

    const textBody = htmlToPlainText(htmlBody);

    try {
      await provider.sendEmail({
        to: payload.recipient.email,
        subject: `Update your registration for ${payload.workoutDesc}`,
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
}
