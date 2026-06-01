import type {
  PrismaClient,
  availablefields,
  fieldopenhours,
  fieldcloseddates,
} from '#prisma/client';
import type { IFieldScheduleConfigRepository } from '../interfaces/IFieldScheduleConfigRepository.js';

export class PrismaFieldScheduleConfigRepository implements IFieldScheduleConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findFieldInAccount(accountId: bigint, fieldId: bigint): Promise<availablefields | null> {
    return this.prisma.availablefields.findFirst({
      where: { id: fieldId, accountid: accountId },
    });
  }

  async getConfigForField(
    fieldId: bigint,
  ): Promise<{ openHours: fieldopenhours[]; closedDates: fieldcloseddates[] }> {
    const [openHours, closedDates] = await Promise.all([
      this.prisma.fieldopenhours.findMany({
        where: { fieldid: fieldId },
        orderBy: { dayofweek: 'asc' },
      }),
      this.prisma.fieldcloseddates.findMany({
        where: { fieldid: fieldId },
        orderBy: { closeddate: 'asc' },
      }),
    ]);

    return { openHours, closedDates };
  }

  async getConfigsForAccount(
    accountId: bigint,
  ): Promise<
    { field: availablefields; openHours: fieldopenhours[]; closedDates: fieldcloseddates[] }[]
  > {
    const [fields, openHours, closedDates] = await Promise.all([
      this.prisma.availablefields.findMany({
        where: { accountid: accountId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.fieldopenhours.findMany({
        where: { availablefields: { accountid: accountId } },
        orderBy: { dayofweek: 'asc' },
      }),
      this.prisma.fieldcloseddates.findMany({
        where: { availablefields: { accountid: accountId } },
        orderBy: { closeddate: 'asc' },
      }),
    ]);

    const openHoursByField = new Map<bigint, fieldopenhours[]>();
    for (const row of openHours) {
      const list = openHoursByField.get(row.fieldid) ?? [];
      list.push(row);
      openHoursByField.set(row.fieldid, list);
    }

    const closedDatesByField = new Map<bigint, fieldcloseddates[]>();
    for (const row of closedDates) {
      const list = closedDatesByField.get(row.fieldid) ?? [];
      list.push(row);
      closedDatesByField.set(row.fieldid, list);
    }

    return fields.map((field) => ({
      field,
      openHours: openHoursByField.get(field.id) ?? [],
      closedDates: closedDatesByField.get(field.id) ?? [],
    }));
  }

  async replaceConfigForField(
    fieldId: bigint,
    input: {
      scheduleEnabled: boolean;
      gameLengthMinutes: number | null;
      bufferMinutes: number;
      openHours: { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }[];
      closedDates: { date: string; endDate: string | null; note: string | null }[];
    },
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.availablefields.update({
        where: { id: fieldId },
        data: {
          scheduleenabled: input.scheduleEnabled,
          gamelengthminutes: input.gameLengthMinutes,
          bufferminutes: input.bufferMinutes,
        },
      }),
      this.prisma.fieldopenhours.deleteMany({ where: { fieldid: fieldId } }),
      this.prisma.fieldcloseddates.deleteMany({ where: { fieldid: fieldId } }),
      this.prisma.fieldopenhours.createMany({
        data: input.openHours.map((h) => ({
          fieldid: fieldId,
          dayofweek: h.dayOfWeek,
          starttimelocal: h.startTimeLocal,
          endtimelocal: h.endTimeLocal,
        })),
      }),
      this.prisma.fieldcloseddates.createMany({
        data: input.closedDates.map((d) => ({
          fieldid: fieldId,
          closeddate: new Date(d.date),
          enddate: d.endDate ? new Date(d.endDate) : null,
          note: d.note,
        })),
      }),
    ]);
  }

  async listOpenHoursForAccount(accountId: bigint): Promise<fieldopenhours[]> {
    return this.prisma.fieldopenhours.findMany({
      where: { availablefields: { accountid: accountId } },
    });
  }

  async listClosedDatesForAccount(accountId: bigint): Promise<fieldcloseddates[]> {
    return this.prisma.fieldcloseddates.findMany({
      where: { availablefields: { accountid: accountId } },
    });
  }
}
