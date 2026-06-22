import { PrismaClient, schedulerrun } from '#prisma/client';
import type {
  ISchedulerRunRepository,
  SchedulerRunCreateData,
  SchedulerRunProgressUpdate,
} from '../interfaces/ISchedulerRunRepository.js';

export class PrismaSchedulerRunRepository implements ISchedulerRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: SchedulerRunCreateData): Promise<schedulerrun> {
    return this.prisma.schedulerrun.create({ data });
  }

  async findByRunId(
    accountid: bigint,
    seasonid: bigint,
    runid: string,
  ): Promise<schedulerrun | null> {
    return this.prisma.schedulerrun.findFirst({
      where: { runid, accountid, seasonid },
    });
  }

  async claimQueued(runid: string, total: number): Promise<boolean> {
    const result = await this.prisma.schedulerrun.updateMany({
      where: { runid, status: 'queued' },
      data: { status: 'running', processed: 0, total },
    });
    return result.count === 1;
  }

  async update(runid: string, data: SchedulerRunProgressUpdate): Promise<schedulerrun> {
    return this.prisma.schedulerrun.update({
      where: { runid },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.processed !== undefined ? { processed: data.processed } : {}),
        ...(data.total !== undefined ? { total: data.total } : {}),
        ...(data.result !== undefined ? { result: data.result } : {}),
        ...(data.error !== undefined ? { error: data.error === null ? null : data.error } : {}),
      },
    });
  }
}
