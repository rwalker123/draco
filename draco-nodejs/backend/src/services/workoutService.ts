import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
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
  ConflictError,
} from '../utils/customErrors.js';
import {
  dbWorkoutCreateData,
  dbWorkoutRegistration,
  dbWorkoutRegistrationUpsertData,
  dbWorkoutUpdateData,
  dbWorkoutWithField,
} from '../repositories/index.js';
import { WorkoutRegistrationEmailService } from './workoutRegistrationEmailService.js';
import { BCRYPT_CONSTANTS } from '../config/playerClassifiedConstants.js';
import { WorkoutRegistrantAccessEmailService } from './workoutRegistrantAccessEmailService.js';
import { DiscordIntegrationService } from './discordIntegrationService.js';
import { TwitterIntegrationService } from './twitterIntegrationService.js';
import { BlueskyIntegrationService } from './blueskyIntegrationService.js';

export class WorkoutService {
  private readonly workoutRepository = RepositoryFactory.getWorkoutRepository();
  private readonly accountRepository = RepositoryFactory.getAccountRepository();
  private readonly workoutEmailService = new WorkoutRegistrationEmailService();
  private readonly registrantAccessEmailService = new WorkoutRegistrantAccessEmailService();
  private readonly discordIntegrationService = new DiscordIntegrationService();
  private readonly twitterIntegrationService = new TwitterIntegrationService();
  private readonly blueskyIntegrationService = new BlueskyIntegrationService();

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

    void this.syncWorkoutToSocial(accountId, workout);

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
    const workout = await this.ensureWorkoutExists(accountId, workoutId);
    const account = await this.accountRepository.findById(accountId);

    await this.assertRegistrationEmailIsUnique(accountId, workoutId, payload.email);

    const accessCode = randomUUID();
    const hashedAccessCode = await bcrypt.hash(
      accessCode,
      BCRYPT_CONSTANTS.ACCESS_CODE_SALT_ROUNDS,
    );

    const data = this.mapRegistrationData(payload, hashedAccessCode);
    const registration = await this.createRegistrationOrThrowConflict(workoutId, data);

    await this.registrantAccessEmailService.sendAccessEmail({
      accountId,
      accountName: account?.name ?? 'Your account',
      workoutId,
      registrationId: registration.id,
      accessCode,
      recipient: { name: payload.name, email: payload.email },
      workoutDesc: workout.workoutdesc,
      workoutDate: workout.workoutdate,
    });

    return WorkoutResponseFormatter.formatRegistration(registration);
  }

  async verifyRegistrationAccess(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
    accessCode: string,
  ): Promise<WorkoutRegistrationType> {
    const registration = await this.workoutRepository.findRegistration(
      accountId,
      workoutId,
      registrationId,
    );

    if (!registration) {
      throw new WorkoutRegistrationNotFoundError(registrationId.toString());
    }

    const isValid = await bcrypt.compare(accessCode, registration.accesscode ?? '');
    if (!isValid) {
      throw new WorkoutUnauthorizedError('Invalid access code');
    }

    return WorkoutResponseFormatter.formatRegistration(registration);
  }

  async findRegistrationByAccessCode(
    accountId: bigint,
    workoutId: bigint,
    accessCode: string,
  ): Promise<WorkoutRegistrationType> {
    const registrations = await this.workoutRepository.findRegistrationsForWorkout(
      accountId,
      workoutId,
    );

    for (const registration of registrations) {
      const isValid = await bcrypt.compare(accessCode, registration.accesscode ?? '');
      if (isValid) {
        return WorkoutResponseFormatter.formatRegistration(registration);
      }
    }

    throw new WorkoutRegistrationNotFoundError('No registration matches this access code');
  }

  async updateRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
    payload: UpsertWorkoutRegistrationType,
    accessCode = '',
  ): Promise<WorkoutRegistrationType> {
    const existing = await this.workoutRepository.findRegistration(
      accountId,
      workoutId,
      registrationId,
    );

    if (!existing) {
      throw new WorkoutRegistrationNotFoundError(registrationId.toString());
    }

    if (accessCode && accessCode.trim()) {
      const isValid = await bcrypt.compare(accessCode, existing.accesscode ?? '');
      if (!isValid) {
        throw new WorkoutUnauthorizedError('Invalid access code');
      }
    }

    await this.assertRegistrationEmailIsUnique(accountId, workoutId, payload.email, registrationId);

    const data = this.mapRegistrationData(payload);
    const registration = await this.updateRegistrationOrThrowConflict(registrationId, data);

    return WorkoutResponseFormatter.formatRegistration(registration);
  }

  async deleteRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
    accessCode = '',
  ): Promise<void> {
    if (accessCode && accessCode.trim()) {
      const registration = await this.workoutRepository.findRegistration(
        accountId,
        workoutId,
        registrationId,
      );

      if (!registration) {
        throw new WorkoutRegistrationNotFoundError(registrationId.toString());
      }

      const isValid = await bcrypt.compare(accessCode, registration.accesscode ?? '');
      if (!isValid) {
        throw new WorkoutUnauthorizedError('Invalid access code');
      }
    }

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

  private async ensureWorkoutExists(accountId: bigint, workoutId: bigint) {
    const workout = await this.workoutRepository.findWorkout(accountId, workoutId);

    if (!workout) {
      throw new WorkoutNotFoundError(workoutId.toString());
    }

    return workout;
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
    hashedAccessCode?: string,
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
      ...(hashedAccessCode ? { accesscode: hashedAccessCode } : {}),
    };
  }

  private async assertRegistrationEmailIsUnique(
    accountId: bigint,
    workoutId: bigint,
    email: string,
    registrationIdToExclude?: bigint,
  ): Promise<void> {
    const normalizedEmail = email.trim();

    const existing = await this.workoutRepository.findRegistrationByEmail(
      accountId,
      workoutId,
      normalizedEmail,
    );

    if (existing && existing.id !== registrationIdToExclude) {
      throw this.registrationConflictError();
    }
  }

  private async createRegistrationOrThrowConflict(
    workoutId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration> {
    try {
      return await this.workoutRepository.createRegistration(workoutId, data);
    } catch (error) {
      this.handleRegistrationWriteError(error);
      throw error;
    }
  }

  private async updateRegistrationOrThrowConflict(
    registrationId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration> {
    try {
      return await this.workoutRepository.updateRegistration(registrationId, data);
    } catch (error) {
      this.handleRegistrationWriteError(error);
      throw error;
    }
  }

  private handleRegistrationWriteError(error: unknown): never {
    if (this.isPrismaUniqueConstraintError(error)) {
      throw this.registrationConflictError();
    }

    throw error;
  }

  private isPrismaUniqueConstraintError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }

  private registrationConflictError(): ConflictError {
    return new ConflictError('A registration for this workout already exists with this email.');
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

  private getBaseUrl(): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private buildWorkoutUrl(accountId: bigint, workoutId: bigint): string {
    return `${this.getBaseUrl()}/account/${accountId.toString()}/workouts/${workoutId.toString()}`;
  }

  private async syncWorkoutToSocial(accountId: bigint, workout: dbWorkoutWithField): Promise<void> {
    try {
      const account = await this.accountRepository.findById(accountId);
      const payload = {
        workoutId: workout.id,
        workoutDesc: workout.workoutdesc,
        workoutDate: workout.workoutdate,
        workoutUrl: this.buildWorkoutUrl(accountId, workout.id),
        accountName: account?.name ?? null,
      } as const;

      const results = await Promise.allSettled([
        this.discordIntegrationService.publishWorkoutAnnouncement(accountId, payload),
        this.twitterIntegrationService.publishWorkout(accountId, payload),
        this.blueskyIntegrationService.publishWorkout(accountId, payload),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const target = ['discord', 'twitter', 'bluesky'][index] ?? 'social';
          console.error(`[${target}] Failed to publish workout`, {
            accountId: accountId.toString(),
            workoutId: workout.id.toString(),
            error: result.reason,
          });
        }
      });
    } catch (error) {
      console.error('[social] Failed to sync workout announcement', {
        accountId: accountId.toString(),
        workoutId: workout.id.toString(),
        error,
      });
    }
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
