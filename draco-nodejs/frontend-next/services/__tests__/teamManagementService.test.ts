import { describe, expect, it, beforeEach, vi } from 'vitest';
import { updateTeamSeason as apiUpdateTeamSeason } from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { TeamManagementService } from '../teamManagementService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  updateTeamSeason: vi.fn(),
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

const teamSeasonFixture = {
  id: 'ts-1',
  accountId: 'acct-1',
  seasonId: 'season-1',
  name: 'Eagles',
  logoUrl: null,
};

const updateContext = {
  accountId: 'acct-1',
  seasonId: 'season-1',
  teamSeasonId: 'ts-1',
};

describe('TeamManagementService', () => {
  let service: TeamManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeamManagementService(undefined, mockClient);
  });

  describe('updateTeamMetadata', () => {
    it('updates team name without a logo', async () => {
      vi.mocked(apiUpdateTeamSeason).mockResolvedValue(makeOkResult(teamSeasonFixture));

      const result = await service.updateTeamMetadata(updateContext, { name: 'Eagles' });

      expect(apiUpdateTeamSeason).toHaveBeenCalledWith({
        path: updateContext,
        client: mockClient,
        body: { name: 'Eagles' },
        throwOnError: false,
      });
      expect(result).toEqual(teamSeasonFixture);
    });

    it('includes logo and multipart headers when a logoFile is provided', async () => {
      const updated = { ...teamSeasonFixture, logoUrl: 'https://cdn.example.com/logo.png' };
      vi.mocked(apiUpdateTeamSeason).mockResolvedValue(makeOkResult(updated));

      const logoFile = new File(['img'], 'logo.png', { type: 'image/png' });
      const result = await service.updateTeamMetadata(updateContext, {
        name: 'Eagles',
        logoFile,
      });

      expect(apiUpdateTeamSeason).toHaveBeenCalledWith(
        expect.objectContaining({
          path: updateContext,
          body: { name: 'Eagles', logo: logoFile },
          headers: { 'Content-Type': null },
        }),
      );
      expect((result as Record<string, unknown>).logoUrl).toBe('https://cdn.example.com/logo.png');
    });

    it('does not add multipart headers when no logo is provided', async () => {
      vi.mocked(apiUpdateTeamSeason).mockResolvedValue(makeOkResult(teamSeasonFixture));

      await service.updateTeamMetadata(updateContext, { name: 'Eagles' });

      const callArg = vi.mocked(apiUpdateTeamSeason).mock.calls[0][0];
      expect(callArg).not.toHaveProperty('headers');
    });

    it('throws ApiClientError when the update fails', async () => {
      vi.mocked(apiUpdateTeamSeason).mockResolvedValue(makeErrorResult('Not found'));

      await expect(
        service.updateTeamMetadata(updateContext, { name: 'Eagles' }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });

    it('correctly passes the full context path to the API call', async () => {
      vi.mocked(apiUpdateTeamSeason).mockResolvedValue(makeOkResult(teamSeasonFixture));

      await service.updateTeamMetadata(
        { accountId: 'a-99', seasonId: 's-5', teamSeasonId: 'ts-7' },
        { name: 'Falcons' },
      );

      expect(apiUpdateTeamSeason).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: 'a-99', seasonId: 's-5', teamSeasonId: 'ts-7' },
          body: { name: 'Falcons' },
        }),
      );
    });
  });
});
