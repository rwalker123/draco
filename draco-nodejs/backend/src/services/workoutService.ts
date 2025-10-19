import {
  UpsertWorkoutType,
  WorkoutType,
  WorkoutListQueryType,
  UpsertWorkoutRegistrationType,
  WorkoutRegistrationType,
  WorkoutRegistrationsType,
  WorkoutSourcesType,
  WorkoutSourceOptionType,
  WORKOUT_DEFAULT_LIST_LIMIT,
  WORKOUT_REGISTRATIONS_DEFAULT_LIMIT,
  WORKOUT_REGISTRATIONS_MAX_EXPORT,
  WORKOUT_SOURCE_OPTION_MAX_LENGTH,
  WorkoutSummaryType,
  WorkoutRegistrationsEmailRequestType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { WorkoutListOptions } from '../repositories/interfaces/IWorkoutRepository.js';
import { WorkoutResponseFormatter } from '../responseFormatters/WorkoutResponseFormatter.js';
import { createStorageService } from './storageService.js';
import {
  WorkoutNotFoundError,
  WorkoutRegistrationNotFoundError,
  WorkoutUnauthorizedError,
} from '../utils/customErrors.js';
import {
  dbWorkoutCreateData,
  dbWorkoutRegistrationUpsertData,
  dbWorkoutUpdateData,
} from '../repositories/index.js';
import { WorkoutRegistrationEmailService } from './workoutRegistrationEmailService.js';

export class WorkoutService {
  private readonly workoutRepository = RepositoryFactory.getWorkoutRepository();
  private readonly workoutEmailService = new WorkoutRegistrationEmailService();

  async listWorkouts(
    accountId: bigint,
    query: WorkoutListQueryType,
  ): Promise<WorkoutSummaryType[]> {
    const limit = query.limit ?? WORKOUT_DEFAULT_LIST_LIMIT;

    const filters: WorkoutListOptions = {
      status: query.status,
      after: query.after ? new Date(query.after) : undefined,
      before: query.before ? new Date(query.before) : undefined,
      limit,
      includeRegistrationCounts: query.includeRegistrationCounts ?? false,
    };

    const workouts = await this.workoutRepository.listWorkouts(accountId, filters);

    return WorkoutResponseFormatter.formatWorkouts(workouts);
  }

  async getWorkout(accountId: bigint, workoutId: bigint): Promise<WorkoutType> {
    const workout = await this.workoutRepository.findWorkout(accountId, workoutId);

    if (!workout) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }

    return WorkoutResponseFormatter.formatWorkout(workout);
  }

  async createWorkout(accountId: bigint, payload: UpsertWorkoutType): Promise<WorkoutType> {
    const createData = this.mapWorkoutCreateData(payload);
    const workout = await this.workoutRepository.createWorkout(accountId, createData);

    return WorkoutResponseFormatter.formatWorkout(workout);
  }

  async updateWorkout(
    accountId: bigint,
    workoutId: bigint,
    payload: UpsertWorkoutType,
  ): Promise<WorkoutType> {
    const existing = await this.workoutRepository.findWorkout(accountId, workoutId);

    if (!existing) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }

    const updateData = this.mapWorkoutUpdateData(payload);

    if (Object.keys(updateData).length === 0) {
      return WorkoutResponseFormatter.formatWorkout(existing);
    }

    const workout = await this.workoutRepository.updateWorkout(accountId, workoutId, updateData);

    return WorkoutResponseFormatter.formatWorkout(workout);
  }

  async deleteWorkout(accountId: bigint, workoutId: bigint): Promise<void> {
    const deleted = await this.workoutRepository.deleteWorkout(accountId, workoutId);

    if (deleted === 0) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }
  }

  async listRegistrations(
    accountId: bigint,
    workoutId: bigint,
    limit = WORKOUT_REGISTRATIONS_DEFAULT_LIMIT,
  ): Promise<WorkoutRegistrationsType> {
    const boundedLimit = Math.min(Math.max(limit, 1), WORKOUT_REGISTRATIONS_MAX_EXPORT);
    const registrations = await this.workoutRepository.listRegistrations(
      accountId,
      workoutId,
      boundedLimit,
    );

    return WorkoutResponseFormatter.formatRegistrations(registrations);
  }

  async createRegistration(
    accountId: bigint,
    workoutId: bigint,
    payload: UpsertWorkoutRegistrationType,
  ): Promise<WorkoutRegistrationType> {
    await this.ensureWorkoutExists(accountId, workoutId);

    const data = this.mapRegistrationData(payload);
    const registration = await this.workoutRepository.createRegistration(workoutId, data);

    return WorkoutResponseFormatter.formatRegistration(registration);
  }

  async updateRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
    payload: UpsertWorkoutRegistrationType,
  ): Promise<WorkoutRegistrationType> {
    const existing = await this.workoutRepository.findRegistration(
      accountId,
      workoutId,
      registrationId,
    );

    if (!existing) {
      throw new WorkoutRegistrationNotFoundError(registrationId.toString());
    }

    const data = this.mapRegistrationData(payload);
    const registration = await this.workoutRepository.updateRegistration(registrationId, data);

    return WorkoutResponseFormatter.formatRegistration(registration);
  }

  async deleteRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
  ): Promise<void> {
    const deleted = await this.workoutRepository.deleteRegistration(
      accountId,
      workoutId,
      registrationId,
    );

    if (deleted === 0) {
      throw new WorkoutUnauthorizedError('Registration not found or unauthorized access');
    }
  }

  async getSources(accountId: string): Promise<WorkoutSourcesType> {
    const storage = createStorageService();
    const buffer = await storage.getAttachment(accountId, 'config', 'workout-sources.json');

    if (!buffer) {
      return { options: [] };
    }

    try {
      const parsed = JSON.parse(buffer.toString('utf-8')) as WorkoutSourcesType;

      if (!Array.isArray(parsed.options)) {
        return { options: [] };
      }

      return {
        options: parsed.options
          .filter((option) => typeof option === 'string')
          .map((option) => option.trim())
          .filter(
            (option) => option.length > 0 && option.length <= WORKOUT_SOURCE_OPTION_MAX_LENGTH,
          ),
      };
    } catch {
      return { options: [] };
    }
  }

  async putSources(accountId: string, sources: WorkoutSourcesType): Promise<WorkoutSourcesType> {
    const sanitized = this.sanitizeSources(sources);
    const storage = createStorageService();
    const payload = Buffer.from(JSON.stringify(sanitized, null, 2));

    await storage.saveAttachment(accountId, 'config', 'workout-sources.json', payload);

    return sanitized;
  }

  async appendSourceOption(
    accountId: string,
    option: WorkoutSourceOptionType,
  ): Promise<WorkoutSourcesType> {
    const trimmed = option.trim();

    if (!trimmed || trimmed.length > WORKOUT_SOURCE_OPTION_MAX_LENGTH) {
      return this.getSources(accountId);
    }

    const current = await this.getSources(accountId);

    if (!current.options.includes(trimmed)) {
      const updated = [...current.options, trimmed];
      return this.putSources(accountId, { options: updated });
    }

    return current;
  }

  private sanitizeSources(sources: WorkoutSourcesType): WorkoutSourcesType {
    const cleaned = (sources.options ?? [])
      .map((option) => option?.toString().trim() ?? '')
      .filter((option) => option.length > 0 && option.length <= WORKOUT_SOURCE_OPTION_MAX_LENGTH);

    return { options: Array.from(new Set(cleaned)) };
  }

  private async ensureWorkoutExists(accountId: bigint, workoutId: bigint): Promise<void> {
    const workout = await this.workoutRepository.findWorkout(accountId, workoutId);

    if (!workout) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }
  }

  private mapWorkoutCreateData(payload: UpsertWorkoutType): dbWorkoutCreateData {
    return {
      workoutdesc: payload.workoutDesc.trim(),
      workoutdate: new Date(payload.workoutDate),
      fieldid: this.parseFieldId(payload.fieldId),
      comments: payload.comments?.trim() ?? '',
    };
  }

  private mapWorkoutUpdateData(payload: UpsertWorkoutType): dbWorkoutUpdateData {
    const update: dbWorkoutUpdateData = {};

    if (payload.workoutDesc !== undefined) {
      update.workoutdesc = payload.workoutDesc.trim();
    }

    if (payload.workoutDate !== undefined) {
      update.workoutdate = new Date(payload.workoutDate);
    }

    if (payload.fieldId !== undefined) {
      update.fieldid = this.parseFieldId(payload.fieldId);
    }

    if (payload.comments !== undefined) {
      update.comments = payload.comments?.trim() ?? '';
    }

    return update;
  }

  private mapRegistrationData(
    payload: UpsertWorkoutRegistrationType,
  ): dbWorkoutRegistrationUpsertData {
    const normalize = (value?: string | null) => (value ? value.trim() : undefined);

    return {
      name: payload.name.trim(),
      email: payload.email.trim(),
      age: payload.age,
      phone1: normalize(payload.phone1) ?? '',
      phone2: normalize(payload.phone2) ?? '',
      phone3: normalize(payload.phone3) ?? '',
      phone4: normalize(payload.phone4) ?? '',
      positions: payload.positions.trim(),
      ismanager: payload.isManager,
      whereheard: payload.whereHeard.trim(),
    };
  }

  private parseFieldId(fieldId: string | null | undefined): bigint | null {
    if (fieldId === undefined || fieldId === null) {
      return null;
    }

    const trimmed = fieldId.trim();

    if (!trimmed) {
      return null;
    }

    return BigInt(trimmed);
  }

  async emailRegistrants(
    accountId: bigint,
    workoutId: bigint,
    payload: WorkoutRegistrationsEmailRequestType,
  ): Promise<void> {
    const workout = await this.workoutRepository.findWorkout(accountId, workoutId);

    if (!workout) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }

    const registrations = await this.workoutRepository.listRegistrations(
      accountId,
      workoutId,
      WORKOUT_REGISTRATIONS_MAX_EXPORT,
    );

    let targetedRegistrations = registrations;

    if (payload.registrationIds && payload.registrationIds.length > 0) {
      const idSet = new Set(payload.registrationIds.map((id) => id.trim()));
      targetedRegistrations = registrations.filter((registration) =>
        idSet.has(registration.id.toString()),
      );
    }

    if (targetedRegistrations.length === 0) {
      throw new WorkoutRegistrationNotFoundError('No matching registrations found for email');
    }

    await this.workoutEmailService.sendEmails({
      accountId,
      workoutDescription: workout.workoutdesc,
      workoutDate: workout.workoutdate,
      subject: payload.subject,
      bodyHtml: payload.body,
      recipients: targetedRegistrations.map((registration) => ({
        name: registration.name,
        email: registration.email,
      })),
    });
  }
}
