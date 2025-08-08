// Email Configuration Factory for Draco Sports Manager
// Follows DIP - depends on environment variables, no secrets in code

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  service?: string;
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
    const nodeEnv = process.env.NODE_ENV || 'development';

    if (nodeEnv === 'production') {
      return this.getProductionConfig();
    } else {
      return this.getDevelopmentConfig();
    }
  }

  /**
   * Get email settings based on environment
   */
  static getEmailSettings(): EmailSettings {
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
      provider: nodeEnv === 'production' ? 'sendgrid' : 'ethereal',
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Draco Sports Manager',
      replyTo: process.env.EMAIL_REPLY_TO,
    };
  }

  /**
   * Production configuration using SendGrid
   */
  private static getProductionConfig(): EmailConfig {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required in production');
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
   * Development configuration using Ethereal Email
   * Creates test accounts dynamically if no credentials provided
   */
  private static getDevelopmentConfig(): EmailConfig {
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
    const nodeEnv = process.env.NODE_ENV || 'development';

    if (nodeEnv === 'production') {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY is required in production environment');
      }
    }

    if (!process.env.EMAIL_FROM) {
      console.warn('EMAIL_FROM not set, using default email address');
    }
  }
}
