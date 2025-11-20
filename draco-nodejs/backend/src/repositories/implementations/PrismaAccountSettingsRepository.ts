import { PrismaClient, accountsettings } from '#prisma/client';
import { IAccountSettingsRepository } from '../interfaces/index.js';

export class PrismaAccountSettingsRepository implements IAccountSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountId(accountId: bigint): Promise<accountsettings[]> {
    return this.prisma.accountsettings.findMany({
      where: { accountid: BigInt(accountId) },
    });
  }

  async upsert(
    accountId: bigint,
    settingKey: string,
    settingValue: string,
  ): Promise<accountsettings> {
    return this.prisma.accountsettings.upsert({
      where: {
        accountid_settingkey: {
          accountid: BigInt(accountId),
          settingkey: settingKey,
        },
      },
      update: {
        settingvalue: settingValue,
      },
      create: {
        accountid: BigInt(accountId),
        settingkey: settingKey,
        settingvalue: settingValue,
      },
    });
  }

  async delete(accountId: bigint, settingKey: string): Promise<void> {
    await this.prisma.accountsettings.deleteMany({
      where: {
        accountid: BigInt(accountId),
        settingkey: settingKey,
      },
    });
  }
}
