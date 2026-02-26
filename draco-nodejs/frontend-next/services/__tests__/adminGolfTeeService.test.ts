import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Client } from '@draco/shared-api-client/generated/client';
import { ApiClientError } from '../../utils/apiResult';
import { createAdminGolfTee, updateAdminGolfTee, deleteAdminGolfTee } from '../adminGolfTeeService';

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, status = 400) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as never;

const teeData = {
  id: 'tee-1',
  courseId: 'course-1',
  name: 'Blue Tees',
  color: 'blue',
  rating: 72.5,
  slope: 130,
  yardage: 6500,
};

describe('adminGolfTeeService', () => {
  let client: Client;

  beforeEach(() => {
    client = {
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    } as unknown as Client;
  });

  describe('createAdminGolfTee', () => {
    it('posts to the correct URL and returns the created tee', async () => {
      vi.mocked(client.post).mockResolvedValue(makeOk(teeData));

      const input = {
        name: 'Blue Tees',
        color: 'blue',
        rating: 72.5,
        slope: 130,
        yardage: 6500,
      } as never;
      const result = await createAdminGolfTee(client, 'course-1', input);

      expect(client.post).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses/course-1/tees',
        body: input,
        security: [{ scheme: 'bearer', type: 'http' }],
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(teeData);
    });

    it('throws ApiClientError when the API returns an error', async () => {
      vi.mocked(client.post).mockResolvedValue(makeError('Bad Request'));

      await expect(
        createAdminGolfTee(client, 'course-1', { name: 'Red', color: 'red' } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateAdminGolfTee', () => {
    it('puts to the correct URL with tee and course IDs', async () => {
      const updated = { ...teeData, name: 'Gold Tees', color: 'gold' };
      vi.mocked(client.put).mockResolvedValue(makeOk(updated));

      const input = { name: 'Gold Tees', color: 'gold' } as never;
      const result = await updateAdminGolfTee(client, 'course-1', 'tee-1', input);

      expect(client.put).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses/course-1/tees/tee-1',
        body: input,
        security: [{ scheme: 'bearer', type: 'http' }],
        headers: { 'Content-Type': 'application/json' },
      });
      expect((result as Record<string, unknown>).name).toBe('Gold Tees');
    });

    it('throws ApiClientError when the update fails', async () => {
      vi.mocked(client.put).mockResolvedValue(makeError('Not found', 404));

      await expect(
        updateAdminGolfTee(client, 'course-1', 'tee-99', { name: 'X' } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAdminGolfTee', () => {
    it('sends a DELETE request to the correct URL', async () => {
      vi.mocked(client.delete).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await deleteAdminGolfTee(client, 'course-1', 'tee-1');

      expect(client.delete).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses/course-1/tees/tee-1',
        security: [{ scheme: 'bearer', type: 'http' }],
      });
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(client.delete).mockResolvedValue(makeError('Forbidden', 403));

      await expect(deleteAdminGolfTee(client, 'course-1', 'tee-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
