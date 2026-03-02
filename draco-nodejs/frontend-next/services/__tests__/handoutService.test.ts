import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountHandouts as apiListAccountHandouts,
  createAccountHandout as apiCreateAccountHandout,
  updateAccountHandout as apiUpdateAccountHandout,
  deleteAccountHandout as apiDeleteAccountHandout,
  downloadAccountHandout as apiDownloadAccountHandout,
  listTeamHandouts as apiListTeamHandouts,
  createTeamHandout as apiCreateTeamHandout,
  updateTeamHandout as apiUpdateTeamHandout,
  deleteTeamHandout as apiDeleteTeamHandout,
  downloadTeamHandout as apiDownloadTeamHandout,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { HandoutService } from '../handoutService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  listAccountHandouts: vi.fn(),
  createAccountHandout: vi.fn(),
  updateAccountHandout: vi.fn(),
  deleteAccountHandout: vi.fn(),
  downloadAccountHandout: vi.fn(),
  listTeamHandouts: vi.fn(),
  createTeamHandout: vi.fn(),
  updateTeamHandout: vi.fn(),
  deleteTeamHandout: vi.fn(),
  downloadTeamHandout: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({}) as Client),
}));

vi.mock('@draco/shared-api-client/generated/client', () => ({
  formDataBodySerializer: { bodySerializer: vi.fn() },
}));

const mockClient = {} as Client;

const makeOkResult = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeErrorResult = (message: string) =>
  ({
    data: undefined,
    error: { message, statusCode: 400 },
    request: {} as Request,
    response: { status: 400 } as Response,
  }) as never;

const handoutFixture = {
  id: 'h-1',
  accountId: 'acct-1',
  description: 'Spring Training Guide',
  fileName: 'guide.pdf',
  fileSize: 1024,
};

const handoutListFixture = { handouts: [handoutFixture] };

const teamContext = { accountId: 'acct-1', teamId: 'team-1' };

describe('HandoutService', () => {
  let service: HandoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HandoutService(undefined, mockClient);
  });

  describe('listAccountHandouts', () => {
    it('returns handouts for an account', async () => {
      vi.mocked(apiListAccountHandouts).mockResolvedValue(makeOkResult(handoutListFixture));

      const result = await service.listAccountHandouts('acct-1');

      expect(apiListAccountHandouts).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1' },
        throwOnError: false,
      });
      expect(result).toEqual([handoutFixture]);
    });

    it('returns an empty array when the handouts field is absent', async () => {
      vi.mocked(apiListAccountHandouts).mockResolvedValue(makeOkResult({ handouts: undefined }));

      const result = await service.listAccountHandouts('acct-1');

      expect(result).toEqual([]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListAccountHandouts).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.listAccountHandouts('acct-1')).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listTeamHandouts', () => {
    it('returns handouts for a team', async () => {
      vi.mocked(apiListTeamHandouts).mockResolvedValue(makeOkResult(handoutListFixture));

      const result = await service.listTeamHandouts(teamContext);

      expect(apiListTeamHandouts).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1' },
        throwOnError: false,
      });
      expect(result).toEqual([handoutFixture]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListTeamHandouts).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.listTeamHandouts(teamContext)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createAccountHandout', () => {
    it('creates an account handout with a file', async () => {
      vi.mocked(apiCreateAccountHandout).mockResolvedValue(makeOkResult(handoutFixture));

      const file = new File(['pdf content'], 'guide.pdf', { type: 'application/pdf' });
      const result = await service.createAccountHandout('acct-1', {
        description: 'Spring Training Guide',
        file,
      });

      expect(apiCreateAccountHandout).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          path: { accountId: 'acct-1' },
          throwOnError: false,
          body: { description: 'Spring Training Guide', file },
          headers: { 'Content-Type': null },
        }),
      );
      expect(result).toEqual(handoutFixture);
    });

    it('throws when no file is provided', async () => {
      await expect(
        service.createAccountHandout('acct-1', { description: 'Guide' }),
      ).rejects.toThrow('Handout file is required');
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiCreateAccountHandout).mockResolvedValue(makeErrorResult('Server error'));

      const file = new File(['pdf'], 'guide.pdf', { type: 'application/pdf' });
      await expect(
        service.createAccountHandout('acct-1', { description: 'Guide', file }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateAccountHandout', () => {
    it('updates an account handout description only when no file is provided', async () => {
      vi.mocked(apiUpdateAccountHandout).mockResolvedValue(makeOkResult(handoutFixture));

      const result = await service.updateAccountHandout('acct-1', 'h-1', {
        description: 'Updated Guide',
      });

      expect(apiUpdateAccountHandout).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', handoutId: 'h-1' },
          body: { description: 'Updated Guide' },
        }),
      );
      expect(result).toEqual(handoutFixture);
    });

    it('includes the file when updating with a new file', async () => {
      vi.mocked(apiUpdateAccountHandout).mockResolvedValue(makeOkResult(handoutFixture));

      const file = new File(['new pdf'], 'updated.pdf', { type: 'application/pdf' });
      await service.updateAccountHandout('acct-1', 'h-1', {
        description: 'Updated Guide',
        file,
      });

      expect(apiUpdateAccountHandout).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { description: 'Updated Guide', file },
          headers: { 'Content-Type': null },
        }),
      );
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiUpdateAccountHandout).mockResolvedValue(makeErrorResult('Validation error'));

      await expect(
        service.updateAccountHandout('acct-1', 'h-1', { description: 'x' }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAccountHandout', () => {
    it('deletes an account handout successfully', async () => {
      vi.mocked(apiDeleteAccountHandout).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteAccountHandout('acct-1', 'h-1')).resolves.toBeUndefined();
      expect(apiDeleteAccountHandout).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', handoutId: 'h-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteAccountHandout).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.deleteAccountHandout('acct-1', 'h-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createTeamHandout', () => {
    it('creates a team handout with a file', async () => {
      vi.mocked(apiCreateTeamHandout).mockResolvedValue(makeOkResult(handoutFixture));

      const file = new File(['pdf'], 'team-guide.pdf', { type: 'application/pdf' });
      const result = await service.createTeamHandout(teamContext, {
        description: 'Team Guide',
        file,
      });

      expect(apiCreateTeamHandout).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', teamId: 'team-1' },
          body: { description: 'Team Guide', file },
          headers: { 'Content-Type': null },
        }),
      );
      expect(result).toEqual(handoutFixture);
    });

    it('throws when no file is provided', async () => {
      await expect(
        service.createTeamHandout(teamContext, { description: 'Guide' }),
      ).rejects.toThrow('Handout file is required');
    });
  });

  describe('updateTeamHandout', () => {
    it('updates a team handout', async () => {
      vi.mocked(apiUpdateTeamHandout).mockResolvedValue(makeOkResult(handoutFixture));

      await service.updateTeamHandout(teamContext, 'h-1', { description: 'Updated' });

      expect(apiUpdateTeamHandout).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', teamId: 'team-1', handoutId: 'h-1' },
          body: { description: 'Updated' },
        }),
      );
    });
  });

  describe('deleteTeamHandout', () => {
    it('deletes a team handout successfully', async () => {
      vi.mocked(apiDeleteTeamHandout).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteTeamHandout(teamContext, 'h-1')).resolves.toBeUndefined();
      expect(apiDeleteTeamHandout).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1', handoutId: 'h-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteTeamHandout).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.deleteTeamHandout(teamContext, 'h-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('downloadAccountHandout', () => {
    it('returns a blob for the downloaded handout', async () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' });
      vi.mocked(apiDownloadAccountHandout).mockResolvedValue(makeOkResult(blob));

      const result = await service.downloadAccountHandout('acct-1', 'h-1');

      expect(apiDownloadAccountHandout).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', handoutId: 'h-1' },
        throwOnError: false,
      });
      expect(result).toBe(blob);
    });

    it('throws ApiClientError on download failure', async () => {
      vi.mocked(apiDownloadAccountHandout).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.downloadAccountHandout('acct-1', 'h-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('downloadTeamHandout', () => {
    it('returns a blob for the downloaded team handout', async () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' });
      vi.mocked(apiDownloadTeamHandout).mockResolvedValue(makeOkResult(blob));

      const result = await service.downloadTeamHandout(teamContext, 'h-1');

      expect(apiDownloadTeamHandout).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1', handoutId: 'h-1' },
        throwOnError: false,
      });
      expect(result).toBe(blob);
    });

    it('throws ApiClientError on download failure', async () => {
      vi.mocked(apiDownloadTeamHandout).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.downloadTeamHandout(teamContext, 'h-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
