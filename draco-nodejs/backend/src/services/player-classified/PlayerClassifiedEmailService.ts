// PlayerClassifiedEmailService
// Single responsibility: Handles all email operations for player classifieds

import { sanitizePlainText, sanitizeRichHtml } from '../../utils/htmlSanitizer.js';
import { logSecurely } from '../../utils/auditLogger.js';
import { EMAIL_STYLES, EMAIL_CONTENT } from '../../config/playerClassifiedConstants.js';
import { EmailConfigFactory } from '../../config/email.js';
import { DateUtils } from '../../utils/dateUtils.js';
import { getFrontendBaseUrlOrFallback } from '../../utils/frontendBaseUrl.js';
import { ServiceFactory } from '../serviceFactory.js';

/**
 * PlayerClassifiedEmailService
 *
 * Handles all email operations for player classifieds including:
 * - Verification email generation and sending for Teams Wanted classifieds
 * - HTML and text email template generation with security sanitization
 * - Email styling and branding consistency
 * - Error handling and logging for email operations
 *
 * This service follows Single Responsibility Principle by focusing solely on email operations.
 * It doesn't handle validation, data access, or business logic beyond email content generation.
 *
 * @example
 * ```typescript
 * const emailService = ServiceFactory.PlayerClassifiedEmailService();
 * await emailService.sendTeamsWantedVerificationEmail(
 *   'user@example.com', 456n, 'uuid-code', account, userData
 * );
 * ```
 */
export class PlayerClassifiedEmailService {
  /**
   * Send verification email for Teams Wanted classified
   *
   * Creates and sends a personalized verification email with account branding,
   * user data confirmation, and secure access code. Generates both HTML and text
   * versions for maximum compatibility and accessibility.
   *
   * @param toEmail - Recipient email address
   * @param classifiedId - ID of the created classified for verification URL
   * @param accessCode - Plain-text access code to include in email
   * @param account - Account information for branding and URL generation
   * @param userData - User data to display in email for confirmation
   *
   * @throws {Error} When email provider fails to send email
   *
   * @security Sanitizes all user input before including in email content to prevent
   * XSS attacks. Uses environment variables for URL generation. Logs email operations
   * for audit trails while redacting sensitive information.
   *
   * @example
   * ```typescript
   * await emailService.sendTeamsWantedVerificationEmail(
   *   'player@example.com',
   *   456n,
   *   'uuid-access-code',
   *   { id: 123n, name: 'Baseball League' },
   *   userData
   * );
   * ```
   */
  async sendTeamsWantedVerificationEmail(
    toEmail: string,
    classifiedId: bigint,
    accessCode: string,
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): Promise<void> {
    try {
      // Get email settings from centralized config factory
      const settings = EmailConfigFactory.getEmailSettings();

      // Generate verification URL with proper environment variable handling
      const baseUrl = getFrontendBaseUrlOrFallback();
      const verificationUrl = `${baseUrl}/account/${account.id}/verify-classified/${classifiedId}?code=${accessCode}`;

      // Create email HTML content with security best practices and personalization
      const htmlContent = this.generateTeamsWantedEmailHtml(
        accessCode,
        verificationUrl,
        settings,
        account,
        userData,
      );

      // Create email text content for accessibility and fallback
      const textContent = this.generateTeamsWantedEmailText(
        accessCode,
        verificationUrl,
        settings,
        account,
        userData,
      );

      // Prepare email options following EmailOptions interface
      const emailOptions = {
        to: toEmail,
        subject: EMAIL_CONTENT.SUBJECT_TEMPLATES.teamsWantedVerification(account.name),
        html: htmlContent,
        text: textContent,
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      const emailService = ServiceFactory.getEmailService();
      await emailService.composeAndSendSystemEmailToAddresses(
        account.id,
        {
          subject: emailOptions.subject,
          bodyHtml: emailOptions.html,
          recipients: { emails: [toEmail] },
        },
        { isSystemEmail: true },
      );
    } catch (error) {
      logSecurely('error', 'Error in sendTeamsWantedVerificationEmail', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw to allow proper error handling
    }
  }

  /**
   * Send verification email with error handling wrapper
   *
   * Wrapper method for sending verification emails to Teams Wanted creators.
   * Handles error gracefully - if email sending fails, the classified creation
   * still succeeds, but the failure is logged for monitoring.
   *
   * @param classifiedId - ID of the newly created classified
   * @param email - Email address to send verification code to
   * @param accessCode - Plain-text access code (will be sent in email)
   * @param account - Account information for email personalization
   * @param userData - User data to include in email for confirmation
   *
   * @security Logs email failures without exposing sensitive information.
   * Never throws errors to prevent classified creation failure due to email issues.
   *
   * @example
   * ```typescript
   * await emailService.sendVerificationEmailSafe(
   *   456n,
   *   'player@example.com',
   *   'uuid-access-code',
   *   account,
   *   userData
   * );
   * // Email sent asynchronously, errors logged but not thrown
   * ```
   */
  async sendVerificationEmailSafe(
    classifiedId: bigint,
    email: string,
    accessCode: string,
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): Promise<void> {
    try {
      await this.sendTeamsWantedVerificationEmail(
        email,
        classifiedId,
        accessCode,
        account,
        userData,
      );
    } catch (error) {
      logSecurely('error', 'Failed to send verification email', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw error here as it would prevent classified creation
      // Instead, log it and continue - the user can request a new access code later
    }
  }

  /**
   * Generate HTML email content for Teams Wanted verification
   *
   * Creates a comprehensive HTML email template with account branding,
   * user data summary, and access code instructions. Implements security
   * best practices including input sanitization and responsive design.
   *
   * @param accessCode - Plain-text access code to display in email
   * @param verificationUrl - Full URL for email verification link
   * @param settings - Email configuration settings (from, reply-to, etc.)
   * @param account - Account information for branding
   * @param userData - Complete user data to display for confirmation
   * @returns HTML string ready for email sending
   *
   * @security Sanitizes ALL user input using sanitizeHtmlContent() to prevent
   * XSS attacks in email clients. Uses proper HTML encoding and escaping.
   *
   * @example
   * ```typescript
   * const html = emailService.generateTeamsWantedEmailHtml(
   *   'uuid-code',
   *   'https://app.com/verify/123?code=uuid-code',
   *   settings,
   *   account,
   *   userData
   * );
   * // Returns: Full HTML email with header, content, styles
   * ```
   */
  generateTeamsWantedEmailHtml(
    accessCode: string,
    verificationUrl: string,
    settings: { fromEmail: string; fromName: string; replyTo?: string },
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): string {
    // Security: Sanitize inputs to prevent XSS
    const sanitizedAccessCode = this.sanitizeHtmlContent(accessCode);
    const sanitizedVerificationUrl = this.sanitizeHtmlContent(verificationUrl);
    const sanitizedAccountName = this.sanitizeHtmlContent(account.name);
    const sanitizedUserName = this.sanitizeHtmlContent(userData.name);
    const sanitizedUserEmail = this.sanitizeHtmlContent(userData.email);
    const sanitizedUserPhone = this.sanitizeHtmlContent(userData.phone);
    const sanitizedUserExperience = this.sanitizeHtmlContent(userData.experience);
    const sanitizedUserPositions = this.sanitizeHtmlContent(userData.positionsPlayed);

    // Calculate age instead of showing raw birth date
    const userAge = DateUtils.calculateAge(userData.birthDate);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitizedAccountName} - Teams Wanted Classified Access Code</title>
        <style>${this.generateEmailStyles()}
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header-banner">
            <h1>${sanitizedAccountName}</h1>
          </div>
          
          <div class="content-area">
            <h2 class="main-heading">Teams Wanted Classified Created</h2>
            
            <p class="personal-greeting">Hello ${sanitizedUserName},</p>
            
            <p>Welcome to ${sanitizedAccountName} Teams Wanted System!</p>
            
            <p>Your Teams Wanted classified has been created successfully. Here are the details you submitted:</p>
            
            <div class="data-summary">
              <div class="data-row">
                <span class="data-label">Name:</span>
                <span class="data-value">${sanitizedUserName}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Email:</span>
                <span class="data-value">${sanitizedUserEmail}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Phone:</span>
                <span class="data-value">${sanitizedUserPhone}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Experience Level:</span>
                <span class="data-value">${sanitizedUserExperience}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Positions:</span>
                <span class="data-value">${sanitizedUserPositions}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Age:</span>
                <span class="data-value">${userAge} years old</span>
              </div>
            </div>
            
            <div class="access-code-box">
              <h3 style="margin-top: 0;">Your Access Code: <span class="access-code">${sanitizedAccessCode}</span></h3>
              <p><strong>Keep this access code safe!</strong> You'll need it to:</p>
              <ul>
                <li>View your classified details</li>
                <li>Update your classified information</li>
                <li>Delete your classified</li>
              </ul>
            </div>
            
            <p><strong>Verification Link:</strong> <a href="${sanitizedVerificationUrl}" class="verification-link">Click here to verify your classified</a></p>
            
            <div class="footer">
              <p>Thank you for using ${sanitizedAccountName} Teams Wanted System!</p>
              <p>If you didn't create this classified, please ignore this email.<br>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content for Teams Wanted verification
   *
   * Creates accessible plain text email version for email clients that don't
   * support HTML or for users who prefer text-only emails. Provides the same
   * information as HTML version in a clean, readable text format.
   *
   * @param accessCode - Plain-text access code to display
   * @param verificationUrl - Full verification URL (will be clickable in most clients)
   * @param settings - Email settings including reply-to address
   * @param account - Account information for personalization
   * @param userData - User data to confirm in email
   * @returns Plain text email content string
   *
   * @security Sanitizes user input using sanitizeTextContent() to prevent
   * text-based injection attacks and ensure proper formatting.
   *
   * @example
   * ```typescript
   * const textContent = emailService.generateTeamsWantedEmailText(
   *   'uuid-code',
   *   'https://app.com/verify/123?code=uuid-code',
   *   settings,
   *   account,
   *   userData
   * );
   * // Returns: Clean plain text email with all necessary information
   * ```
   */
  generateTeamsWantedEmailText(
    accessCode: string,
    verificationUrl: string,
    settings: { fromEmail: string; fromName: string; replyTo?: string },
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): string {
    // Security: Sanitize inputs to prevent injection
    const sanitizedAccessCode = this.sanitizeTextContent(accessCode);
    const sanitizedVerificationUrl = this.sanitizeTextContent(verificationUrl);
    const sanitizedAccountName = this.sanitizeTextContent(account.name);
    const sanitizedUserName = this.sanitizeTextContent(userData.name);
    const sanitizedUserEmail = this.sanitizeTextContent(userData.email);
    const sanitizedUserPhone = this.sanitizeTextContent(userData.phone);
    const sanitizedUserExperience = this.sanitizeTextContent(userData.experience);
    const sanitizedUserPositions = this.sanitizeTextContent(userData.positionsPlayed);

    // Calculate age instead of showing raw birth date
    const userAge = DateUtils.calculateAge(userData.birthDate);

    return `
${sanitizedAccountName} - Teams Wanted Classified Created

Hello ${sanitizedUserName},

Welcome to ${sanitizedAccountName} Teams Wanted System!

Your Teams Wanted classified has been created successfully. Here are the details you submitted:

Name: ${sanitizedUserName}
Email: ${sanitizedUserEmail}
Phone: ${sanitizedUserPhone}
Experience Level: ${sanitizedUserExperience}
Positions: ${sanitizedUserPositions}
Age: ${userAge} years old

Your access code is: ${sanitizedAccessCode}
Keep this access code safe! You'll need it to:
- View your classified details
- Update your classified information
- Delete your classified

Verification Link: ${sanitizedVerificationUrl}

Thank you for using ${sanitizedAccountName} Teams Wanted System!

If you didn't create this classified, please ignore this email.
`;
  }

  /**
   * Generate CSS styles for email templates from constants
   *
   * Generates inline CSS styles for email templates using centralized constants
   * from EMAIL_STYLES configuration. Ensures consistent styling across all
   * email templates and makes style maintenance easier.
   *
   * @returns Complete CSS string for inline email styles
   *
   * @example
   * ```typescript
   * const styles = emailService.generateEmailStyles();
   * // Returns: ".email-container { max-width: 600px; margin: 0 auto; ... }"
   * ```
   */
  generateEmailStyles(): string {
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
          .access-code { color: ${EMAIL_STYLES.ACCESS_CODE.color}; font-weight: ${EMAIL_STYLES.ACCESS_CODE.fontWeight}; font-size: ${EMAIL_STYLES.ACCESS_CODE.fontSize}; }
          .verification-link { color: ${EMAIL_STYLES.VERIFICATION_LINK.color}; text-decoration: ${EMAIL_STYLES.VERIFICATION_LINK.textDecoration}; font-weight: ${EMAIL_STYLES.VERIFICATION_LINK.fontWeight}; }
          .verification-button { background-color: ${EMAIL_STYLES.VERIFICATION_BUTTON.backgroundColor}; color: ${EMAIL_STYLES.VERIFICATION_BUTTON.color}; padding: ${EMAIL_STYLES.VERIFICATION_BUTTON.padding}; text-decoration: ${EMAIL_STYLES.VERIFICATION_BUTTON.textDecoration}; border-radius: ${EMAIL_STYLES.VERIFICATION_BUTTON.borderRadius}; display: ${EMAIL_STYLES.VERIFICATION_BUTTON.display}; margin: ${EMAIL_STYLES.VERIFICATION_BUTTON.margin}; font-weight: ${EMAIL_STYLES.VERIFICATION_BUTTON.fontWeight}; }
          .footer { margin-top: ${EMAIL_STYLES.FOOTER.marginTop}; padding-top: ${EMAIL_STYLES.FOOTER.paddingTop}; border-top: ${EMAIL_STYLES.FOOTER.borderTop}; font-size: ${EMAIL_STYLES.FOOTER.fontSize}; color: ${EMAIL_STYLES.FOOTER.color}; }
    `;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   *
   * Removes potentially dangerous HTML patterns from user input before
   * including in email templates. Follows OWASP security guidelines for
   * HTML sanitization to prevent cross-site scripting attacks.
   *
   * @param content - Raw user input string to sanitize
   * @returns Sanitized string safe for HTML inclusion
   *
   * @security Removes script tags, event handlers, javascript: URLs,
   * and other dangerous patterns. Converts dangerous characters to safe alternatives.
   *
   * @example
   * ```typescript
   * const safe = emailService.sanitizeHtmlContent('<script>alert("xss")</script>John');
   * // Returns: 'John' - script tag removed
   * ```
   */
  sanitizeHtmlContent(content: string): string {
    return sanitizeRichHtml(content);
  }

  /**
   * Sanitize text content to prevent injection attacks
   *
   * Removes potentially dangerous patterns from user input before including
   * in plain text emails. Prevents text-based injection attacks while
   * preserving readable content.
   *
   * @param content - Raw user input string to sanitize
   * @returns Sanitized string safe for text email inclusion
   *
   * @security Removes control characters, excessive whitespace, and other
   * patterns that could be used for text-based attacks or formatting issues.
   *
   * @example
   * ```typescript
   * const safe = emailService.sanitizeTextContent('User\x00Input\r\n\r\n');
   * // Returns: 'User Input' - control characters and excess whitespace removed
   * ```
   */
  sanitizeTextContent(content: string): string {
    return sanitizePlainText(content);
  }
}
