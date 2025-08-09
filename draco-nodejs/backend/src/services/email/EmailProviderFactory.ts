// Email Provider Factory for Draco Sports Manager
// Follows OCP - extensible for new email providers

import { IEmailProvider } from '../../interfaces/emailInterfaces';
import { EmailConfig, EmailSettings, EmailConfigFactory } from '../../config/email';
import { SendGridProvider } from './providers/SendGridProvider';
import { EtherealProvider } from './providers/EtherealProvider';

export class EmailProviderFactory {
  private static instance: IEmailProvider | null = null;

  /**
   * Get email provider instance (singleton pattern)
   * Creates provider based on environment configuration
   */
  static async getProvider(): Promise<IEmailProvider> {
    if (!this.instance) {
      this.instance = await this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create new provider instance (for testing or specific configurations)
   */
  static async createProvider(
    config?: EmailConfig,
    settings?: EmailSettings,
  ): Promise<IEmailProvider> {
    const emailConfig = config || EmailConfigFactory.getEmailConfig();
    const emailSettings = settings || EmailConfigFactory.getEmailSettings();

    switch (emailSettings.provider) {
      case 'sendgrid':
        return new SendGridProvider(emailConfig);

      case 'ethereal':
        return new EtherealProvider(emailConfig);

      default:
        throw new Error(`Unsupported email provider: ${emailSettings.provider}`);
    }
  }

  /**
   * Reset singleton instance (useful for testing or config changes)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Get provider type for current configuration
   */
  static getProviderType(): 'sendgrid' | 'ethereal' {
    const settings = EmailConfigFactory.getEmailSettings();
    return settings.provider;
  }

  /**
   * Test connection for current provider
   */
  static async testConnection(): Promise<boolean> {
    try {
      const provider = await this.getProvider();
      return await provider.testConnection();
    } catch (error) {
      console.error('Email provider connection test failed:', error);
      return false;
    }
  }
}
