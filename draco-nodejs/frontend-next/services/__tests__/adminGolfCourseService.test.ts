import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Client } from '@draco/shared-api-client/generated/client';
import { ApiClientError } from '../../utils/apiResult';
import {
  fetchAdminGolfCourses,
  fetchAdminGolfCourse,
  createAdminGolfCourse,
  updateAdminGolfCourse,
  deleteAdminGolfCourse,
} from '../adminGolfCourseService';

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

const courseSlim = {
  id: 'course-1',
  name: 'Pebble Beach',
  city: 'Pebble Beach',
  state: 'CA',
};

const courseWithTees = {
  ...courseSlim,
  tees: [{ id: 'tee-1', name: 'Blue', color: 'blue', rating: 74.0, slope: 135, yardage: 6800 }],
};

describe('adminGolfCourseService', () => {
  let client: Client;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as Client;
  });

  describe('fetchAdminGolfCourses', () => {
    it('fetches with default pagination params', async () => {
      const payload = { courses: [courseSlim], pagination: { total: 1, page: 1, limit: 20 } };
      vi.mocked(client.get).mockResolvedValue(makeOk(payload));

      const result = await fetchAdminGolfCourses(client);

      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('page=1'),
          security: [{ scheme: 'bearer', type: 'http' }],
        }),
      );
      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('limit=20'),
        }),
      );
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].name).toBe('Pebble Beach');
    });

    it('appends search param when provided', async () => {
      vi.mocked(client.get).mockResolvedValue(
        makeOk({ courses: [], pagination: { total: 0, page: 1, limit: 10 } }),
      );

      await fetchAdminGolfCourses(client, { search: 'Augusta', page: 2, limit: 10 });

      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('search=Augusta'),
        }),
      );
    });

    it('passes AbortSignal to the request', async () => {
      vi.mocked(client.get).mockResolvedValue(
        makeOk({ courses: [], pagination: { total: 0, page: 1, limit: 20 } }),
      );
      const controller = new AbortController();

      await fetchAdminGolfCourses(client, {}, controller.signal);

      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(client.get).mockResolvedValue(makeError('Unauthorized', 401));

      await expect(fetchAdminGolfCourses(client)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchAdminGolfCourse', () => {
    it('fetches a single course by ID', async () => {
      vi.mocked(client.get).mockResolvedValue(makeOk(courseWithTees));

      const result = await fetchAdminGolfCourse(client, 'course-1');

      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/admin/golf/courses/course-1',
        }),
      );
      expect(result.id).toBe('course-1');
      expect(result.tees).toHaveLength(1);
    });

    it('passes AbortSignal to the request', async () => {
      vi.mocked(client.get).mockResolvedValue(makeOk(courseWithTees));
      const controller = new AbortController();

      await fetchAdminGolfCourse(client, 'course-1', controller.signal);

      expect(client.get).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('throws on API error', async () => {
      vi.mocked(client.get).mockResolvedValue(makeError('Not found', 404));

      await expect(fetchAdminGolfCourse(client, 'course-99')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createAdminGolfCourse', () => {
    it('posts to the correct URL and returns the created course', async () => {
      vi.mocked(client.post).mockResolvedValue(makeOk(courseWithTees));

      const input = { name: 'Pebble Beach', city: 'Pebble Beach', state: 'CA' } as never;
      const result = await createAdminGolfCourse(client, input);

      expect(client.post).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses',
        body: input,
        security: [{ scheme: 'bearer', type: 'http' }],
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.id).toBe('course-1');
    });

    it('throws on API error', async () => {
      vi.mocked(client.post).mockResolvedValue(makeError('Conflict', 409));

      await expect(createAdminGolfCourse(client, { name: 'Dup' } as never)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('updateAdminGolfCourse', () => {
    it('puts to the course-specific URL', async () => {
      const updated = { ...courseWithTees, name: 'Augusta National' };
      vi.mocked(client.put).mockResolvedValue(makeOk(updated));

      const result = await updateAdminGolfCourse(client, 'course-1', { name: 'Augusta National' });

      expect(client.put).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses/course-1',
        body: { name: 'Augusta National' },
        security: [{ scheme: 'bearer', type: 'http' }],
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.name).toBe('Augusta National');
    });

    it('throws on API error', async () => {
      vi.mocked(client.put).mockResolvedValue(makeError('Not found', 404));

      await expect(
        updateAdminGolfCourse(client, 'course-99', { name: 'X' }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAdminGolfCourse', () => {
    it('sends a DELETE request to the correct URL', async () => {
      vi.mocked(client.delete).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await deleteAdminGolfCourse(client, 'course-1');

      expect(client.delete).toHaveBeenCalledWith({
        url: '/api/admin/golf/courses/course-1',
        security: [{ scheme: 'bearer', type: 'http' }],
      });
    });

    it('throws on API error', async () => {
      vi.mocked(client.delete).mockResolvedValue(makeError('Forbidden', 403));

      await expect(deleteAdminGolfCourse(client, 'course-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
