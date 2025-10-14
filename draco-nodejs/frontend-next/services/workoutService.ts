import {
  appendWorkoutSourceOption as apiAppendWorkoutSourceOption,
  createAccountWorkout,
  createWorkoutRegistration as apiCreateWorkoutRegistration,
  deleteAccountWorkout,
  deleteWorkoutRegistration as apiDeleteWorkoutRegistration,
  getAccountWorkout,
  getWorkoutSources as apiGetWorkoutSources,
  listAccountWorkouts,
  listWorkoutRegistrations as apiListWorkoutRegistrations,
  updateAccountWorkout,
  updateWorkoutRegistration as apiUpdateWorkoutRegistration,
  updateWorkoutSources as apiUpdateWorkoutSources,
  type WorkoutSummary as ApiWorkoutSummary,
  type Workout as ApiWorkout,
} from '@draco/shared-api-client';
import type {
  UpsertWorkoutRegistrationType,
  UpsertWorkoutType,
  WorkoutRegistrationType,
  WorkoutSourcesType,
  WorkoutSummaryType,
  WorkoutType,
} from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';

import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';
import { mapApiFieldToFieldType } from '../utils/fieldMapper';

const mapWorkoutSummaryFromApi = (workout: ApiWorkoutSummary): WorkoutSummaryType => {
  const field = mapApiFieldToFieldType(workout.field);

  return {
    id: workout.id,
    workoutDesc: workout.workoutDesc,
    workoutDate: workout.workoutDate,
    ...(field !== undefined ? { field } : {}),
    ...(workout.registrationCount !== undefined
      ? { registrationCount: workout.registrationCount }
      : {}),
  };
};

const mapWorkoutFromApi = (workout: ApiWorkout): WorkoutType => {
  const summary = mapWorkoutSummaryFromApi(workout);

  return {
    ...summary,
    accountId: workout.accountId,
    comments: workout.comments,
  };
};

const normalizeFieldId = (fieldId?: string | null): string | null | undefined => {
  if (fieldId === undefined) {
    return undefined;
  }

  if (fieldId === null || fieldId === '') {
    return null;
  }

  return fieldId;
};

const toUpsertWorkoutPayload = (dto: UpsertWorkoutType): UpsertWorkoutType => {
  const { fieldId, ...rest } = dto;
  const normalizedFieldId = normalizeFieldId(fieldId);

  return (
    normalizedFieldId !== undefined ? { ...rest, fieldId: normalizedFieldId } : { ...rest }
  ) as UpsertWorkoutType;
};

const toUpsertWorkoutRegistrationPayload = (
  dto: UpsertWorkoutRegistrationType,
): UpsertWorkoutRegistrationType => {
  return { ...dto } as UpsertWorkoutRegistrationType;
};

const createClient = (token?: string | null) => createApiClient({ token: token ?? undefined });

export async function listWorkouts(
  accountId: string,
  includeRegistrationCounts = true,
  token?: string,
): Promise<WorkoutSummaryType[]> {
  const client = createClient(token);
  const query = includeRegistrationCounts ? { includeRegistrationCounts } : undefined;
  const result = await listAccountWorkouts({
    client,
    path: { accountId },
    query,
    throwOnError: false,
  });

  const workouts = unwrapApiResult(result, 'Failed to fetch workouts');
  return workouts.map(mapWorkoutSummaryFromApi);
}

export async function getWorkout(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<WorkoutType> {
  const client = createClient(token);
  const result = await getAccountWorkout({
    client,
    path: { accountId, workoutId },
    throwOnError: false,
  });

  const workout = unwrapApiResult(result, 'Failed to fetch workout');
  return mapWorkoutFromApi(workout);
}

export async function createWorkout(
  accountId: string,
  dto: UpsertWorkoutType,
  token?: string,
): Promise<WorkoutType> {
  const client = createClient(token);
  const payload = toUpsertWorkoutPayload(dto);
  const result = await createAccountWorkout({
    client,
    path: { accountId },
    body: payload,
    throwOnError: false,
  });

  const workout = unwrapApiResult(result, 'Failed to create workout');
  return mapWorkoutFromApi(workout);
}

export async function updateWorkout(
  accountId: string,
  workoutId: string,
  dto: UpsertWorkoutType,
  token?: string,
): Promise<WorkoutType> {
  const client = createClient(token);
  const payload = toUpsertWorkoutPayload(dto);
  const result = await updateAccountWorkout({
    client,
    path: { accountId, workoutId },
    body: payload,
    throwOnError: false,
  });

  const workout = unwrapApiResult(result, 'Failed to update workout');
  return mapWorkoutFromApi(workout);
}

export async function deleteWorkout(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<void> {
  const client = createClient(token);
  const result = await deleteAccountWorkout({
    client,
    path: { accountId, workoutId },
    throwOnError: false,
  });

  assertNoApiError(result, 'Failed to delete workout');
}

export async function listWorkoutRegistrations(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<WorkoutRegistrationType[]> {
  const client = createClient(token);
  const result = await apiListWorkoutRegistrations({
    client,
    path: { accountId, workoutId },
    throwOnError: false,
  });

  const data = unwrapApiResult(result, 'Failed to fetch registrations');
  return data.registrations ?? [];
}

export async function createWorkoutRegistration(
  accountId: string,
  workoutId: string,
  dto: UpsertWorkoutRegistrationType,
  token?: string,
): Promise<WorkoutRegistrationType> {
  const client = createClient(token);
  const payload = toUpsertWorkoutRegistrationPayload(dto);
  const result = await apiCreateWorkoutRegistration({
    client,
    path: { accountId, workoutId },
    body: payload,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to create registration');
}

export async function updateWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
  dto: UpsertWorkoutRegistrationType,
  token?: string,
): Promise<WorkoutRegistrationType> {
  const client = createClient(token);
  const payload = toUpsertWorkoutRegistrationPayload(dto);
  const result = await apiUpdateWorkoutRegistration({
    client,
    path: { accountId, workoutId, registrationId },
    body: payload,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to update registration');
}

export async function deleteWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
  token?: string,
): Promise<void> {
  const client = createClient(token);
  const result = await apiDeleteWorkoutRegistration({
    client,
    path: { accountId, workoutId, registrationId },
    throwOnError: false,
  });

  assertNoApiError(result, 'Failed to delete registration');
}

export async function listRegistrations(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<WorkoutRegistrationType[]> {
  return listWorkoutRegistrations(accountId, workoutId, token);
}

export async function createRegistration(
  accountId: string,
  workoutId: string,
  dto: UpsertWorkoutRegistrationType,
  token?: string,
): Promise<WorkoutRegistrationType> {
  return createWorkoutRegistration(accountId, workoutId, dto, token);
}

export async function getSources(accountId: string, token?: string): Promise<WorkoutSourcesType> {
  const client = createClient(token);
  const result = await apiGetWorkoutSources({
    client,
    path: { accountId },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to fetch workout sources');
}

export async function putSources(
  accountId: string,
  data: WorkoutSourcesType,
  token?: string,
): Promise<void> {
  const client = createClient(token);
  const result = await apiUpdateWorkoutSources({
    client,
    path: { accountId },
    body: data,
    throwOnError: false,
  });

  assertNoApiError(result, 'Failed to update workout sources');
}

export async function appendSourceOption(
  accountId: string,
  option: string,
  token: string,
): Promise<WorkoutSourcesType> {
  const client = createClient(token);
  const result = await apiAppendWorkoutSourceOption({
    client,
    path: { accountId },
    body: { option },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to add workout source option');
}
