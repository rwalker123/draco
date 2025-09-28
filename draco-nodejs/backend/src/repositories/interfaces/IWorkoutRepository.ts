import { Prisma, workoutannouncement, workoutregistration } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import type {
  dbWorkoutWithField,
  dbWorkoutWithRegistrationCount,
  dbWorkoutRegistration,
} from '../types/dbTypes.js';
import type {
  dbWorkoutCreateData,
  dbWorkoutUpdateData,
  dbWorkoutRegistrationUpsertData,
} from '../types/dbTypes.js';

export type WorkoutListOptions = {
  status?: 'upcoming' | 'past' | 'all';
  after?: Date;
  before?: Date;
  limit: number;
  includeRegistrationCounts?: boolean;
};

export interface IWorkoutRepository
  extends IBaseRepository<
    workoutannouncement,
    Prisma.workoutannouncementUncheckedCreateInput,
    Prisma.workoutannouncementUncheckedUpdateInput
  > {
  listWorkouts(
    accountId: bigint,
    options: WorkoutListOptions,
  ): Promise<Array<dbWorkoutWithField | dbWorkoutWithRegistrationCount>>;
  findWorkout(accountId: bigint, workoutId: bigint): Promise<dbWorkoutWithField | null>;
  createWorkout(accountId: bigint, data: dbWorkoutCreateData): Promise<dbWorkoutWithField>;
  updateWorkout(
    accountId: bigint,
    workoutId: bigint,
    data: dbWorkoutUpdateData,
  ): Promise<dbWorkoutWithField>;
  deleteWorkout(accountId: bigint, workoutId: bigint): Promise<number>;
  listRegistrations(
    accountId: bigint,
    workoutId: bigint,
    limit: number,
  ): Promise<dbWorkoutRegistration[]>;
  findRegistration(
    accountId: bigint,
    workoutId: bigint,
    registrationId: bigint,
  ): Promise<workoutregistration | null>;
  createRegistration(
    workoutId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration>;
  updateRegistration(
    registrationId: bigint,
    data: dbWorkoutRegistrationUpsertData,
  ): Promise<dbWorkoutRegistration>;
  deleteRegistration(accountId: bigint, workoutId: bigint, registrationId: bigint): Promise<number>;
}
