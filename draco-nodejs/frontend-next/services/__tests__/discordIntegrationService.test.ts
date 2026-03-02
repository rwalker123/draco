import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getAccountDiscordConfig as apiGetConfig,
  updateAccountDiscordConfig as apiUpdateConfig,
  deleteAccountDiscordConfig as apiDeleteConfig,
  getAccountDiscordLinkStatus as apiGetLinkStatus,
  startAccountDiscordLink as apiStartLink,
  deleteAccountDiscordLink as apiDeleteLink,
  startAccountDiscordInstall as apiStartInstall,
  listAccountDiscordRoleMappings as apiListRoleMappings,
  createAccountDiscordRoleMapping as apiCreateRoleMapping,
  updateAccountDiscordRoleMapping as apiUpdateRoleMapping,
  deleteAccountDiscordRoleMapping as apiDeleteRoleMapping,
  listAccountDiscordChannelMappings as apiListChannelMappings,
  createAccountDiscordChannelMapping as apiCreateChannelMapping,
  deleteAccountDiscordChannelMapping as apiDeleteChannelMapping,
  listAccountDiscordAvailableChannels as apiListChannels,
  getAccountDiscordFeatureSync as apiGetFeatureSync,
  updateAccountDiscordFeatureSync as apiUpdateFeatureSync,
  listAccountDiscordTeamForums as apiListTeamForums,
  repairAccountDiscordTeamForums as apiRepairTeamForums,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { DiscordIntegrationService } from '../discordIntegrationService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  getAccountDiscordConfig: vi.fn(),
  updateAccountDiscordConfig: vi.fn(),
  deleteAccountDiscordConfig: vi.fn(),
  getAccountDiscordLinkStatus: vi.fn(),
  startAccountDiscordLink: vi.fn(),
  deleteAccountDiscordLink: vi.fn(),
  startAccountDiscordInstall: vi.fn(),
  listAccountDiscordRoleMappings: vi.fn(),
  createAccountDiscordRoleMapping: vi.fn(),
  updateAccountDiscordRoleMapping: vi.fn(),
  deleteAccountDiscordRoleMapping: vi.fn(),
  listAccountDiscordChannelMappings: vi.fn(),
  createAccountDiscordChannelMapping: vi.fn(),
  deleteAccountDiscordChannelMapping: vi.fn(),
  listAccountDiscordAvailableChannels: vi.fn(),
  getAccountDiscordFeatureSync: vi.fn(),
  updateAccountDiscordFeatureSync: vi.fn(),
  listAccountDiscordTeamForums: vi.fn(),
  repairAccountDiscordTeamForums: vi.fn(),
}));

const ACCOUNT_ID = 'account-7';

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

const discordConfig = {
  id: 'config-1',
  accountId: ACCOUNT_ID,
  guildId: 'guild-123',
  guildName: 'My League Server',
};

const linkStatus = {
  isLinked: true,
  guildId: 'guild-123',
  guildName: 'My League Server',
};

describe('DiscordIntegrationService', () => {
  let client: Client;
  let service: DiscordIntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {} as Client;
    service = new DiscordIntegrationService(client);
  });

  describe('getAccountConfig', () => {
    it('fetches the Discord config and returns it', async () => {
      vi.mocked(apiGetConfig).mockResolvedValue(makeOk(discordConfig));

      const result = await service.getAccountConfig(ACCOUNT_ID);

      expect(apiGetConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect(result).toEqual(discordConfig);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiGetConfig).mockResolvedValue(makeError('Not found', 404));

      await expect(service.getAccountConfig(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateAccountConfig', () => {
    it('updates the config and returns the updated record', async () => {
      const updated = { ...discordConfig, guildName: 'Renamed Server' };
      vi.mocked(apiUpdateConfig).mockResolvedValue(makeOk(updated));

      const result = await service.updateAccountConfig(ACCOUNT_ID, {
        guildName: 'Renamed Server',
      } as never);

      expect(apiUpdateConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        body: { guildName: 'Renamed Server' },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).guildName).toBe('Renamed Server');
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiUpdateConfig).mockResolvedValue(makeError('Forbidden', 403));

      await expect(service.updateAccountConfig(ACCOUNT_ID, {} as never)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('disconnectAccountGuild', () => {
    it('sends a delete config request and returns the updated config', async () => {
      const cleared = { ...discordConfig, guildId: null };
      vi.mocked(apiDeleteConfig).mockResolvedValue(makeOk(cleared));

      const result = await service.disconnectAccountGuild(ACCOUNT_ID);

      expect(apiDeleteConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect(result.guildId).toBeNull();
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiDeleteConfig).mockResolvedValue(makeError('Server Error', 500));

      await expect(service.disconnectAccountGuild(ACCOUNT_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('getLinkStatus', () => {
    it('returns the link status', async () => {
      vi.mocked(apiGetLinkStatus).mockResolvedValue(makeOk(linkStatus));

      const result = await service.getLinkStatus(ACCOUNT_ID);

      expect((result as Record<string, unknown>).isLinked).toBe(true);
      expect((result as Record<string, unknown>).guildId).toBe('guild-123');
    });

    it('passes an AbortSignal to the API call', async () => {
      vi.mocked(apiGetLinkStatus).mockResolvedValue(makeOk(linkStatus));
      const controller = new AbortController();

      await service.getLinkStatus(ACCOUNT_ID, controller.signal);

      expect(apiGetLinkStatus).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('startLink', () => {
    it('initiates the OAuth linking flow', async () => {
      const oauthResponse = { redirectUrl: 'https://discord.com/oauth2/authorize?...' };
      vi.mocked(apiStartLink).mockResolvedValue(makeOk(oauthResponse));

      const result = await service.startLink(ACCOUNT_ID);

      expect(apiStartLink).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).redirectUrl).toContain('discord.com');
    });
  });

  describe('unlinkAccount', () => {
    it('unlinks the Discord account', async () => {
      const unlinked = { ...linkStatus, isLinked: false };
      vi.mocked(apiDeleteLink).mockResolvedValue(makeOk(unlinked));

      const result = await service.unlinkAccount(ACCOUNT_ID);

      expect(apiDeleteLink).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).isLinked).toBe(false);
    });
  });

  describe('startBotInstall', () => {
    it('starts the bot install OAuth flow', async () => {
      const oauthResponse = { redirectUrl: 'https://discord.com/oauth2/bot?...' };
      vi.mocked(apiStartInstall).mockResolvedValue(makeOk(oauthResponse));

      const result = await service.startBotInstall(ACCOUNT_ID);

      expect(apiStartInstall).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).redirectUrl).toContain('discord.com');
    });
  });

  describe('listRoleMappings', () => {
    it('returns the list of role mappings', async () => {
      const mappings = { mappings: [{ id: 'rm-1', discordRoleId: 'dr-1', dracoRoleId: 'role-1' }] };
      vi.mocked(apiListRoleMappings).mockResolvedValue(makeOk(mappings));

      const result = await service.listRoleMappings(ACCOUNT_ID);

      expect(result).toEqual(mappings);
    });
  });

  describe('createRoleMapping', () => {
    it('creates a role mapping and returns the new record', async () => {
      const mapping = { id: 'rm-2', discordRoleId: 'dr-2', dracoRoleId: 'role-2' };
      vi.mocked(apiCreateRoleMapping).mockResolvedValue(makeOk(mapping));

      const payload = { discordRoleId: 'dr-2', dracoRoleId: 'role-2' } as never;
      const result = await service.createRoleMapping(ACCOUNT_ID, payload);

      expect(apiCreateRoleMapping).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        body: payload,
        throwOnError: false,
      });
      expect(result.id).toBe('rm-2');
    });
  });

  describe('updateRoleMapping', () => {
    it('updates the specified role mapping', async () => {
      const updated = { id: 'rm-1', discordRoleId: 'dr-99', dracoRoleId: 'role-1' };
      vi.mocked(apiUpdateRoleMapping).mockResolvedValue(makeOk(updated));

      const result = await service.updateRoleMapping(ACCOUNT_ID, 'rm-1', {
        discordRoleId: 'dr-99',
      } as never);

      expect(apiUpdateRoleMapping).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, roleMappingId: 'rm-1' },
        body: { discordRoleId: 'dr-99' },
        throwOnError: false,
      });
      expect(result.discordRoleId).toBe('dr-99');
    });
  });

  describe('deleteRoleMapping', () => {
    it('deletes the specified role mapping', async () => {
      vi.mocked(apiDeleteRoleMapping).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteRoleMapping(ACCOUNT_ID, 'rm-1')).resolves.toBeUndefined();

      expect(apiDeleteRoleMapping).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, roleMappingId: 'rm-1' },
        throwOnError: false,
      });
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiDeleteRoleMapping).mockResolvedValue(makeError('Forbidden', 403));

      await expect(service.deleteRoleMapping(ACCOUNT_ID, 'rm-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('listChannelMappings', () => {
    it('returns the list of channel mappings', async () => {
      const mappings = { mappings: [{ id: 'cm-1', channelId: 'ch-1', eventType: 'game_result' }] };
      vi.mocked(apiListChannelMappings).mockResolvedValue(makeOk(mappings));

      const result = await service.listChannelMappings(ACCOUNT_ID);

      expect(result).toEqual(mappings);
    });
  });

  describe('createChannelMapping', () => {
    it('creates a channel mapping and returns the new record', async () => {
      const mapping = { id: 'cm-2', channelId: 'ch-2', eventType: 'schedule_post' };
      vi.mocked(apiCreateChannelMapping).mockResolvedValue(makeOk(mapping));

      const payload = { channelId: 'ch-2', eventType: 'schedule_post' } as never;
      const result = await service.createChannelMapping(ACCOUNT_ID, payload);

      expect(apiCreateChannelMapping).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        body: payload,
        throwOnError: false,
      });
      expect(result.id).toBe('cm-2');
    });
  });

  describe('deleteChannelMapping', () => {
    it('deletes the specified channel mapping', async () => {
      vi.mocked(apiDeleteChannelMapping).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: { status: 204 } as Response,
      } as never);

      await expect(service.deleteChannelMapping(ACCOUNT_ID, 'cm-1')).resolves.toBeUndefined();

      expect(apiDeleteChannelMapping).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, mappingId: 'cm-1' },
        throwOnError: false,
      });
    });
  });

  describe('listAvailableChannels', () => {
    it('returns the available guild channels', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', type: 'text' },
        { id: 'ch-2', name: 'announcements', type: 'text' },
      ];
      vi.mocked(apiListChannels).mockResolvedValue(makeOk(channels));

      const result = await service.listAvailableChannels(ACCOUNT_ID);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('general');
    });

    it('passes an AbortSignal to the request', async () => {
      vi.mocked(apiListChannels).mockResolvedValue(makeOk([]));
      const controller = new AbortController();

      await service.listAvailableChannels(ACCOUNT_ID, controller.signal);

      expect(apiListChannels).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('getFeatureSyncStatus', () => {
    it('fetches the sync status for a given feature', async () => {
      const status = { feature: 'standings', enabled: true, lastSyncedAt: '2025-01-01T00:00:00Z' };
      vi.mocked(apiGetFeatureSync).mockResolvedValue(makeOk(status));

      const result = await service.getFeatureSyncStatus(ACCOUNT_ID, 'standings' as never);

      expect(apiGetFeatureSync).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, feature: 'standings' },
        signal: undefined,
        throwOnError: false,
      });
      expect(result.enabled).toBe(true);
    });
  });

  describe('updateFeatureSync', () => {
    it('updates the feature sync settings', async () => {
      const updated = { feature: 'standings', enabled: false, lastSyncedAt: null };
      vi.mocked(apiUpdateFeatureSync).mockResolvedValue(makeOk(updated));

      const result = await service.updateFeatureSync(ACCOUNT_ID, 'standings' as never, {
        enabled: false,
      });

      expect(apiUpdateFeatureSync).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, feature: 'standings' },
        body: { enabled: false },
        throwOnError: false,
      });
      expect(result.enabled).toBe(false);
    });
  });

  describe('listTeamForums', () => {
    it('returns the list of team forums', async () => {
      const forums = { forums: [{ id: 'forum-1', teamId: 'team-1', channelId: 'ch-3' }] };
      vi.mocked(apiListTeamForums).mockResolvedValue(makeOk(forums));

      const result = await service.listTeamForums(ACCOUNT_ID);

      expect(apiListTeamForums).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        query: undefined,
        throwOnError: false,
      });
      expect(result).toEqual(forums);
    });

    it('filters out empty/null query values before sending', async () => {
      vi.mocked(apiListTeamForums).mockResolvedValue(makeOk({ forums: [] }));

      await service.listTeamForums(ACCOUNT_ID, {
        seasonId: 'season-1',
        leagueId: undefined,
      } as never);

      expect(apiListTeamForums).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { seasonId: 'season-1' },
        }),
      );
    });
  });

  describe('repairTeamForums', () => {
    it('triggers forum repair and returns the result', async () => {
      const repairResult = { repaired: 3, failed: 0 };
      vi.mocked(apiRepairTeamForums).mockResolvedValue(makeOk(repairResult));

      const result = await service.repairTeamForums(ACCOUNT_ID);

      expect(apiRepairTeamForums).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID },
        throwOnError: false,
      });
      expect(result.repaired).toBe(3);
    });
  });
});
