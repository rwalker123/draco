import { Prisma, PrismaClient, workoutregistration } from '#prisma/client';
import { IWorkoutRepository, WorkoutListOptions } from '../interfaces/IWorkoutRepository.js';
import {
  dbWorkoutRegistration,
  dbWorkoutWithField,
  dbWorkoutWithRegistrationCount,
  dbWorkoutRegistrationUpsertData,
  dbWorkoutUpdateData,
  dbWorkoutRegistrationWithAccessCode,
  dbWorkoutCreateData,
} from '../types/dbTypes.js';

const REGISTRATION_SELECT = {
  id: true,
  workoutid: true,
  name: true,
  email: true,
  age: true,
  phone1: true,
  phone2: true,
  phone3: true,
  phone4: true,
  positions: true,
  ismanager: true,
  whereheard: true,
  dateregistered: true,
  accesscode: true,
} as const;

const FIELD_SELECT = {
  id: true,
  name: true,
  address: true,
} as const;

const FIELD_INCLUDE = {
  availablefields: {
    select: FIELD_SELECT,
  },
} as const;

const FIELD_INCLUDE_WITH_COUNT = {
  ...FIELD_INCLUDE,
  _count: {
    select: {
      workoutregistration: true,
    },
  },
} as const;

export class PrismaWorkoutRepository implements IWorkoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint) {
    return this.prisma.workoutannouncement.findUnique({ where: { id } });
  }

  async findMany(where?: Record<string, unknown>) {
    return this.prisma.workoutannouncement.findMany({
      where: where as Prisma.workoutannouncementWhereInput,
    });
  }

  async create(data: Prisma.workoutannouncementUncheckedCreateInput) {
    return this.prisma.workoutannouncement.create({ data });
  }

  async update(id: bigint, data: Prisma.workoutannouncementUncheckedUpdateInput) {
    return this.prisma.workoutannouncement.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return this.prisma.workoutannouncement.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>) {
    return this.prisma.workoutannouncement.count({
      where: where as Prisma.workoutannouncementWhereInput,
    });
  }

  async listWorkouts(
    accountId: bigint,
    options: WorkoutListOptions,
  ): Promise<Array<dbWorkoutWithField | dbWorkoutWithRegistrationCount>> {
    const where: Prisma.workoutannouncementWhereInput = {
      accountid: accountId,
    };

    const workoutDateFilter: Prisma.DateTimeFilter = {};

    if (options.status === 'upcoming') {
      workoutDateFilter.gte = new Date();
    } else if (options.status === 'past') {
      workoutDateFilter.lt = new Date();
    }

    if (options.after) {
      workoutDateFilter.gt = options.after;
    }

    if (options.before) {
      workoutDateFilter.lt = options.before;
    }

    if (Object.keys(workoutDateFilter).length > 0) {
      where.workoutdate = workoutDateFilter;
    }

    const include = options.includeRegistrationCounts ? FIELD_INCLUDE_WITH_COUNT : FIELD_INCLUDE;

    return this.prisma.workoutannouncement.findMany({
      where,
      orderBy: { workoutdate: 'asc' },
      take: options.limit,
      include,
    });
  }

  async findWorkout(accountId: bigint, workoutId: bigint): Promise<dbWorkoutWithField | null> {
    return this.prisma.workoutannouncement.findFirst({
      where: { id: workoutId, accountid: accountId },
      include: FIELD_INCLUDE,
    });
  }

  async createWorkout(accountId: bigint, data: dbWorkoutCreateData): Promise<dbWorkoutWithField> {
    return this.prisma.workoutannouncement.create({
      data: {
        accountid: accountId,
        ...data,
      },
      include: FIELD_INCLUDE,
    });
  }

  async updateWorkout(
    _accountId: bigint,
    workoutId: bigint,
    data: dbWorkoutUpdateData,
  ): Promise<dbWorkoutWithField> {
    return this.prisma.workoutannouncement.update({
      where: { id: workoutId },
      data,
      include: FIELD_INCLUDE,
    });
  }

  async deleteWorkout(accountId: bigint, workoutId: bigint): Promise<number> {
    const result = await this.prisma.workoutannouncement.deleteMany({
      where: { id: workoutId, accountid: accountId },
    });

    return result.count;
  }

  async listRegistrations(
    accountId: bigint,
    workoutId: bigint,
    limit: number,
  ): Promise<dbWorkoutRegistration[]> {
    return this.prisma.workoutregistration.findMany({
      where: {
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
      orderBy: { id: 'desc' },
      take: limit,
      select: REGISTRATION_SELECT,
    });
  }

  async findRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
  ): Promise<workoutregistration | null> {
    return this.prisma.workoutregistration.findFirst({
      where: {
        id: registrationId,
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
    });
  }

  async findRegistrationByEmail(
    accountId: bigint,
    workoutId: bigint,
    email: string,
  ): Promise<dbWorkoutRegistration | null> {
    return this.prisma.workoutregistration.findFirst({
      where: {
        workoutid: workoutId,
        email,
        workoutannouncement: { accountid: accountId },
      },
      select: REGISTRATION_SELECT,
    });
  }

  async createRegistration(
    workoutId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration> {
    return this.prisma.workoutregistration.create({
      data: {
        workoutid: workoutId,
        name: data.name,
        email: data.email,
        age: data.age,
        phone1: data.phone1 ?? '',
        phone2: data.phone2 ?? '',
        phone3: data.phone3 ?? '',
        phone4: data.phone4 ?? '',
        positions: data.positions,
        ismanager: data.ismanager,
        whereheard: data.whereheard,
        dateregistered: new Date(),
        accesscode: data.accesscode ?? '',
      },
      select: REGISTRATION_SELECT,
    });
  }

  async updateRegistration(
    registrationId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration> {
    return this.prisma.workoutregistration.update({
      where: { id: registrationId },
      data: {
        name: data.name,
        email: data.email,
        age: data.age,
        phone1: data.phone1 ?? '',
        phone2: data.phone2 ?? '',
        phone3: data.phone3 ?? '',
        phone4: data.phone4 ?? '',
        positions: data.positions,
        ismanager: data.ismanager,
        whereheard: data.whereheard,
        ...(data.accesscode ? { accesscode: data.accesscode } : {}),
      },
      select: REGISTRATION_SELECT,
    });
  }

  async deleteRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
  ): Promise<number> {
    const result = await this.prisma.workoutregistration.deleteMany({
      where: {
        id: registrationId,
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
    });

    return result.count;
  }

  async findRegistrationsForWorkout(
    accountId: bigint,
    workoutId: bigint,
  ): Promise<dbWorkoutRegistrationWithAccessCode[]> {
    return this.prisma.workoutregistration.findMany({
      where: {
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
      select: REGISTRATION_SELECT,
    });
  }
}
