// Email Configuration Factory
// Follows DIP - depends on environment variables, no secrets in code

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  service?: string;
  region?: string;
  resendApiKey?: string;
  resendWebhookSecret?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

export interface EmailSettings {
  provider: 'sendgrid' | 'ethereal' | 'ses' | 'resend' | 'none';
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class EmailConfigFactory {
  /**
   * Get email configuration based on environment
   * No secrets - all values from environment variables
   */
  static getEmailConfig(): EmailConfig {
    const provider = this.resolveProvider();

    switch (provider) {
      case 'sendgrid':
        return this.getSendGridConfig();

      case 'ses':
        return this.getSesConfig();

      case 'resend':
        return this.getResendConfig();

      case 'none':
        return this.getNoneConfig();

      case 'ethereal':
      default:
        return this.getEtherealConfig();
    }
  }

  /**
   * Get email settings based on environment
   */
  static getEmailSettings(): EmailSettings {
    const provider = this.resolveProvider();

    return {
      provider,
      fromEmail: process.env.EMAIL_FROM || 'noreply@ezrecsports.com',
      fromName: process.env.EMAIL_FROM_NAME || 'ezRecSports',
      replyTo: process.env.EMAIL_REPLY_TO,
    };
  }

  /**
   * Resolve active email provider using environment variables
   */
  private static resolveProvider(): EmailSettings['provider'] {
    const override = process.env.EMAIL_PROVIDER?.toLowerCase();

    if (override) {
      if (
        override === 'sendgrid' ||
        override === 'ethereal' ||
        override === 'ses' ||
        override === 'resend' ||
        override === 'none'
      ) {
        return override;
      }

      throw new Error(`Unsupported EMAIL_PROVIDER value: ${override}`);
    }

    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv === 'production' ? 'ses' : 'ethereal';
  }

  /**
   * Configuration using SendGrid
   */
  private static getSendGridConfig(): EmailConfig {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error(
        'SENDGRID_API_KEY environment variable is required for SendGrid email provider',
      );
    }

    return {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: apiKey,
      },
      service: 'SendGrid',
    };
  }

  /**
   * Configuration using AWS Simple Email Service
   */
  private static getSesConfig(): EmailConfig {
    const region = process.env.SES_REGION || process.env.AWS_REGION;
    const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.SES_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;

    if (!region) {
      throw new Error('SES_REGION or AWS_REGION is required for SES email provider');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY (or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY) are required for SES email provider',
      );
    }

    return {
      service: 'SES',
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    };
  }

  /**
   * Configuration using Resend
   */
  private static getResendConfig(): EmailConfig {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for Resend email provider');
    }

    return {
      service: 'Resend',
      resendApiKey: apiKey,
      resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    };
  }

  /**
   * Configuration when email sending is disabled
   */
  private static getNoneConfig(): EmailConfig {
    return {
      service: 'None',
    };
  }

  /**
   * Development configuration using Ethereal Email
   * Creates test accounts dynamically if no credentials provided
   */
  private static getEtherealConfig(): EmailConfig {
    // Use provided Ethereal credentials or create test account
    const host = process.env.EMAIL_DEV_HOST || 'smtp.ethereal.email';
    const user = process.env.EMAIL_DEV_USER;
    const pass = process.env.EMAIL_DEV_PASS;

    if (user && pass) {
      // Use existing Ethereal test account
      return {
        host,
        port: 587,
        secure: false,
        auth: { user, pass },
      };
    } else {
      // Will create dynamic test account in EmailProvider
      return {
        host,
        port: 587,
        secure: false,
        auth: {
          user: '', // Will be filled by EtherealProvider
          pass: '', // Will be filled by EtherealProvider
        },
      };
    }
  }

  /**
   * Get base URL for email links
   */
  /**
   * Validate required environment variables
   */
  static validateConfig(): void {
    const provider = this.resolveProvider();

    if (provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required when using the SendGrid email provider');
    }

    if (provider === 'ses') {
      const region = process.env.SES_REGION || process.env.AWS_REGION;
      const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey =
        process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

      if (!region) {
        throw new Error('SES_REGION or AWS_REGION is required when using the SES email provider');
      }

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          'SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY are required when using the SES email provider',
        );
      }
    }

    if (provider === 'resend' && !process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required when using the Resend email provider');
    }

    if (provider === 'none') {
      console.warn('EMAIL_PROVIDER set to "none" – outbound emails are disabled.');
    }

    if (!process.env.EMAIL_FROM) {
      console.warn('EMAIL_FROM not set, using default email address');
    }
  }
}
