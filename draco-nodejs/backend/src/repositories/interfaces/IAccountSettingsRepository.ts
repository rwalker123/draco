import { accountsettings } from '#prisma/client';

export interface IAccountSettingsRepository {
  findByAccountId(accountId: bigint): Promise<accountsettings[]>;
  upsert(accountId: bigint, settingKey: string, settingValue: string): Promise<accountsettings>;
  delete(accountId: bigint, settingKey: string): Promise<void>;
}
