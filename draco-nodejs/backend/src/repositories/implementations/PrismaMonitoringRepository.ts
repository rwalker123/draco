import { PrismaClient } from '@prisma/client';
import { IMonitoringRepository } from '../interfaces/index.js';
import { dbMonitoringConnectivityResult } from '../types/index.js';

export class PrismaMonitoringRepository implements IMonitoringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async testDatabaseConnectivity(): Promise<dbMonitoringConnectivityResult> {
    const result = await this.prisma.$queryRaw<dbMonitoringConnectivityResult[]>`
      SELECT 1 as connectivity_test
    `;

    if (!result[0]) {
      throw new Error('Unable to verify database connectivity');
    }

    return result[0];
  }
}
