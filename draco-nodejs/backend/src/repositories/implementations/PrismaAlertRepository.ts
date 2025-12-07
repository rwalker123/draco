import { PrismaClient, alerts } from '#prisma/client';
import { IAlertRepository } from '../interfaces/IAlertRepository.js';
import { dbAlert } from '../types/index.js';

export class PrismaAlertRepository implements IAlertRepository {
  private readonly alertSelect = {
    id: true,
    message: true,
    isactive: true,
    createdat: true,
    updatedat: true,
  } as const;

  constructor(private readonly prisma: PrismaClient) {}

  async listActiveAlerts(): Promise<dbAlert[]> {
    return this.prisma.alerts.findMany({
      where: { isactive: true },
      select: this.alertSelect,
      orderBy: [{ createdat: 'desc' }, { id: 'desc' }],
    });
  }

  async listAlerts(): Promise<dbAlert[]> {
    return this.prisma.alerts.findMany({
      select: this.alertSelect,
      orderBy: [{ createdat: 'desc' }, { id: 'desc' }],
    });
  }

  async findById(alertId: bigint): Promise<dbAlert | null> {
    return this.prisma.alerts.findUnique({
      where: { id: alertId },
      select: this.alertSelect,
    });
  }

  async createAlert(data: Partial<alerts>): Promise<alerts> {
    return this.prisma.alerts.create({
      data: data as Parameters<typeof this.prisma.alerts.create>[0]['data'],
    });
  }

  async updateAlert(alertId: bigint, data: Partial<alerts>): Promise<alerts> {
    return this.prisma.alerts.update({
      where: { id: alertId },
      data,
    });
  }

  async deleteAlert(alertId: bigint): Promise<void> {
    await this.prisma.alerts.delete({ where: { id: alertId } });
  }
}
