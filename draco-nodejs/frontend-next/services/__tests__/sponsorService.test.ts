import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountSponsors as apiListAccountSponsors,
  createAccountSponsor as apiCreateAccountSponsor,
  updateAccountSponsor as apiUpdateAccountSponsor,
  deleteAccountSponsor as apiDeleteAccountSponsor,
  listTeamSponsors as apiListTeamSponsors,
  createTeamSponsor as apiCreateTeamSponsor,
  updateTeamSponsor as apiUpdateTeamSponsor,
  deleteTeamSponsor as apiDeleteTeamSponsor,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { SponsorService } from '../sponsorService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  listAccountSponsors: vi.fn(),
  createAccountSponsor: vi.fn(),
  updateAccountSponsor: vi.fn(),
  deleteAccountSponsor: vi.fn(),
  listTeamSponsors: vi.fn(),
  createTeamSponsor: vi.fn(),
  updateTeamSponsor: vi.fn(),
  deleteTeamSponsor: vi.fn(),
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

const sponsorFixture = {
  id: 'sp-1',
  accountId: 'acct-1',
  name: 'Acme Corp',
  website: 'https://acme.com',
};

const sponsorListFixture = { sponsors: [sponsorFixture] };

describe('SponsorService', () => {
  let service: SponsorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SponsorService(undefined, mockClient);
  });

  describe('listAccountSponsors', () => {
    it('returns sponsors for an account', async () => {
      vi.mocked(apiListAccountSponsors).mockResolvedValue(makeOkResult(sponsorListFixture));

      const result = await service.listAccountSponsors('acct-1');

      expect(apiListAccountSponsors).toHaveBeenCalledWith({
        path: { accountId: 'acct-1' },
        client: mockClient,
        signal: undefined,
        throwOnError: false,
      });
      expect(result).toEqual([sponsorFixture]);
    });

    it('returns an empty array when the sponsors field is absent', async () => {
      vi.mocked(apiListAccountSponsors).mockResolvedValue(makeOkResult({ sponsors: undefined }));

      const result = await service.listAccountSponsors('acct-1');

      expect(result).toEqual([]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListAccountSponsors).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.listAccountSponsors('acct-1')).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listTeamSponsors', () => {
    it('returns sponsors for a team', async () => {
      vi.mocked(apiListTeamSponsors).mockResolvedValue(makeOkResult(sponsorListFixture));

      const result = await service.listTeamSponsors('acct-1', 'season-1', 'ts-1');

      expect(apiListTeamSponsors).toHaveBeenCalledWith({
        path: { accountId: 'acct-1', seasonId: 'season-1', teamSeasonId: 'ts-1' },
        client: mockClient,
        signal: undefined,
        throwOnError: false,
      });
      expect(result).toEqual([sponsorFixture]);
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiListTeamSponsors).mockResolvedValue(makeErrorResult('Not found'));

      await expect(service.listTeamSponsors('acct-1', 's-1', 'ts-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createAccountSponsor', () => {
    it('creates a sponsor without a photo', async () => {
      vi.mocked(apiCreateAccountSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      const input = { name: 'Acme Corp', website: 'https://acme.com' };
      const result = await service.createAccountSponsor('acct-1', input);

      expect(apiCreateAccountSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1' },
          client: mockClient,
          throwOnError: false,
          body: expect.objectContaining({ name: 'Acme Corp' }),
        }),
      );
      expect(result).toEqual(sponsorFixture);
    });

    it('creates a sponsor with a photo using multipart form data', async () => {
      vi.mocked(apiCreateAccountSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      const file = new File(['img'], 'logo.png', { type: 'image/png' });
      const input = { name: 'Acme Corp', photo: file };
      await service.createAccountSponsor('acct-1', input);

      expect(apiCreateAccountSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ photo: file }),
          headers: { 'Content-Type': null },
        }),
      );
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiCreateAccountSponsor).mockResolvedValue(makeErrorResult('Validation failed'));

      await expect(service.createAccountSponsor('acct-1', { name: 'X' })).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('updateAccountSponsor', () => {
    it('updates a sponsor without a photo', async () => {
      const updated = { ...sponsorFixture, name: 'Acme Ltd' };
      vi.mocked(apiUpdateAccountSponsor).mockResolvedValue(makeOkResult(updated));

      const result = await service.updateAccountSponsor('acct-1', 'sp-1', { name: 'Acme Ltd' });

      expect(apiUpdateAccountSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', sponsorId: 'sp-1' },
          body: expect.objectContaining({ name: 'Acme Ltd' }),
        }),
      );
      expect(result.name).toBe('Acme Ltd');
    });

    it('updates a sponsor with a photo', async () => {
      vi.mocked(apiUpdateAccountSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      const file = new File(['img'], 'new-logo.png', { type: 'image/png' });
      await service.updateAccountSponsor('acct-1', 'sp-1', { name: 'Acme Corp', photo: file });

      expect(apiUpdateAccountSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ photo: file }),
          headers: { 'Content-Type': null },
        }),
      );
    });

    it('throws ApiClientError on API failure', async () => {
      vi.mocked(apiUpdateAccountSponsor).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.updateAccountSponsor('acct-1', 'sp-1', { name: 'X' }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteAccountSponsor', () => {
    it('deletes an account sponsor successfully', async () => {
      vi.mocked(apiDeleteAccountSponsor).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteAccountSponsor('acct-1', 'sp-1')).resolves.toBeUndefined();
      expect(apiDeleteAccountSponsor).toHaveBeenCalledWith({
        path: { accountId: 'acct-1', sponsorId: 'sp-1' },
        client: mockClient,
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteAccountSponsor).mockResolvedValue(makeErrorResult('Forbidden'));

      await expect(service.deleteAccountSponsor('acct-1', 'sp-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('createTeamSponsor', () => {
    it('creates a team sponsor without a photo', async () => {
      vi.mocked(apiCreateTeamSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      const result = await service.createTeamSponsor('acct-1', 'season-1', 'ts-1', {
        name: 'Acme Corp',
      });

      expect(apiCreateTeamSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'acct-1', seasonId: 'season-1', teamSeasonId: 'ts-1' },
          body: expect.objectContaining({ name: 'Acme Corp' }),
        }),
      );
      expect(result).toEqual(sponsorFixture);
    });

    it('creates a team sponsor with a photo', async () => {
      vi.mocked(apiCreateTeamSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      const file = new File(['img'], 'logo.png', { type: 'image/png' });
      await service.createTeamSponsor('acct-1', 'season-1', 'ts-1', {
        name: 'Acme Corp',
        photo: file,
      });

      expect(apiCreateTeamSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ photo: file }),
          headers: { 'Content-Type': null },
        }),
      );
    });
  });

  describe('updateTeamSponsor', () => {
    it('updates a team sponsor without a photo', async () => {
      vi.mocked(apiUpdateTeamSponsor).mockResolvedValue(makeOkResult(sponsorFixture));

      await service.updateTeamSponsor('acct-1', 'season-1', 'ts-1', 'sp-1', {
        name: 'Acme Corp',
      });

      expect(apiUpdateTeamSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: 'acct-1',
            seasonId: 'season-1',
            teamSeasonId: 'ts-1',
            sponsorId: 'sp-1',
          },
        }),
      );
    });
  });

  describe('deleteTeamSponsor', () => {
    it('deletes a team sponsor successfully', async () => {
      vi.mocked(apiDeleteTeamSponsor).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(
        service.deleteTeamSponsor('acct-1', 'season-1', 'ts-1', 'sp-1'),
      ).resolves.toBeUndefined();
      expect(apiDeleteTeamSponsor).toHaveBeenCalledWith({
        path: {
          accountId: 'acct-1',
          seasonId: 'season-1',
          teamSeasonId: 'ts-1',
          sponsorId: 'sp-1',
        },
        client: mockClient,
        throwOnError: false,
      });
    });

    it('throws ApiClientError when deletion is rejected', async () => {
      vi.mocked(apiDeleteTeamSponsor).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.deleteTeamSponsor('acct-1', 'season-1', 'ts-1', 'sp-1'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
