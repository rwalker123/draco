// ClassifiedExpirationEmailService
// Handles expiration notification emails for player classifieds

import { sanitizePlainText, sanitizeRichHtml } from '../../utils/htmlSanitizer.js';
import { EMAIL_STYLES } from '../../config/playerClassifiedConstants.js';
import { getFrontendBaseUrlOrFallback } from '../../utils/frontendBaseUrl.js';
import { ServiceFactory } from '../serviceFactory.js';
import {
  ExpiredPlayersWantedWithEmail,
  ExpiredTeamsWantedWithEmail,
} from '../../interfaces/cleanupInterfaces.js';

export class ClassifiedExpirationEmailService {
  /**
   * Send expiration notification email for Players Wanted classified
   * Silently skips if no email is available
   */
  async sendPlayersWantedExpirationEmail(
    classified: ExpiredPlayersWantedWithEmail,
    expirationDays: number,
  ): Promise<boolean> {
    if (!classified.creatorEmail) {
      return false;
    }

    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const classifiedsUrl = `${baseUrl}/account/${classified.accountId}/player-classifieds`;

      const htmlContent = this.generatePlayersWantedExpirationHtml(
        classified,
        expirationDays,
        classifiedsUrl,
      );

      const emailService = ServiceFactory.getEmailService();
      await emailService.composeAndSendSystemEmailToAddresses(
        classified.accountId,
        {
          subject: `Your Players Wanted Ad Has Expired - ${classified.teamEventName}`,
          bodyHtml: htmlContent,
          recipients: { emails: [classified.creatorEmail] },
        },
        { isSystemEmail: true },
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send expiration notification email for Teams Wanted classified
   */
  async sendTeamsWantedExpirationEmail(
    classified: ExpiredTeamsWantedWithEmail,
    expirationDays: number,
  ): Promise<boolean> {
    if (!classified.email) {
      return false;
    }

    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const classifiedsUrl = `${baseUrl}/account/${classified.accountId}/player-classifieds`;

      const htmlContent = this.generateTeamsWantedExpirationHtml(
        classified,
        expirationDays,
        classifiedsUrl,
      );

      const emailService = ServiceFactory.getEmailService();
      await emailService.composeAndSendSystemEmailToAddresses(
        classified.accountId,
        {
          subject: `Your Teams Wanted Ad Has Expired - ${classified.name}`,
          bodyHtml: htmlContent,
          recipients: { emails: [classified.email] },
        },
        { isSystemEmail: true },
      );

      return true;
    } catch {
      return false;
    }
  }

  private generatePlayersWantedExpirationHtml(
    classified: ExpiredPlayersWantedWithEmail,
    expirationDays: number,
    classifiedsUrl: string,
  ): string {
    const sanitizedTeamEventName = this.sanitizeHtmlContent(classified.teamEventName);
    const sanitizedAccountName = this.sanitizeHtmlContent(classified.accountName);
    const sanitizedFirstName = this.sanitizeHtmlContent(classified.creatorFirstName);
    const sanitizedUrl = this.sanitizeHtmlContent(classifiedsUrl);
    const postedDate = classified.dateCreated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitizedAccountName} - Players Wanted Ad Expired</title>
        <style>${this.generateEmailStyles()}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header-banner">
            <h1>${sanitizedAccountName}</h1>
          </div>

          <div class="content-area">
            <h2 class="main-heading">Your Players Wanted Ad Has Expired</h2>

            <p class="personal-greeting">Hello ${sanitizedFirstName},</p>

            <p>Your Players Wanted classified ad "<strong>${sanitizedTeamEventName}</strong>" has expired and been removed from ${sanitizedAccountName}.</p>

            <div class="data-summary">
              <div class="data-row">
                <span class="data-label">Ad Title:</span>
                <span class="data-value">${sanitizedTeamEventName}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Posted:</span>
                <span class="data-value">${postedDate}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Duration:</span>
                <span class="data-value">${expirationDays} days</span>
              </div>
            </div>

            <div class="access-code-box">
              <h3 style="margin-top: 0;">Still Looking for Players?</h3>
              <p>You can create a new Players Wanted ad anytime:</p>
              <p><a href="${sanitizedUrl}" class="verification-link">Create a New Ad</a></p>
            </div>

            <div class="footer">
              <p>Thank you for using ${sanitizedAccountName}!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePlayersWantedExpirationText(
    classified: ExpiredPlayersWantedWithEmail,
    expirationDays: number,
    classifiedsUrl: string,
  ): string {
    const sanitizedTeamEventName = this.sanitizeTextContent(classified.teamEventName);
    const sanitizedAccountName = this.sanitizeTextContent(classified.accountName);
    const sanitizedFirstName = this.sanitizeTextContent(classified.creatorFirstName);
    const postedDate = classified.dateCreated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
${sanitizedAccountName} - Your Players Wanted Ad Has Expired

Hello ${sanitizedFirstName},

Your Players Wanted classified ad "${sanitizedTeamEventName}" has expired and been removed from ${sanitizedAccountName}.

Ad Title: ${sanitizedTeamEventName}
Posted: ${postedDate}
Duration: ${expirationDays} days

Still Looking for Players?
You can create a new Players Wanted ad anytime:
${classifiedsUrl}

Thank you for using ${sanitizedAccountName}!
`;
  }

  private generateTeamsWantedExpirationHtml(
    classified: ExpiredTeamsWantedWithEmail,
    expirationDays: number,
    classifiedsUrl: string,
  ): string {
    const sanitizedName = this.sanitizeHtmlContent(classified.name);
    const sanitizedAccountName = this.sanitizeHtmlContent(classified.accountName);
    const sanitizedUrl = this.sanitizeHtmlContent(classifiedsUrl);
    const postedDate = classified.dateCreated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitizedAccountName} - Teams Wanted Ad Expired</title>
        <style>${this.generateEmailStyles()}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header-banner">
            <h1>${sanitizedAccountName}</h1>
          </div>

          <div class="content-area">
            <h2 class="main-heading">Your Teams Wanted Ad Has Expired</h2>

            <p class="personal-greeting">Hello ${sanitizedName},</p>

            <p>Your Teams Wanted classified ad has expired and been removed from ${sanitizedAccountName}.</p>

            <div class="data-summary">
              <div class="data-row">
                <span class="data-label">Your Name:</span>
                <span class="data-value">${sanitizedName}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Posted:</span>
                <span class="data-value">${postedDate}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Duration:</span>
                <span class="data-value">${expirationDays} days</span>
              </div>
            </div>

            <div class="access-code-box">
              <h3 style="margin-top: 0;">Still Looking for a Team?</h3>
              <p>You can create a new Teams Wanted ad anytime:</p>
              <p><a href="${sanitizedUrl}" class="verification-link">Create a New Ad</a></p>
            </div>

            <div class="footer">
              <p>Thank you for using ${sanitizedAccountName}!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTeamsWantedExpirationText(
    classified: ExpiredTeamsWantedWithEmail,
    expirationDays: number,
    classifiedsUrl: string,
  ): string {
    const sanitizedName = this.sanitizeTextContent(classified.name);
    const sanitizedAccountName = this.sanitizeTextContent(classified.accountName);
    const postedDate = classified.dateCreated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
${sanitizedAccountName} - Your Teams Wanted Ad Has Expired

Hello ${sanitizedName},

Your Teams Wanted classified ad has expired and been removed from ${sanitizedAccountName}.

Your Name: ${sanitizedName}
Posted: ${postedDate}
Duration: ${expirationDays} days

Still Looking for a Team?
You can create a new Teams Wanted ad anytime:
${classifiedsUrl}

Thank you for using ${sanitizedAccountName}!
`;
  }

  private generateEmailStyles(): string {
    return `
      .email-container { max-width: ${EMAIL_STYLES.CONTAINER.maxWidth}; margin: ${EMAIL_STYLES.CONTAINER.margin}; padding: ${EMAIL_STYLES.CONTAINER.padding}; font-family: ${EMAIL_STYLES.CONTAINER.fontFamily}; }
      .header-banner { background-color: ${EMAIL_STYLES.HEADER_BANNER.backgroundColor}; color: ${EMAIL_STYLES.HEADER_BANNER.color}; text-align: ${EMAIL_STYLES.HEADER_BANNER.textAlign}; padding: ${EMAIL_STYLES.HEADER_BANNER.padding}; margin-bottom: ${EMAIL_STYLES.HEADER_BANNER.marginBottom}; border-radius: ${EMAIL_STYLES.HEADER_BANNER.borderRadius}; }
      .header-banner h1 { margin: ${EMAIL_STYLES.HEADER_TITLE.margin}; font-size: ${EMAIL_STYLES.HEADER_TITLE.fontSize}; font-weight: ${EMAIL_STYLES.HEADER_TITLE.fontWeight}; }
      .content-area { background-color: ${EMAIL_STYLES.CONTENT_AREA.backgroundColor}; padding: ${EMAIL_STYLES.CONTENT_AREA.padding}; border: ${EMAIL_STYLES.CONTENT_AREA.border}; border-radius: ${EMAIL_STYLES.CONTENT_AREA.borderRadius}; }
      .main-heading { color: ${EMAIL_STYLES.MAIN_HEADING.color}; margin-bottom: ${EMAIL_STYLES.MAIN_HEADING.marginBottom}; font-size: ${EMAIL_STYLES.MAIN_HEADING.fontSize}; }
      .personal-greeting { font-size: ${EMAIL_STYLES.PERSONAL_GREETING.fontSize}; margin-bottom: ${EMAIL_STYLES.PERSONAL_GREETING.marginBottom}; }
      .data-summary { background-color: ${EMAIL_STYLES.DATA_SUMMARY.backgroundColor}; padding: ${EMAIL_STYLES.DATA_SUMMARY.padding}; border-radius: ${EMAIL_STYLES.DATA_SUMMARY.borderRadius}; margin: ${EMAIL_STYLES.DATA_SUMMARY.margin}; }
      .data-row { display: ${EMAIL_STYLES.DATA_ROW.display}; margin-bottom: ${EMAIL_STYLES.DATA_ROW.marginBottom}; }
      .data-label { font-weight: ${EMAIL_STYLES.DATA_LABEL.fontWeight}; min-width: ${EMAIL_STYLES.DATA_LABEL.minWidth}; color: ${EMAIL_STYLES.DATA_LABEL.color}; }
      .data-value { color: ${EMAIL_STYLES.DATA_VALUE.color}; }
      .access-code-box { background-color: ${EMAIL_STYLES.ACCESS_CODE_BOX.backgroundColor}; padding: ${EMAIL_STYLES.ACCESS_CODE_BOX.padding}; border-radius: ${EMAIL_STYLES.ACCESS_CODE_BOX.borderRadius}; margin: ${EMAIL_STYLES.ACCESS_CODE_BOX.margin}; border-left: ${EMAIL_STYLES.ACCESS_CODE_BOX.borderLeft}; }
      .verification-link { color: ${EMAIL_STYLES.VERIFICATION_LINK.color}; text-decoration: ${EMAIL_STYLES.VERIFICATION_LINK.textDecoration}; font-weight: ${EMAIL_STYLES.VERIFICATION_LINK.fontWeight}; }
      .footer { margin-top: ${EMAIL_STYLES.FOOTER.marginTop}; padding-top: ${EMAIL_STYLES.FOOTER.paddingTop}; border-top: ${EMAIL_STYLES.FOOTER.borderTop}; font-size: ${EMAIL_STYLES.FOOTER.fontSize}; color: ${EMAIL_STYLES.FOOTER.color}; }
    `;
  }

  private sanitizeHtmlContent(content: string): string {
    return sanitizeRichHtml(content);
  }

  private sanitizeTextContent(content: string): string {
    return sanitizePlainText(content);
  }
}
