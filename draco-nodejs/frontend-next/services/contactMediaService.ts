import { createApiClient } from '../lib/apiClientFactory';
import { deleteContactPhoto, getContactPhoto } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export class ContactMediaService {
  private client: Client;

  constructor(token?: string) {
    this.client = createApiClient({ token });
  }

  /**
   * Retrieve a contact photo as a Blob.
   */
  async getPhoto(accountId: string, contactId: string): Promise<Blob> {
    const result = await getContactPhoto({
      client: this.client,
      path: { accountId, contactId },
      throwOnError: false,
    });

    const payload = unwrapApiResult(result, 'Failed to fetch contact photo');

    // The generated SDK returns a Response-like object when successful.
    // Ensure we convert to Blob for consumer usage.
    if (payload instanceof Blob) {
      return payload;
    }

    throw new Error('Unexpected response while fetching contact photo');
  }

  /**
   * Delete a contact photo.
   */
  async deletePhoto(accountId: string, contactId: string): Promise<void> {
    const result = await deleteContactPhoto({
      client: this.client,
      path: { accountId, contactId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete contact photo');
  }
}

export const createContactMediaService = (token?: string) => new ContactMediaService(token);
