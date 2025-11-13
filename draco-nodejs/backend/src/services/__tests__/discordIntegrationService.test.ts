import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { accountdiscordchannels } from '@prisma/client';
import { DiscordIntegrationService } from '../discordIntegrationService.js';
import { RepositoryFactory } from '../../repositories/index.js';
import type { IDiscordIntegrationRepository } from '../../repositories/interfaces/IDiscordIntegrationRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IAccountRepository } from '../../repositories/interfaces/IAccountRepository.js';

function createChannelMapping(
  overrides: Partial<accountdiscordchannels> = {},
): accountdiscordchannels {
  return {
    id: overrides.id ?? BigInt(1),
    accountid: overrides.accountid ?? BigInt(1),
    channelid: overrides.channelid ?? '123',
    channelname: overrides.channelname ?? 'general',
    channeltype: overrides.channeltype ?? null,
    label: overrides.label ?? null,
    scope: overrides.scope ?? 'account',
    seasonid: overrides.seasonid ?? null,
    teamseasonid: overrides.teamseasonid ?? null,
    teamid: overrides.teamid ?? null,
    createdat: overrides.createdat ?? new Date(),
    updatedat: overrides.updatedat ?? new Date(),
    accounts: overrides.accounts ?? ({} as unknown as accountdiscordchannels['accounts']),
  };
}

describe('DiscordIntegrationService', () => {
  let listAllChannelMappingsMock: ReturnType<typeof vi.fn>;
  let findChannelMappingByIdMock: ReturnType<typeof vi.fn>;
  let findCurrentSeasonMock: ReturnType<typeof vi.fn>;
  let findAccountByIdMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listAllChannelMappingsMock = vi.fn();
    findChannelMappingByIdMock = vi.fn();
    findCurrentSeasonMock = vi.fn();
    findAccountByIdMock = vi.fn();

    const seasonsRepository = {
      findCurrentSeason:
        findCurrentSeasonMock as unknown as ISeasonsRepository['findCurrentSeason'],
    };

    const discordRepository = {
      listAllChannelMappings:
        listAllChannelMappingsMock as unknown as IDiscordIntegrationRepository['listAllChannelMappings'],
      deleteChannelMapping: vi.fn(),
      findChannelMappingById:
        findChannelMappingByIdMock as unknown as IDiscordIntegrationRepository['findChannelMappingById'],
      deleteChannelMappingsByAccount: vi.fn(),
      deleteRoleMappingsByAccount: vi.fn(),
      deleteLinkedAccounts: vi.fn(),
      deleteFeatureSyncsByAccount: vi.fn(),
      listChannelMappings: vi.fn(),
      createChannelMapping: vi.fn(),
    };

    const accountRepository = {
      findById: findAccountByIdMock as unknown as IAccountRepository['findById'],
    };

    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(
      seasonsRepository as unknown as ISeasonsRepository,
    );
    vi.spyOn(RepositoryFactory, 'getDiscordIntegrationRepository').mockReturnValue(
      discordRepository as unknown as IDiscordIntegrationRepository,
    );
    vi.spyOn(RepositoryFactory, 'getAccountRepository').mockReturnValue(
      accountRepository as unknown as IAccountRepository,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('caches channel ingestion targets between calls', async () => {
    const mapping = createChannelMapping({ scope: 'account' });
    listAllChannelMappingsMock.mockResolvedValue([mapping]);
    findCurrentSeasonMock.mockResolvedValue({
      id: BigInt(42),
    } as Awaited<ReturnType<ISeasonsRepository['findCurrentSeason']>>);

    const service = new DiscordIntegrationService();

    const first = await service.getChannelIngestionTargets();
    const second = await service.getChannelIngestionTargets();

    expect(first).toEqual(second);
    expect(listAllChannelMappingsMock).toHaveBeenCalledTimes(1);
    expect(findCurrentSeasonMock).toHaveBeenCalledTimes(1);
  });

  it('invalidates cached ingestion targets when mappings change', async () => {
    const initialMapping = createChannelMapping({ scope: 'account' });
    listAllChannelMappingsMock.mockResolvedValue([initialMapping]);
    findCurrentSeasonMock.mockResolvedValue({
      id: BigInt(101),
    } as Awaited<ReturnType<ISeasonsRepository['findCurrentSeason']>>);
    findAccountByIdMock.mockResolvedValue({ id: BigInt(1) } as unknown);
    findChannelMappingByIdMock.mockResolvedValue(initialMapping);

    const service = new DiscordIntegrationService();
    await service.getChannelIngestionTargets();

    const updatedMapping = createChannelMapping({
      id: BigInt(2),
      channelid: '456',
      scope: 'season',
      seasonid: BigInt(202),
    });
    listAllChannelMappingsMock.mockResolvedValue([updatedMapping]);
    findCurrentSeasonMock.mockResolvedValue({
      id: BigInt(101),
    } as Awaited<ReturnType<ISeasonsRepository['findCurrentSeason']>>);

    await service.deleteChannelMapping(BigInt(1), BigInt(1));

    const refreshed = await service.getChannelIngestionTargets();

    expect(listAllChannelMappingsMock).toHaveBeenCalledTimes(2);
    expect(refreshed).toEqual([
      {
        accountId: updatedMapping.accountid,
        seasonId: updatedMapping.seasonid as bigint,
        teamSeasonId: undefined,
        teamId: undefined,
        channelId: updatedMapping.channelid,
        label: updatedMapping.label ?? undefined,
      },
    ]);
  });
});
