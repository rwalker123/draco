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
} from '../interfaces/workoutInterfaces.js';
import { createStorageService } from './storageService.js';
import { mapWorkoutField, FIELD_INCLUDE, WORKOUT_CONSTANTS } from '../utils/workoutMappers.js';
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
    const workoutsWithCounts = rows.map((r) => {
      const workout: {
        id: string;
        workoutDesc: string;
        workoutDate: string;
        fieldId: string | null;
        field: { id: string; name: string; address: string } | null;
        registrationCount?: number;
      } = {
        id: r.id.toString(),
        workoutDesc: r.workoutdesc,
        workoutDate: r.workoutdate.toISOString(),
        fieldId: r.fieldid ? r.fieldid.toString() : null,
        field: mapWorkoutField(r.availablefields),
      };

      if (includeRegistrationCounts && '_count' in r) {
        workout.registrationCount = (
          r as { _count: { workoutregistration: number } }
        )._count.workoutregistration;
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
    return {
      id: row.id.toString(),
      accountId: row.accountid.toString(),
      workoutDesc: row.workoutdesc,
      workoutDate: row.workoutdate.toISOString(),
      fieldId: row.fieldid ? row.fieldid.toString() : null,
      field: mapWorkoutField(row.availablefields),
      comments: row.comments,
    };
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
    });
    return {
      id: created.id.toString(),
      accountId: created.accountid.toString(),
      workoutDesc: created.workoutdesc,
      workoutDate: created.workoutdate.toISOString(),
      fieldId: created.fieldid ? created.fieldid.toString() : null,
      comments: created.comments,
    };
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
    });
    return {
      id: updated.id.toString(),
      accountId: updated.accountid.toString(),
      workoutDesc: updated.workoutdesc,
      workoutDate: updated.workoutdate.toISOString(),
      fieldId: updated.fieldid ? updated.fieldid.toString() : null,
      comments: updated.comments,
    };
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
      items: rows.map((r) => ({
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
        dateRegistered: r.dateregistered.toISOString(),
      })),
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
    return {
      id: created.id.toString(),
      workoutId: created.workoutid.toString(),
      name: created.name,
      email: created.email,
      age: created.age,
      phone1: created.phone1 ?? '',
      phone2: created.phone2 ?? '',
      phone3: created.phone3 ?? '',
      phone4: created.phone4 ?? '',
      positions: created.positions,
      isManager: created.ismanager,
      whereHeard: created.whereheard,
      dateRegistered: created.dateregistered.toISOString(),
    };
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
    return {
      id: updated.id.toString(),
      workoutId: updated.workoutid.toString(),
      name: updated.name,
      email: updated.email,
      age: updated.age,
      phone1: updated.phone1 ?? '',
      phone2: updated.phone2 ?? '',
      phone3: updated.phone3 ?? '',
      phone4: updated.phone4 ?? '',
      positions: updated.positions,
      isManager: updated.ismanager,
      whereHeard: updated.whereheard,
      dateRegistered: updated.dateregistered.toISOString(),
    };
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
}
