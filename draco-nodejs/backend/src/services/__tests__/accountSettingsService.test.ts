import { describe, expect, it, beforeEach } from 'vitest';
import type { accountsettings } from '#prisma/client';
import { AccountSettingsService } from '../accountSettingsService.js';
import type { IAccountSettingsRepository } from '../../repositories/interfaces/index.js';
import { ACCOUNT_SETTING_DEFINITIONS } from '@draco/shared-schemas';
import { ConflictError } from '../../utils/customErrors.js';

class InMemoryAccountSettingsRepository implements IAccountSettingsRepository {
  private readonly store = new Map<string, Map<string, string>>();

  async findByAccountId(accountId: bigint): Promise<accountsettings[]> {
    const accountStore = this.store.get(accountId.toString());
    if (!accountStore) {
      return [];
    }
    return Array.from(accountStore.entries()).map(([settingkey, settingvalue]) => ({
      accountid: accountId,
      settingkey,
      settingvalue,
    })) as accountsettings[];
  }

  async upsert(
    accountId: bigint,
    settingKey: string,
    settingValue: string,
  ): Promise<accountsettings> {
    let accountStore = this.store.get(accountId.toString());
    if (!accountStore) {
      accountStore = new Map();
      this.store.set(accountId.toString(), accountStore);
    }
    accountStore.set(settingKey, settingValue);
    return {
      accountid: accountId,
      settingkey: settingKey,
      settingvalue: settingValue,
    } as accountsettings;
  }

  async delete(accountId: bigint, settingKey: string): Promise<void> {
    const accountStore = this.store.get(accountId.toString());
    if (!accountStore) {
      return;
    }
    accountStore.delete(settingKey);
  }
}

describe('AccountSettingsService', () => {
  const accountId = BigInt(42);
  let repository: InMemoryAccountSettingsRepository;
  let service: AccountSettingsService;

  beforeEach(() => {
    repository = new InMemoryAccountSettingsRepository();
    service = new AccountSettingsService(repository);
  });

  it('returns default values when no settings are stored', async () => {
    const settings = await service.getAccountSettings(accountId);

    expect(settings).toHaveLength(ACCOUNT_SETTING_DEFINITIONS.length);

    const waiverSetting = settings.find((setting) => setting.definition.key === 'TrackWaiver');
    expect(waiverSetting?.value).toBe(false);
    expect(waiverSetting?.isDefault).toBe(true);
    expect(waiverSetting?.isLocked).toBe(false);
  });

  it('updates a boolean setting and persists changes', async () => {
    const updated = await service.updateAccountSetting(accountId, 'TrackWaiver', true);
    expect(updated.value).toBe(true);
    expect(updated.isDefault).toBe(false);
  });

  it('includes the game result email setting with default off', async () => {
    const settings = await service.getAccountSettings(accountId);

    const gameEmailSetting = settings.find(
      (setting) => setting.definition.key === 'EmailGameResultsToTeams',
    );

    expect(gameEmailSetting?.value).toBe(false);
    expect(gameEmailSetting?.isDefault).toBe(true);
  });

  it('prevents enabling a dependent toggle when requirements are not met', async () => {
    await expect(
      service.updateAccountSetting(accountId, 'ShowWaiver', true),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('resets dependent toggles when the parent requirement is disabled', async () => {
    await service.updateAccountSetting(accountId, 'TrackWaiver', true);
    await service.updateAccountSetting(accountId, 'ShowWaiver', true);

    const updated = await service.updateAccountSetting(accountId, 'TrackWaiver', false);
    expect(updated.value).toBe(false);
    expect(updated.isDefault).toBe(true);

    const refreshed = await service.getAccountSettings(accountId);
    const showWaiver = refreshed.find((setting) => setting.definition.key === 'ShowWaiver');
    expect(showWaiver?.value).toBe(false);
    expect(showWaiver?.isDefault).toBe(true);
  });
});
