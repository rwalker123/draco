import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import type { IEmailProvider, EmailOptions } from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import validator from 'validator';

type DetailRow = { label: string; value: string | null };
type EmailContent = {
  subject: string;
  htmlParagraphs: string[];
  textParagraphs: string[];
  detailRows: DetailRow[];
  cta?: { label: string; url: string } | null;
};

const FOOTER_TEXT =
  'This is an automated message from Draco Sports Manager. Please do not reply to this email.';

export class PhotoSubmissionNotificationService {
  constructor(
    private readonly getProvider: () => Promise<IEmailProvider> = () =>
      EmailProviderFactory.getProvider(),
    private readonly getEmailSettings = () => EmailConfigFactory.getEmailSettings(),
    private readonly getBaseUrl = () => EmailConfigFactory.getBaseUrl(),
  ) {}

  async sendSubmissionReceivedNotification(detail: PhotoSubmissionDetailType): Promise<void> {
    await this.dispatch(detail, this.buildReceivedEmail(detail));
  }

  async sendSubmissionApprovedNotification(detail: PhotoSubmissionDetailType): Promise<void> {
    await this.dispatch(detail, this.buildApprovedEmail(detail));
  }

  async sendSubmissionDeniedNotification(detail: PhotoSubmissionDetailType): Promise<void> {
    await this.dispatch(detail, this.buildDeniedEmail(detail));
  }

  private async dispatch(
    detail: PhotoSubmissionDetailType,
    content: EmailContent | null,
  ): Promise<void> {
    const recipientEmail = detail.submitter?.email ?? null;

    if (!this.hasValidEmail(recipientEmail) || !content) {
      return;
    }

    try {
      const provider = await this.getProvider();
      const settings = this.getEmailSettings();

      const options: EmailOptions = {
        to: recipientEmail,
        subject: content.subject,
        html: this.renderHtmlContent(content),
        text: this.renderTextContent(content),
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      const result = await provider.sendEmail(options);

      if (!result.success) {
        console.error('Failed to send photo submission notification email', result.error);
      }
    } catch (error) {
      console.error('Failed to send photo submission notification email', error);
    }
  }

  private buildReceivedEmail(detail: PhotoSubmissionDetailType): EmailContent {
    const greeting = this.buildGreeting(detail);
    const context = this.describeContext(detail);
    const galleryUrl = this.buildGalleryUrl(detail);

    return {
      subject: `Your photo submission "${detail.title}" is pending review`,
      htmlParagraphs: [
        `Hello ${this.escapeHtml(greeting)},`,
        `Thanks for sharing your photo with ${this.escapeHtml(detail.accountName)}. Your submission is pending review for ${this.escapeHtml(context)}. We'll email you once a moderator makes a decision.`,
        'You can sign in to review the status from your account dashboard at any time.',
      ],
      textParagraphs: [
        `Hello ${greeting},`,
        `Thanks for sharing your photo with ${detail.accountName}. Your submission is pending review for ${context}. We'll email you once a moderator makes a decision.`,
        'You can sign in to review the status from your account dashboard at any time.',
      ],
      detailRows: this.buildDetailRows(detail, {
        includeModerator: false,
        includeDenialReason: false,
        includeModeratedAt: false,
      }),
      cta: { label: 'View gallery', url: galleryUrl },
    };
  }

  private buildApprovedEmail(detail: PhotoSubmissionDetailType): EmailContent {
    const greeting = this.buildGreeting(detail);
    const context = this.describeContext(detail);
    const galleryUrl = this.buildGalleryUrl(detail);

    return {
      subject: `Your photo submission "${detail.title}" was approved`,
      htmlParagraphs: [
        `Hello ${this.escapeHtml(greeting)},`,
        `Great news! Your photo submission is now live in ${this.escapeHtml(context)} for ${this.escapeHtml(detail.accountName)}.`,
        'Thanks for contributing to the gallery.',
      ],
      textParagraphs: [
        `Hello ${greeting},`,
        `Great news! Your photo submission is now live in ${context} for ${detail.accountName}.`,
        'Thanks for contributing to the gallery.',
      ],
      detailRows: this.buildDetailRows(detail, {
        includeModerator: true,
        includeDenialReason: false,
        includeModeratedAt: true,
      }),
      cta: { label: 'View gallery', url: galleryUrl },
    };
  }

  private buildDeniedEmail(detail: PhotoSubmissionDetailType): EmailContent {
    const greeting = this.buildGreeting(detail);
    const context = this.describeContext(detail);
    const denialReason = detail.denialReason?.trim() || 'Not provided';

    return {
      subject: `Your photo submission "${detail.title}" was denied`,
      htmlParagraphs: [
        `Hello ${this.escapeHtml(greeting)},`,
        `Your recent photo submission for ${this.escapeHtml(context)} on ${this.escapeHtml(detail.accountName)} was denied by our moderators.`,
        `Reason provided: ${this.escapeHtml(denialReason)}.`,
        'You can update the photo and submit it again at any time.',
      ],
      textParagraphs: [
        `Hello ${greeting},`,
        `Your recent photo submission for ${context} on ${detail.accountName} was denied by our moderators.`,
        `Reason provided: ${denialReason}.`,
        'You can update the photo and submit it again at any time.',
      ],
      detailRows: this.buildDetailRows(detail, {
        includeModerator: true,
        includeDenialReason: true,
        includeModeratedAt: true,
      }),
      cta: null,
    };
  }

  private buildDetailRows(
    detail: PhotoSubmissionDetailType,
    options: {
      includeModerator: boolean;
      includeDenialReason: boolean;
      includeModeratedAt: boolean;
    },
  ): DetailRow[] {
    const rows: DetailRow[] = [{ label: 'Account', value: detail.accountName }];

    const albumValue = detail.album?.title ?? (detail.teamId ? 'Team gallery' : 'Account gallery');
    rows.push({ label: 'Album', value: albumValue });

    rows.push({ label: 'Title', value: detail.title });

    if (detail.caption) {
      rows.push({ label: 'Caption', value: detail.caption });
    }

    rows.push({ label: 'Submitted', value: this.formatTimestamp(detail.submittedAt) });

    if (options.includeModeratedAt) {
      rows.push({ label: 'Moderated', value: this.formatTimestamp(detail.moderatedAt) });
    }

    if (options.includeModerator && detail.moderator) {
      const name = `${detail.moderator.firstName} ${detail.moderator.lastName}`.trim();
      rows.push({ label: 'Moderator', value: name || detail.moderator.email || null });
    }

    if (options.includeDenialReason) {
      rows.push({ label: 'Denial reason', value: detail.denialReason ?? null });
    }

    return rows;
  }

  private renderHtmlContent(content: EmailContent): string {
    const detailRows = content.detailRows
      .filter((row) => row.value && row.value.trim().length > 0)
      .map(
        (row) =>
          `<tr><th>${this.escapeHtml(row.label)}</th><td>${this.escapeHtml(row.value!)} </td></tr>`,
      )
      .join('');

    const detailTable = detailRows ? `<table class="details">${detailRows}</table>` : '';

    const paragraphs = content.htmlParagraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');

    const ctaHtml = content.cta
      ? `<p><a href="${this.escapeHtml(content.cta.url)}" class="button">${this.escapeHtml(content.cta.label)}</a></p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${this.escapeHtml(content.subject)}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .details { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details th { text-align: left; padding: 8px 12px; background-color: #e9ecef; width: 35%; }
            .details td { padding: 8px 12px; background-color: #ffffff; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Draco Sports Manager</h1>
            </div>
            <div class="content">
              <h2>${this.escapeHtml(content.subject)}</h2>
              ${paragraphs}
              ${ctaHtml}
              ${detailTable}
            </div>
            <div class="footer">
              <p>${this.escapeHtml(FOOTER_TEXT)}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderTextContent(content: EmailContent): string {
    const detailRows = content.detailRows
      .filter((row) => row.value && row.value.trim().length > 0)
      .map((row) => `${row.label}: ${row.value}`);

    const parts = [...content.textParagraphs, '', ...detailRows];

    if (content.cta) {
      parts.push('', `${content.cta.label}: ${content.cta.url}`);
    }

    parts.push('', FOOTER_TEXT);

    return parts.filter((part) => part !== null).join('\n');
  }

  private hasValidEmail(email: string | null): email is string {
    return Boolean(email) && validator.isEmail(email);
  }

  private buildGreeting(detail: PhotoSubmissionDetailType): string {
    const first = detail.submitter?.firstName?.trim() ?? '';
    const last = detail.submitter?.lastName?.trim() ?? '';
    const name = `${first} ${last}`.trim();
    return name || 'there';
  }

  private describeContext(detail: PhotoSubmissionDetailType): string {
    if (detail.album?.title) {
      return `the "${detail.album.title}" album`;
    }

    return detail.teamId ? 'the team gallery' : 'the account gallery';
  }

  private buildGalleryUrl(detail: PhotoSubmissionDetailType): string {
    const base = this.getBaseUrl().replace(/\/+$/, '');
    const accountPath = `${base}/account/${detail.accountId}`;

    if (detail.teamId) {
      return `${accountPath}/teams/${detail.teamId}/photos`;
    }

    return `${accountPath}/photos`;
  }

  private formatTimestamp(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
