// Email Configuration Factory for Draco Sports Manager
// Follows DIP - depends on environment variables, no secrets in code

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export interface EmailSettings {
  provider: 'sendgrid' | 'ethereal';
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

    return provider === 'sendgrid'
      ? this.getSendGridConfig()
      : this.getEtherealConfig();
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
      if (override === 'sendgrid' || override === 'ethereal') {
        return override;
      }

      throw new Error(`Unsupported EMAIL_PROVIDER value: ${override}`);
    }

    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv === 'production' ? 'sendgrid' : 'ethereal';
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
  static getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Validate required environment variables
   */
  static validateConfig(): void {
    const provider = this.resolveProvider();

    if (provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required when using the SendGrid email provider');
    }

    if (!process.env.EMAIL_FROM) {
      console.warn('EMAIL_FROM not set, using default email address');
    }
  }
}
