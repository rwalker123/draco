import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import {
  Workout,
  WorkoutCreateDTO,
  WorkoutUpdateDTO,
  WorkoutSummary,
  WorkoutRegistrationDTO,
  WorkoutRegistration,
  ListWorkoutsFilter,
  Paginated,
  WorkoutSources,
  PrismaWorkoutWithField,
  PrismaWorkoutWithCount,
  PrismaWorkoutRegistration,
} from '../interfaces/workoutInterfaces.js';
import { createStorageService } from './storageService.js';
import { mapWorkoutField, FIELD_INCLUDE, WORKOUT_CONSTANTS } from '../utils/workoutMappers.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  WorkoutRegistrationNotFoundError,
  WorkoutUnauthorizedError,
} from '../utils/customErrors.js';

export class WorkoutService {
  async listWorkouts(
    accountId: bigint,
    filter: ListWorkoutsFilter = {},
    includeRegistrationCounts = false,
  ): Promise<WorkoutSummary[]> {
    const where: Prisma.workoutannouncementWhereInput = { accountid: accountId };

    // Build workoutdate filter
    const workoutdateFilter: Prisma.DateTimeFilter = {};
    if (filter.status === 'upcoming') {
      workoutdateFilter.gte = new Date();
    } else if (filter.status === 'past') {
      workoutdateFilter.lt = new Date();
    }
    if (filter.after) {
      workoutdateFilter.gt = new Date(filter.after);
    }
    if (filter.before) {
      workoutdateFilter.lt = new Date(filter.before);
    }

    // Only set workoutdate if we have filters
    if (Object.keys(workoutdateFilter).length > 0) {
      where.workoutdate = workoutdateFilter;
    }

    // Include registration count if requested using Prisma's _count
    const rows = await prisma.workoutannouncement.findMany({
      where,
      orderBy: { workoutdate: 'asc' },
      take: filter.limit ?? WORKOUT_CONSTANTS.DEFAULT_WORKOUTS_LIMIT,
      select: {
        id: true,
        workoutdesc: true,
        workoutdate: true,
        fieldid: true,
        ...FIELD_INCLUDE,
        // Efficiently get registration count in the same query
        ...(includeRegistrationCounts && {
          _count: {
            select: { workoutregistration: true },
          },
        }),
      },
    });

    // Map the results with registration counts if included
    const workoutsWithCounts = rows.map((r: PrismaWorkoutWithField | PrismaWorkoutWithCount) => {
      const workout: WorkoutSummary = {
        id: r.id.toString(),
        workoutDesc: r.workoutdesc,
        workoutDate: DateUtils.formatDateTimeForResponse(r.workoutdate) || '',
        fieldId: r.fieldid ? r.fieldid.toString() : null,
        field: mapWorkoutField(r.availablefields),
      };

      if (includeRegistrationCounts && '_count' in r) {
        const workoutWithCount = r as PrismaWorkoutWithCount;
        workout.registrationCount = workoutWithCount._count.workoutregistration;
      }

      return workout;
    });

    return workoutsWithCounts;
  }

  async getWorkout(accountId: bigint, workoutId: bigint): Promise<Workout | null> {
    const row = await prisma.workoutannouncement.findFirst({
      where: { id: workoutId, accountid: accountId },
      include: FIELD_INCLUDE,
    });
    if (!row) return null;

    return this.mapPrismaWorkoutToWorkout(row);
  }

  async createWorkout(accountId: bigint, dto: WorkoutCreateDTO): Promise<Workout> {
    const created = await prisma.workoutannouncement.create({
      data: {
        accountid: accountId,
        workoutdesc: dto.workoutDesc,
        workoutdate: new Date(dto.workoutDate),
        fieldid: dto.fieldId ? BigInt(dto.fieldId) : null,
        comments: dto.comments ?? '',
      },
      include: FIELD_INCLUDE,
    });

    return this.mapPrismaWorkoutToWorkout(created);
  }

  async updateWorkout(
    accountId: bigint,
    workoutId: bigint,
    dto: WorkoutUpdateDTO,
  ): Promise<Workout> {
    const updated = await prisma.workoutannouncement.update({
      where: { id: workoutId },
      data: {
        ...(dto.workoutDesc !== undefined && { workoutdesc: dto.workoutDesc }),
        ...(dto.workoutDate !== undefined && { workoutdate: new Date(dto.workoutDate) }),
        ...(dto.fieldId !== undefined && { fieldid: dto.fieldId ? BigInt(dto.fieldId) : null }),
        ...(dto.comments !== undefined && { comments: dto.comments ?? '' }),
      },
      include: FIELD_INCLUDE,
    });

    return this.mapPrismaWorkoutToWorkout(updated);
  }

  async deleteWorkout(accountId: bigint, workoutId: bigint): Promise<void> {
    // Ensure account boundary is enforced
    await prisma.workoutannouncement.delete({
      where: {
        id: workoutId,
        accountid: accountId,
      },
    });
  }

  async getWorkoutRegistrationCount(accountId: bigint, workoutId: bigint): Promise<number> {
    const count = await prisma.workoutregistration.count({
      where: {
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
    });
    return count;
  }

  async listRegistrations(
    accountId: bigint,
    workoutId: bigint,
    limit: number = WORKOUT_CONSTANTS.DEFAULT_REGISTRATIONS_LIMIT,
  ): Promise<Paginated<WorkoutRegistration>> {
    const rows = await prisma.workoutregistration.findMany({
      where: { workoutid: workoutId, workoutannouncement: { accountid: accountId } },
      orderBy: { id: 'desc' },
      take: limit,
    });

    return {
      items: rows.map(
        (r: PrismaWorkoutRegistration): WorkoutRegistration => ({
          id: r.id.toString(),
          workoutId: r.workoutid.toString(),
          name: r.name,
          email: r.email,
          age: r.age,
          phone1: r.phone1 ?? '',
          phone2: r.phone2 ?? '',
          phone3: r.phone3 ?? '',
          phone4: r.phone4 ?? '',
          positions: r.positions,
          isManager: r.ismanager,
          whereHeard: r.whereheard,
          dateRegistered: DateUtils.formatDateTimeForResponse(r.dateregistered) || '',
        }),
      ),
    };
  }

  async createRegistration(
    accountId: bigint,
    workoutId: bigint,
    dto: WorkoutRegistrationDTO,
  ): Promise<WorkoutRegistration> {
    const created = await prisma.workoutregistration.create({
      data: {
        workoutid: workoutId,
        name: dto.name,
        email: dto.email,
        age: dto.age,
        phone1: dto.phone1 ?? '',
        phone2: dto.phone2 ?? '',
        phone3: dto.phone3 ?? '',
        phone4: dto.phone4 ?? '',
        positions: dto.positions,
        ismanager: dto.isManager,
        dateregistered: new Date(),
        whereheard: dto.whereHeard,
      },
    });

    return this.mapPrismaRegistrationToWorkoutRegistration(created);
  }

  async updateRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
    dto: WorkoutRegistrationDTO,
  ): Promise<WorkoutRegistration> {
    // Verify the registration belongs to the account
    const existing = await prisma.workoutregistration.findFirst({
      where: {
        id: registrationId,
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
    });
    if (!existing) {
      throw new WorkoutRegistrationNotFoundError(registrationId.toString());
    }

    const updated = await prisma.workoutregistration.update({
      where: { id: registrationId },
      data: {
        name: dto.name,
        email: dto.email,
        age: dto.age,
        phone1: dto.phone1 ?? '',
        phone2: dto.phone2 ?? '',
        phone3: dto.phone3 ?? '',
        phone4: dto.phone4 ?? '',
        positions: dto.positions,
        ismanager: dto.isManager,
        whereheard: dto.whereHeard,
      },
    });

    return this.mapPrismaRegistrationToWorkoutRegistration(updated);
  }

  async deleteRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
  ): Promise<void> {
    // Delete with account boundary check via the workout relationship
    const deleted = await prisma.workoutregistration.deleteMany({
      where: {
        id: registrationId,
        workoutid: workoutId,
        workoutannouncement: { accountid: accountId },
      },
    });

    if (deleted.count === 0) {
      throw new WorkoutUnauthorizedError('Registration not found or unauthorized access');
    }
  }

  private getSourcesKey(accountId: string): string {
    return `${accountId}/config/workout-sources.json`;
  }

  async getSources(accountId: string): Promise<WorkoutSources> {
    const storage = createStorageService();
    const buf = await storage.getAttachment(accountId, 'config', 'workout-sources.json');
    if (!buf) return { options: [] };
    try {
      const parsed = JSON.parse(buf.toString('utf-8')) as WorkoutSources;
      if (!Array.isArray(parsed.options)) return { options: [] };
      // Enforce max length constraint from DB schema
      return {
        options: parsed.options
          .filter((s) => typeof s === 'string')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length <= WORKOUT_CONSTANTS.MAX_SOURCE_OPTION_LENGTH),
      };
    } catch {
      return { options: [] };
    }
  }

  async putSources(accountId: string, sources: WorkoutSources): Promise<void> {
    const storage = createStorageService();
    const clean = Array.from(
      new Set(
        (sources.options || [])
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && s.length <= WORKOUT_CONSTANTS.MAX_SOURCE_OPTION_LENGTH),
      ),
    );
    const payload = Buffer.from(JSON.stringify({ options: clean }, null, 2));
    // Reuse attachment storage pathing to persist JSON deterministically under uploads
    // Use emailId as fixed token 'config' to produce stable directory layout
    await storage.saveAttachment(accountId, 'config', 'workout-sources.json', payload);
  }

  async appendSourceOption(accountId: string, option: string): Promise<WorkoutSources> {
    const current = await this.getSources(accountId);
    const trimmed = option.trim();
    if (!trimmed || trimmed.length > WORKOUT_CONSTANTS.MAX_SOURCE_OPTION_LENGTH) return current; // enforce max length and non-empty
    if (!current.options.includes(trimmed)) {
      current.options.push(trimmed);
      await this.putSources(accountId, current);
    }
    return current;
  }

  private mapPrismaRegistrationToWorkoutRegistration(
    prismaRegistration: PrismaWorkoutRegistration,
  ): WorkoutRegistration {
    return {
      id: prismaRegistration.id.toString(),
      workoutId: prismaRegistration.workoutid.toString(),
      name: prismaRegistration.name,
      email: prismaRegistration.email,
      age: prismaRegistration.age,
      phone1: prismaRegistration.phone1 ?? '',
      phone2: prismaRegistration.phone2 ?? '',
      phone3: prismaRegistration.phone3 ?? '',
      phone4: prismaRegistration.phone4 ?? '',
      positions: prismaRegistration.positions,
      isManager: prismaRegistration.ismanager,
      whereHeard: prismaRegistration.whereheard,
      dateRegistered: DateUtils.formatDateTimeForResponse(prismaRegistration.dateregistered) || '',
    };
  }

  private mapPrismaWorkoutToWorkout(
    prismaWorkout: Prisma.workoutannouncementGetPayload<{
      include: typeof FIELD_INCLUDE;
    }>,
  ): Workout {
    return {
      id: prismaWorkout.id.toString(),
      accountId: prismaWorkout.accountid.toString(),
      workoutDesc: prismaWorkout.workoutdesc,
      workoutDate: DateUtils.formatDateTimeForResponse(prismaWorkout.workoutdate) || '',
      fieldId: prismaWorkout.fieldid ? prismaWorkout.fieldid.toString() : null,
      field: mapWorkoutField(prismaWorkout.availablefields),
      comments: prismaWorkout.comments,
    };
  }
}
