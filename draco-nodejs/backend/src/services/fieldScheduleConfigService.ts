import type { FieldScheduleConfigType, FieldScheduleConfigUpsertType } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IFieldScheduleConfigRepository } from '../repositories/interfaces/IFieldScheduleConfigRepository.js';
import { FieldScheduleConfigResponseFormatter } from '../responseFormatters/fieldScheduleConfigResponseFormatter.js';
import { NotFoundError } from '../utils/customErrors.js';

export class FieldScheduleConfigService {
  private readonly repo: IFieldScheduleConfigRepository;

  constructor(
    repo: IFieldScheduleConfigRepository = RepositoryFactory.getFieldScheduleConfigRepository(),
  ) {
    this.repo = repo;
  }

  async getConfig(accountId: bigint, fieldId: bigint): Promise<FieldScheduleConfigType> {
    const field = await this.repo.findFieldInAccount(accountId, fieldId);
    if (!field) {
      throw new NotFoundError('Field not found');
    }

    const { openHours, closedDates } = await this.repo.getConfigForField(fieldId);
    return FieldScheduleConfigResponseFormatter.format(field, openHours, closedDates);
  }

  async replaceConfig(
    accountId: bigint,
    fieldId: bigint,
    input: FieldScheduleConfigUpsertType,
  ): Promise<FieldScheduleConfigType> {
    const field = await this.repo.findFieldInAccount(accountId, fieldId);
    if (!field) {
      throw new NotFoundError('Field not found');
    }

    await this.repo.replaceConfigForField(fieldId, {
      scheduleEnabled: input.scheduleEnabled,
      gameLengthMinutes: input.gameLengthMinutes ?? null,
      bufferMinutes: input.bufferMinutes,
      openHours: input.openHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTimeLocal: h.startTimeLocal,
        endTimeLocal: h.endTimeLocal,
      })),
      closedDates: input.closedDates.map((d) => ({
        date: d.date,
        note: d.note ?? null,
      })),
    });

    const reloadedField = await this.repo.findFieldInAccount(accountId, fieldId);
    const { openHours, closedDates } = await this.repo.getConfigForField(fieldId);
    return FieldScheduleConfigResponseFormatter.format(reloadedField!, openHours, closedDates);
  }
}
