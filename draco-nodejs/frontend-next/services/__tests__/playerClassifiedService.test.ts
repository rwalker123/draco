import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  contactPlayersWantedCreator as contactPlayersWantedCreatorApi,
  createPlayersWantedClassified,
  createTeamsWantedClassified,
  deletePlayersWantedClassified,
  deleteTeamsWantedClassified,
  getTeamsWantedByAccessCode as getTeamsWantedByAccessCodeApi,
  getTeamsWantedContactInfo as getTeamsWantedContactInfoApi,
  listPlayerClassifiedExperienceLevels,
  listPlayerClassifiedPositions,
  listPlayersWantedClassifieds,
  listTeamsWantedClassifieds,
  updatePlayersWantedClassified,
  updateTeamsWantedClassified,
  verifyTeamsWantedAccess as verifyTeamsWantedAccessApi,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { playerClassifiedService } from '../playerClassifiedService';

vi.mock('@draco/shared-api-client', () => ({
  contactPlayersWantedCreator: vi.fn(),
  createPlayersWantedClassified: vi.fn(),
  createTeamsWantedClassified: vi.fn(),
  deletePlayersWantedClassified: vi.fn(),
  deleteTeamsWantedClassified: vi.fn(),
  getTeamsWantedByAccessCode: vi.fn(),
  getTeamsWantedContactInfo: vi.fn(),
  listPlayerClassifiedExperienceLevels: vi.fn(),
  listPlayerClassifiedPositions: vi.fn(),
  listPlayersWantedClassifieds: vi.fn(),
  listTeamsWantedClassifieds: vi.fn(),
  updatePlayersWantedClassified: vi.fn(),
  updateTeamsWantedClassified: vi.fn(),
  verifyTeamsWantedAccess: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-6';
const CLASSIFIED_ID = 'cl-15';
const TOKEN = 'bearer-tok';
const ACCESS_CODE = 'AC-XYZ';

const playersWantedClassified = {
  id: CLASSIFIED_ID,
  accountId: ACCOUNT_ID,
  title: 'Looking for Pitcher',
  position: 'Pitcher',
  experienceLevel: 'Intermediate',
};

const teamsWantedClassified = {
  id: CLASSIFIED_ID,
  accountId: ACCOUNT_ID,
  title: 'Looking for Team',
  accessCode: ACCESS_CODE,
};

const pagedPlayersWanted = {
  classifieds: [playersWantedClassified],
  pagination: { total: 1, page: 1, limit: 20 },
};

const pagedTeamsWanted = {
  classifieds: [teamsWantedClassified],
  pagination: { total: 1, page: 1, limit: 20 },
};

describe('playerClassifiedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPlayersWanted', () => {
    it('creates and returns a players wanted classified', async () => {
      vi.mocked(createPlayersWantedClassified).mockResolvedValue(makeOk(playersWantedClassified));

      const dto = { title: 'Looking for Pitcher', position: 'Pitcher' };
      const result = await playerClassifiedService.createPlayersWanted(
        ACCOUNT_ID,
        dto as never,
        TOKEN,
      );

      expect(createPlayersWantedClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: dto,
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(CLASSIFIED_ID);
      expect((result as Record<string, unknown>).title).toBe('Looking for Pitcher');
    });

    it('throws ApiClientError when creation fails', async () => {
      vi.mocked(createPlayersWantedClassified).mockResolvedValue(
        makeError('Validation error', 422),
      );
      await expect(
        playerClassifiedService.createPlayersWanted(ACCOUNT_ID, { title: 'X' } as never, TOKEN),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getPlayersWanted', () => {
    it('returns paged players wanted classifieds', async () => {
      vi.mocked(listPlayersWantedClassifieds).mockResolvedValue(makeOk(pagedPlayersWanted));

      const result = await playerClassifiedService.getPlayersWanted(ACCOUNT_ID, {
        page: 1,
        limit: 20,
      });

      expect(listPlayersWantedClassifieds).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          query: { page: 1, limit: 20 },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).classifieds).toHaveLength(1);
      expect(
        ((result as Record<string, unknown>).classifieds as Record<string, unknown>[])[0].id,
      ).toBe(CLASSIFIED_ID);
    });

    it('passes undefined query when no params provided', async () => {
      vi.mocked(listPlayersWantedClassifieds).mockResolvedValue(makeOk(pagedPlayersWanted));

      await playerClassifiedService.getPlayersWanted(ACCOUNT_ID);

      expect(vi.mocked(listPlayersWantedClassifieds).mock.calls[0][0].query).toBeUndefined();
    });

    it('passes AbortSignal through', async () => {
      vi.mocked(listPlayersWantedClassifieds).mockResolvedValue(makeOk(pagedPlayersWanted));
      const controller = new AbortController();
      await playerClassifiedService.getPlayersWanted(ACCOUNT_ID, undefined, controller.signal);
      expect(vi.mocked(listPlayersWantedClassifieds).mock.calls[0][0].signal).toBe(
        controller.signal,
      );
    });

    it('throws when API errors', async () => {
      vi.mocked(listPlayersWantedClassifieds).mockResolvedValue(makeError('Server error', 500));
      await expect(playerClassifiedService.getPlayersWanted(ACCOUNT_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('updatePlayersWanted', () => {
    it('updates and returns the classified', async () => {
      const updated = { ...playersWantedClassified, title: 'Updated Title' };
      vi.mocked(updatePlayersWantedClassified).mockResolvedValue(makeOk(updated));

      const result = await playerClassifiedService.updatePlayersWanted(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        { title: 'Updated Title' } as never,
        TOKEN,
      );

      expect(updatePlayersWantedClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, classifiedId: CLASSIFIED_ID },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).title).toBe('Updated Title');
    });
  });

  describe('deletePlayersWanted', () => {
    it('resolves without error on success', async () => {
      vi.mocked(deletePlayersWantedClassified).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(
        playerClassifiedService.deletePlayersWanted(ACCOUNT_ID, CLASSIFIED_ID, TOKEN),
      ).resolves.toBeUndefined();

      expect(deletePlayersWantedClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, classifiedId: CLASSIFIED_ID },
          throwOnError: false,
        }),
      );
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(deletePlayersWantedClassified).mockResolvedValue(makeError('Forbidden', 403));
      await expect(
        playerClassifiedService.deletePlayersWanted(ACCOUNT_ID, CLASSIFIED_ID, TOKEN),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createTeamsWanted', () => {
    it('creates and returns a teams wanted classified', async () => {
      vi.mocked(createTeamsWantedClassified).mockResolvedValue(makeOk(teamsWantedClassified));

      const dto = { title: 'Looking for Team' };
      const result = await playerClassifiedService.createTeamsWanted(ACCOUNT_ID, dto as never);

      expect(createTeamsWantedClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: dto,
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(CLASSIFIED_ID);
    });
  });

  describe('getTeamsWanted', () => {
    it('returns paged teams wanted classifieds', async () => {
      vi.mocked(listTeamsWantedClassifieds).mockResolvedValue(makeOk(pagedTeamsWanted));

      const result = await playerClassifiedService.getTeamsWanted(ACCOUNT_ID, { page: 1 }, TOKEN);

      expect(listTeamsWantedClassifieds).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).classifieds).toHaveLength(1);
    });

    it('filters out undefined query params', async () => {
      vi.mocked(listTeamsWantedClassifieds).mockResolvedValue(makeOk(pagedTeamsWanted));

      await playerClassifiedService.getTeamsWanted(
        ACCOUNT_ID,
        { page: 1, searchQuery: undefined },
        TOKEN,
      );

      const query = vi.mocked(listTeamsWantedClassifieds).mock.calls[0][0].query;
      expect(query).not.toHaveProperty('searchQuery');
    });
  });

  describe('updateTeamsWanted', () => {
    it('updates and returns the teams wanted classified', async () => {
      const updated = { ...teamsWantedClassified, title: 'New Title' };
      vi.mocked(updateTeamsWantedClassified).mockResolvedValue(makeOk(updated));

      const result = await playerClassifiedService.updateTeamsWanted(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        { title: 'New Title' } as never,
        TOKEN,
      );

      expect(updateTeamsWantedClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, classifiedId: CLASSIFIED_ID },
          body: { title: 'New Title' },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).title).toBe('New Title');
    });

    it('merges accessCode into the request body when provided', async () => {
      vi.mocked(updateTeamsWantedClassified).mockResolvedValue(makeOk(teamsWantedClassified));

      await playerClassifiedService.updateTeamsWanted(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        { title: 'T' } as never,
        undefined,
        ACCESS_CODE,
      );

      const body = vi.mocked(updateTeamsWantedClassified).mock.calls[0][0].body;
      expect(body!.accessCode).toBe(ACCESS_CODE);
    });
  });

  describe('deleteTeamsWanted', () => {
    it('resolves without error on success', async () => {
      vi.mocked(deleteTeamsWantedClassified).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(
        playerClassifiedService.deleteTeamsWanted(ACCOUNT_ID, CLASSIFIED_ID, TOKEN),
      ).resolves.toBeUndefined();
    });

    it('passes accessCode in body when provided', async () => {
      vi.mocked(deleteTeamsWantedClassified).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await playerClassifiedService.deleteTeamsWanted(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        undefined,
        ACCESS_CODE,
      );

      const call = vi.mocked(deleteTeamsWantedClassified).mock.calls[0][0];
      expect(call.body).toEqual({ accessCode: ACCESS_CODE });
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(deleteTeamsWantedClassified).mockResolvedValue(makeError('Not found', 404));
      await expect(
        playerClassifiedService.deleteTeamsWanted(ACCOUNT_ID, CLASSIFIED_ID, TOKEN),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getTeamsWantedContactForEdit', () => {
    it('returns contact info for editing', async () => {
      const contactInfo = { id: CLASSIFIED_ID, email: 'owner@example.com', phone: '555-1234' };
      vi.mocked(getTeamsWantedContactInfoApi).mockResolvedValue(makeOk(contactInfo));

      const result = await playerClassifiedService.getTeamsWantedContactForEdit(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        ACCESS_CODE,
        TOKEN,
      );

      expect(result).toEqual(contactInfo);
    });

    it('passes accessCode as query param when no token provided', async () => {
      vi.mocked(getTeamsWantedContactInfoApi).mockResolvedValue(makeOk({}));

      await playerClassifiedService.getTeamsWantedContactForEdit(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        ACCESS_CODE,
      );

      const call = vi.mocked(getTeamsWantedContactInfoApi).mock.calls[0][0];
      expect(call.query).toEqual({ accessCode: ACCESS_CODE });
    });

    it('sends no query when token is provided', async () => {
      vi.mocked(getTeamsWantedContactInfoApi).mockResolvedValue(makeOk({}));

      await playerClassifiedService.getTeamsWantedContactForEdit(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        ACCESS_CODE,
        TOKEN,
      );

      const call = vi.mocked(getTeamsWantedContactInfoApi).mock.calls[0][0];
      expect(call.query).toBeUndefined();
    });
  });

  describe('verifyTeamsWantedAccessCode', () => {
    it('verifies access code and returns the classified', async () => {
      vi.mocked(getTeamsWantedByAccessCodeApi).mockResolvedValue(makeOk(teamsWantedClassified));

      const result = await playerClassifiedService.verifyTeamsWantedAccessCode(
        ACCOUNT_ID,
        ACCESS_CODE,
      );

      expect(getTeamsWantedByAccessCodeApi).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: { accessCode: ACCESS_CODE },
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(CLASSIFIED_ID);
    });
  });

  describe('verifyTeamsWantedAccess', () => {
    it('verifies access for a specific classified', async () => {
      vi.mocked(verifyTeamsWantedAccessApi).mockResolvedValue(makeOk(teamsWantedClassified));

      const result = await playerClassifiedService.verifyTeamsWantedAccess(
        ACCOUNT_ID,
        CLASSIFIED_ID,
        ACCESS_CODE,
      );

      expect(verifyTeamsWantedAccessApi).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, classifiedId: CLASSIFIED_ID },
          body: { accessCode: ACCESS_CODE },
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(CLASSIFIED_ID);
    });
  });

  describe('contactPlayersWantedCreator', () => {
    it('sends a contact message without error', async () => {
      vi.mocked(contactPlayersWantedCreatorApi).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      const messageData = {
        senderName: 'Bob',
        senderEmail: 'bob@example.com',
        message: 'Interested in your listing!',
      };

      await expect(
        playerClassifiedService.contactPlayersWantedCreator(ACCOUNT_ID, CLASSIFIED_ID, messageData),
      ).resolves.toBeUndefined();

      expect(contactPlayersWantedCreatorApi).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, classifiedId: CLASSIFIED_ID },
          body: messageData,
          throwOnError: false,
        }),
      );
    });

    it('throws ApiClientError when the contact message fails', async () => {
      vi.mocked(contactPlayersWantedCreatorApi).mockResolvedValue(makeError('Server error', 500));
      await expect(
        playerClassifiedService.contactPlayersWantedCreator(ACCOUNT_ID, CLASSIFIED_ID, {
          senderName: 'X',
          senderEmail: 'x@x.com',
          message: 'Hi',
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listPlayerClassifiedPositions', () => {
    it('returns a list of position names', async () => {
      vi.mocked(listPlayerClassifiedPositions).mockResolvedValue(
        makeOk([
          { id: 'pos-1', name: 'Pitcher' },
          { id: 'pos-2', name: 'Catcher' },
        ]),
      );

      const result = await playerClassifiedService.listPlayerClassifiedPositions(ACCOUNT_ID);

      expect(result).toEqual(['Pitcher', 'Catcher']);
    });

    it('throws when API errors', async () => {
      vi.mocked(listPlayerClassifiedPositions).mockResolvedValue(makeError('Not found', 404));
      await expect(
        playerClassifiedService.listPlayerClassifiedPositions(ACCOUNT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listPlayerClassifiedExperienceLevels', () => {
    it('returns a list of experience level names', async () => {
      vi.mocked(listPlayerClassifiedExperienceLevels).mockResolvedValue(
        makeOk([
          { id: 'lvl-1', name: 'Beginner' },
          { id: 'lvl-2', name: 'Intermediate' },
          { id: 'lvl-3', name: 'Advanced' },
        ]),
      );

      const result = await playerClassifiedService.listPlayerClassifiedExperienceLevels(ACCOUNT_ID);

      expect(result).toEqual(['Beginner', 'Intermediate', 'Advanced']);
    });
  });

  describe('buildSearchParams', () => {
    it('returns empty URLSearchParams when no params are given', () => {
      const result = playerClassifiedService.buildSearchParams();
      expect(result.toString()).toBe('');
    });

    it('builds correct query string from params', () => {
      const result = playerClassifiedService.buildSearchParams({
        page: 2,
        limit: 10,
        searchQuery: 'pitcher',
      });

      expect(result.get('page')).toBe('2');
      expect(result.get('limit')).toBe('10');
      expect(result.get('searchQuery')).toBe('pitcher');
    });

    it('skips undefined and null values', () => {
      const result = playerClassifiedService.buildSearchParams({
        page: 1,
        limit: undefined,
        sortBy: null,
      } as never);
      expect(result.has('limit')).toBe(false);
      expect(result.has('sortBy')).toBe(false);
      expect(result.get('page')).toBe('1');
    });
  });
});
