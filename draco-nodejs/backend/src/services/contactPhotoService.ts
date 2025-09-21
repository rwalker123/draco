import { PrismaClient } from '@prisma/client';
import { createStorageService } from './storageService.js';

/**
 * Service for managing contact photos
 * Provides centralized photo operations following SOLID principles
 */
export class ContactPhotoService {
  private storageService = createStorageService();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Delete a contact's photo from storage
   * @param accountId - Account ID
   * @param contactId - Contact ID
   * @returns Promise<void>
   */
  async deleteContactPhoto(accountId: bigint, contactId: bigint): Promise<void> {
    try {
      await this.storageService.deleteContactPhoto(accountId.toString(), contactId.toString());
      console.log(
        `Contact photo deleted successfully for contact ${contactId} in account ${accountId}`,
      );
    } catch (error) {
      // Log error but don't throw - photo deletion should not block contact deletion
      console.error(
        `Failed to delete photo for contact ${contactId} in account ${accountId}:`,
        error,
      );
      // We intentionally don't throw here to prevent photo deletion issues
      // from blocking contact deletion
    }
  }

  /**
   * Check if a contact has a photo
   * @param accountId - Account ID
   * @param contactId - Contact ID
   * @returns Promise<boolean>
   */
  async hasPhoto(accountId: bigint, contactId: bigint): Promise<boolean> {
    try {
      const photoBuffer = await this.storageService.getContactPhoto(
        accountId.toString(),
        contactId.toString(),
      );
      return !!photoBuffer;
    } catch (error) {
      console.error(
        `Error checking if contact ${contactId} in account ${accountId} has photo:`,
        error,
      );
      return false;
    }
  }
}
