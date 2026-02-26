import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getContactPhoto as apiGetContactPhoto,
  deleteContactPhoto as apiDeleteContactPhoto,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { ContactMediaService } from '../contactMediaService';

vi.mock('@draco/shared-api-client', () => ({
  getContactPhoto: vi.fn(),
  deleteContactPhoto: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

describe('ContactMediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPhoto', () => {
    it('returns a Blob when the API responds with one', async () => {
      const blob = new Blob(['binary-data'], { type: 'image/jpeg' });
      vi.mocked(apiGetContactPhoto).mockResolvedValue({
        data: blob,
        request: {} as Request,
        response: {} as Response,
      } as never);

      const service = new ContactMediaService('token-abc');
      const result = await service.getPhoto('account-1', 'contact-1');

      expect(apiGetContactPhoto).toHaveBeenCalledWith({
        client: expect.anything(),
        path: { accountId: 'account-1', contactId: 'contact-1' },
        throwOnError: false,
      });
      expect(result).toBe(blob);
    });

    it('throws when the data is not a Blob', async () => {
      vi.mocked(apiGetContactPhoto).mockResolvedValue({
        data: { someField: 'not-a-blob' } as unknown as Blob,
        request: {} as Request,
        response: {} as Response,
      } as never);

      const service = new ContactMediaService('token-abc');
      await expect(service.getPhoto('account-1', 'contact-1')).rejects.toThrow(
        'Unexpected response while fetching contact photo',
      );
    });

    it('throws ApiClientError when the API returns an error', async () => {
      vi.mocked(apiGetContactPhoto).mockResolvedValue({
        data: undefined,
        error: { message: 'Not found', statusCode: 404 },
        request: {} as Request,
        response: { status: 404 } as Response,
      } as never);

      const service = new ContactMediaService('token-abc');
      await expect(service.getPhoto('account-1', 'contact-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('deletePhoto', () => {
    it('resolves without error on successful deletion', async () => {
      vi.mocked(apiDeleteContactPhoto).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      const service = new ContactMediaService('token-abc');
      await expect(service.deletePhoto('account-1', 'contact-1')).resolves.toBeUndefined();

      expect(apiDeleteContactPhoto).toHaveBeenCalledWith({
        client: expect.anything(),
        path: { accountId: 'account-1', contactId: 'contact-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion fails', async () => {
      vi.mocked(apiDeleteContactPhoto).mockResolvedValue({
        data: undefined,
        error: { message: 'Forbidden', statusCode: 403 },
        request: {} as Request,
        response: { status: 403 } as Response,
      } as never);

      const service = new ContactMediaService('token-abc');
      await expect(service.deletePhoto('account-1', 'contact-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
