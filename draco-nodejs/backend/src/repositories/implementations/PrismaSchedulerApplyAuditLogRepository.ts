import { PrismaClient, schedulerapplyauditlog } from '#prisma/client';
import type {
  ISchedulerApplyAuditLogRepository,
  SchedulerApplyAuditLogCreateData,
} from '../interfaces/ISchedulerApplyAuditLogRepository.js';

export class PrismaSchedulerApplyAuditLogRepository implements ISchedulerApplyAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: SchedulerApplyAuditLogCreateData): Promise<schedulerapplyauditlog> {
    return this.prisma.schedulerapplyauditlog.create({ data });
  }
}
