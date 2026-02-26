import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountAnnouncements as apiListAccountAnnouncements,
  listAccountAnnouncementSummaries as apiListAccountAnnouncementSummaries,
  getAccountAnnouncement as apiGetAccountAnnouncement,
  createAccountAnnouncement as apiCreateAccountAnnouncement,
  updateAccountAnnouncement as apiUpdateAccountAnnouncement,
  deleteAccountAnnouncement as apiDeleteAccountAnnouncement,
  listTeamAnnouncements as apiListTeamAnnouncements,
  listTeamAnnouncementSummaries as apiListTeamAnnouncementSummaries,
  getTeamAnnouncement as apiGetTeamAnnouncement,
  createTeamAnnouncement as apiCreateTeamAnnouncement,
  updateTeamAnnouncement as apiUpdateTeamAnnouncement,
  deleteTeamAnnouncement as apiDeleteTeamAnnouncement,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { AnnouncementService } from '../announcementService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  listAccountAnnouncements: vi.fn(),
  listAccountAnnouncementSummaries: vi.fn(),
  getAccountAnnouncement: vi.fn(),
  createAccountAnnouncement: vi.fn(),
  updateAccountAnnouncement: vi.fn(),
  deleteAccountAnnouncement: vi.fn(),
  listTeamAnnouncements: vi.fn(),
  listTeamAnnouncementSummaries: vi.fn(),
  getTeamAnnouncement: vi.fn(),
  createTeamAnnouncement: vi.fn(),
  updateTeamAnnouncement: vi.fn(),
  deleteTeamAnnouncement: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({}) as Client),
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

const announcementFixture = {
  id: 'ann-1',
  accountId: 'acct-1',
  title: 'Season Kickoff',
  bodyHtml: '<p>Season starts soon!</p>',
  isSpecial: false,
  publishedAt: '2024-03-01T00:00:00Z',
};

const summaryFixture = {
  id: 'ann-1',
  title: 'Season Kickoff',
  publishedAt: '2024-03-01T00:00:00Z',
};

const teamContext = { accountId: 'acct-1', teamId: 'team-1' };

const upsertPayload = {
  title: 'Season Kickoff',
  bodyHtml: '<p>Season starts soon!</p>',
  isSpecial: false,
} as never;

describe('AnnouncementService', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnnouncementService(undefined, mockClient);
  });

  describe('listAccountAnnouncements', () => {
    it('returns announcements for an account', async () => {
      vi.mocked(apiListAccountAnnouncements).mockResolvedValue(
        makeOkResult({ announcements: [announcementFixture] }),
      );

      const result = await service.listAccountAnnouncements('acct-1');

      expect(apiListAccountAnnouncements).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1' },
        throwOnError: false,
      });
      expect(result).toEqual([announcementFixture]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListAccountAnnouncements).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.listAccountAnnouncements('acct-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('listAccountAnnouncementSummaries', () => {
    it('returns summaries with optional query params forwarded', async () => {
      vi.mocked(apiListAccountAnnouncementSummaries).mockResolvedValue(
        makeOkResult({ announcements: [summaryFixture] }),
      );

      const options = { limit: 5, includeSpecialOnly: true };
      const result = await service.listAccountAnnouncementSummaries('acct-1', options);

      expect(apiListAccountAnnouncementSummaries).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1' },
        query: options,
        throwOnError: false,
      });
      expect(result).toEqual([summaryFixture]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListAccountAnnouncementSummaries).mockResolvedValue(
        makeErrorResult('Server error'),
      );

      await expect(service.listAccountAnnouncementSummaries('acct-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('getAccountAnnouncement', () => {
    it('returns a single announcement by id', async () => {
      vi.mocked(apiGetAccountAnnouncement).mockResolvedValue(makeOkResult(announcementFixture));

      const result = await service.getAccountAnnouncement('acct-1', 'ann-1');

      expect(apiGetAccountAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', announcementId: 'ann-1' },
        throwOnError: false,
      });
      expect(result).toEqual(announcementFixture);
    });

    it('throws ApiClientError when the announcement is not found', async () => {
      vi.mocked(apiGetAccountAnnouncement).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.getAccountAnnouncement('acct-1', 'missing')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createAccountAnnouncement', () => {
    it('creates an announcement and returns the result', async () => {
      vi.mocked(apiCreateAccountAnnouncement).mockResolvedValue(makeOkResult(announcementFixture));

      const result = await service.createAccountAnnouncement('acct-1', upsertPayload);

      expect(apiCreateAccountAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1' },
        body: upsertPayload,
        throwOnError: false,
      });
      expect(result).toEqual(announcementFixture);
    });

    it('throws ApiClientError on validation failure', async () => {
      vi.mocked(apiCreateAccountAnnouncement).mockResolvedValue(
        makeErrorResult('Validation failed'),
      );

      await expect(
        service.createAccountAnnouncement('acct-1', upsertPayload),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateAccountAnnouncement', () => {
    it('updates an announcement and returns the updated result', async () => {
      const updated = { ...announcementFixture, title: 'Updated Title' };
      vi.mocked(apiUpdateAccountAnnouncement).mockResolvedValue(makeOkResult(updated));

      const result = await service.updateAccountAnnouncement('acct-1', 'ann-1', upsertPayload);

      expect(apiUpdateAccountAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', announcementId: 'ann-1' },
        body: upsertPayload,
        throwOnError: false,
      });
      expect(result.title).toBe('Updated Title');
    });

    it('throws ApiClientError when the announcement is not found', async () => {
      vi.mocked(apiUpdateAccountAnnouncement).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.updateAccountAnnouncement('acct-1', 'missing', upsertPayload),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAccountAnnouncement', () => {
    it('deletes an announcement successfully', async () => {
      vi.mocked(apiDeleteAccountAnnouncement).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteAccountAnnouncement('acct-1', 'ann-1')).resolves.toBeUndefined();
      expect(apiDeleteAccountAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', announcementId: 'ann-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteAccountAnnouncement).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.deleteAccountAnnouncement('acct-1', 'ann-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('listTeamAnnouncements', () => {
    it('returns announcements for a team', async () => {
      vi.mocked(apiListTeamAnnouncements).mockResolvedValue(
        makeOkResult({ announcements: [announcementFixture] }),
      );

      const result = await service.listTeamAnnouncements(teamContext);

      expect(apiListTeamAnnouncements).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1' },
        throwOnError: false,
      });
      expect(result).toEqual([announcementFixture]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListTeamAnnouncements).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.listTeamAnnouncements(teamContext)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('listTeamAnnouncementSummaries', () => {
    it('returns team announcement summaries with options', async () => {
      vi.mocked(apiListTeamAnnouncementSummaries).mockResolvedValue(
        makeOkResult({ announcements: [summaryFixture] }),
      );

      const options = { limit: 3 };
      const result = await service.listTeamAnnouncementSummaries(teamContext, options);

      expect(apiListTeamAnnouncementSummaries).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1' },
        query: options,
        throwOnError: false,
      });
      expect(result).toEqual([summaryFixture]);
    });
  });

  describe('getTeamAnnouncement', () => {
    it('returns a single team announcement by id', async () => {
      vi.mocked(apiGetTeamAnnouncement).mockResolvedValue(makeOkResult(announcementFixture));

      const result = await service.getTeamAnnouncement(teamContext, 'ann-1');

      expect(apiGetTeamAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1', announcementId: 'ann-1' },
        throwOnError: false,
      });
      expect(result).toEqual(announcementFixture);
    });

    it('throws ApiClientError when not found', async () => {
      vi.mocked(apiGetTeamAnnouncement).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.getTeamAnnouncement(teamContext, 'missing')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createTeamAnnouncement', () => {
    it('creates a team announcement', async () => {
      vi.mocked(apiCreateTeamAnnouncement).mockResolvedValue(makeOkResult(announcementFixture));

      const result = await service.createTeamAnnouncement(teamContext, upsertPayload);

      expect(apiCreateTeamAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1' },
        body: upsertPayload,
        throwOnError: false,
      });
      expect(result).toEqual(announcementFixture);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiCreateTeamAnnouncement).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(
        service.createTeamAnnouncement(teamContext, upsertPayload),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateTeamAnnouncement', () => {
    it('updates a team announcement', async () => {
      vi.mocked(apiUpdateTeamAnnouncement).mockResolvedValue(makeOkResult(announcementFixture));

      const result = await service.updateTeamAnnouncement(teamContext, 'ann-1', upsertPayload);

      expect(apiUpdateTeamAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1', announcementId: 'ann-1' },
        body: upsertPayload,
        throwOnError: false,
      });
      expect(result).toEqual(announcementFixture);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiUpdateTeamAnnouncement).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.updateTeamAnnouncement(teamContext, 'ann-1', upsertPayload),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteTeamAnnouncement', () => {
    it('deletes a team announcement successfully', async () => {
      vi.mocked(apiDeleteTeamAnnouncement).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteTeamAnnouncement(teamContext, 'ann-1')).resolves.toBeUndefined();
      expect(apiDeleteTeamAnnouncement).toHaveBeenCalledWith({
        client: mockClient,
        path: { accountId: 'acct-1', teamId: 'team-1', announcementId: 'ann-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteTeamAnnouncement).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.deleteTeamAnnouncement(teamContext, 'ann-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
