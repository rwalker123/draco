import { ImageProcessor } from '../utils/imageProcessor.js';

export interface StorageService {
  saveLogo(accountId: string, teamId: string, buffer: Buffer): Promise<void>;
  getLogo(accountId: string, teamId: string): Promise<Buffer | null>;
  deleteLogo(accountId: string, teamId: string): Promise<void>;
  getSignedUrl?(accountId: string, teamId: string, expiresIn?: number): Promise<string>;
  saveAccountLogo(accountId: string, buffer: Buffer): Promise<void>;
  getAccountLogo(accountId: string): Promise<Buffer | null>;
  deleteAccountLogo(accountId: string): Promise<void>;
  saveContactPhoto(accountId: string, contactId: string, buffer: Buffer): Promise<void>;
  getContactPhoto(accountId: string, contactId: string): Promise<Buffer | null>;
  deleteContactPhoto(accountId: string, contactId: string): Promise<void>;
}

export abstract class BaseStorageService implements StorageService {
  protected async processTeamLogo(buffer: Buffer): Promise<Buffer> {
    ImageProcessor.validateImageBuffer(buffer);
    return ImageProcessor.processTeamLogo(buffer);
  }

  protected async processAccountLogo(buffer: Buffer): Promise<Buffer> {
    ImageProcessor.validateImageBuffer(buffer);
    return ImageProcessor.processAccountLogo(buffer);
  }

  protected async processContactPhoto(buffer: Buffer): Promise<Buffer> {
    ImageProcessor.validateImageBuffer(buffer);
    return ImageProcessor.processContactPhoto(buffer);
  }

  protected getTeamLogoKey(accountId: string, teamId: string): string {
    return `${accountId}/team-logos/${teamId}-logo.png`;
  }

  protected getAccountLogoKey(accountId: string): string {
    return `${accountId}/logo.png`;
  }

  protected getContactPhotoKey(accountId: string, contactId: string): string {
    return `${accountId}/contact-photos/${contactId}-photo.png`;
  }

  protected handleStorageError(error: unknown, operation: string): never {
    console.error(`Error during ${operation}:`, error);

    if (error instanceof Error) {
      throw new Error(`Failed to ${operation}: ${error.message}`);
    }

    throw new Error(`Failed to ${operation}: Unknown error`);
  }

  abstract saveLogo(accountId: string, teamId: string, buffer: Buffer): Promise<void>;
  abstract getLogo(accountId: string, teamId: string): Promise<Buffer | null>;
  abstract deleteLogo(accountId: string, teamId: string): Promise<void>;
  abstract saveAccountLogo(accountId: string, buffer: Buffer): Promise<void>;
  abstract getAccountLogo(accountId: string): Promise<Buffer | null>;
  abstract deleteAccountLogo(accountId: string): Promise<void>;
  abstract saveContactPhoto(accountId: string, contactId: string, buffer: Buffer): Promise<void>;
  abstract getContactPhoto(accountId: string, contactId: string): Promise<Buffer | null>;
  abstract deleteContactPhoto(accountId: string, contactId: string): Promise<void>;
}
