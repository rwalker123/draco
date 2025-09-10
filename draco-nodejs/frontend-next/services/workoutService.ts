import {
  Workout,
  WorkoutSummary,
  WorkoutCreateDTO,
  WorkoutUpdateDTO,
  WorkoutRegistrationDTO,
  WorkoutRegistration,
  WorkoutSources,
} from '../types/workouts';
import { axiosInstance } from '../utils/axiosConfig';

export async function listWorkouts(
  accountId: string,
  includeRegistrationCounts = true,
): Promise<WorkoutSummary[]> {
  try {
    const response = await axiosInstance.get(
      `/api/accounts/${accountId}/workouts?includeRegistrationCounts=${includeRegistrationCounts}`,
    );
    return response.data.data.workouts || [];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
}

export async function getWorkout(accountId: string, workoutId: string): Promise<Workout> {
  try {
    const res = await axiosInstance.get(`/api/accounts/${accountId}/workouts/${workoutId}`);
    return res.data.data.workout as Workout;
  } catch (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
}

export async function createWorkout(accountId: string, dto: WorkoutCreateDTO): Promise<Workout> {
  try {
    const res = await axiosInstance.post(`/api/accounts/${accountId}/workouts`, dto);
    return res.data.data.workout as Workout;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}

export async function updateWorkout(
  accountId: string,
  workoutId: string,
  dto: WorkoutUpdateDTO,
): Promise<Workout> {
  try {
    const res = await axiosInstance.put(`/api/accounts/${accountId}/workouts/${workoutId}`, dto);
    return res.data.data.workout as Workout;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

export async function deleteWorkout(accountId: string, workoutId: string): Promise<void> {
  try {
    await axiosInstance.delete(`/api/accounts/${accountId}/workouts/${workoutId}`);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

// Registration CRUD operations
export async function listWorkoutRegistrations(
  accountId: string,
  workoutId: string,
): Promise<WorkoutRegistration[]> {
  try {
    const res = await axiosInstance.get(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations`,
    );
    // Backend returns { success: true, data: { items: [...] } }
    return res.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
}

export async function getWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
): Promise<WorkoutRegistration> {
  try {
    const res = await axiosInstance.get(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
    );
    // Backend returns { success: true, data: { registration: {...} } }
    return res.data.data?.registration as WorkoutRegistration;
  } catch (error) {
    console.error('Error fetching registration:', error);
    throw error;
  }
}

export async function createWorkoutRegistration(
  accountId: string,
  workoutId: string,
  dto: WorkoutRegistrationDTO,
): Promise<WorkoutRegistration> {
  try {
    const res = await axiosInstance.post(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations`,
      dto,
    );
    // Backend returns { success: true, data: { registration: {...} } }
    return res.data.data?.registration as WorkoutRegistration;
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}

export async function updateWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
  dto: WorkoutRegistrationDTO,
): Promise<WorkoutRegistration> {
  try {
    const res = await axiosInstance.put(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
      dto,
    );
    // Backend returns { success: true, data: { registration: {...} } }
    return res.data.data?.registration as WorkoutRegistration;
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

export async function deleteWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
): Promise<void> {
  try {
    await axiosInstance.delete(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
    );
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

// Legacy methods for backward compatibility
export async function listRegistrations(
  accountId: string,
  workoutId: string,
): Promise<WorkoutRegistration[]> {
  return listWorkoutRegistrations(accountId, workoutId);
}

export async function createRegistration(
  accountId: string,
  workoutId: string,
  dto: WorkoutRegistrationDTO,
): Promise<WorkoutRegistration> {
  return createWorkoutRegistration(accountId, workoutId, dto);
}

export async function getSources(accountId: string): Promise<WorkoutSources> {
  try {
    const res = await axiosInstance.get(`/api/accounts/${accountId}/workouts/sources`);
    return res.data.data as WorkoutSources;
  } catch (error) {
    console.error('Error fetching workout sources:', error);
    throw error;
  }
}

export async function putSources(accountId: string, data: WorkoutSources): Promise<void> {
  try {
    await axiosInstance.put(`/api/accounts/${accountId}/workouts/sources`, data);
  } catch (error) {
    console.error('Error updating workout sources:', error);
    throw error;
  }
}
