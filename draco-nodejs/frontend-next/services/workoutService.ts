import {
  Workout,
  WorkoutSummary,
  WorkoutCreateDTO,
  WorkoutUpdateDTO,
  WorkoutRegistrationDTO,
  WorkoutRegistration,
  WorkoutSources,
} from '../types/workouts';

export async function listWorkouts(
  accountId: string,
  includeRegistrationCounts = true,
  token?: string,
): Promise<WorkoutSummary[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      `/api/accounts/${accountId}/workouts?includeRegistrationCounts=${includeRegistrationCounts}`,
      { headers },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch workouts');
    }
    const data = await response.json();
    return data.data.workouts || [];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
}

export async function getWorkout(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<Workout> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/${workoutId}`, { headers });
    if (!res.ok) {
      throw new Error('Failed to fetch workout');
    }
    const json = await res.json();
    return json.data.workout as Workout;
  } catch (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
}

export async function createWorkout(
  accountId: string,
  dto: WorkoutCreateDTO,
  token?: string,
): Promise<Workout> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error('Failed to create workout');
    }
    const json = await res.json();
    return json.data.workout as Workout;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}

export async function updateWorkout(
  accountId: string,
  workoutId: string,
  dto: WorkoutUpdateDTO,
  token?: string,
): Promise<Workout> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/${workoutId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error('Failed to update workout');
    }
    const json = await res.json();
    return json.data.workout as Workout;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

export async function deleteWorkout(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/${workoutId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to delete workout');
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

// Registration CRUD operations
export async function listWorkoutRegistrations(
  accountId: string,
  workoutId: string,
  token?: string,
): Promise<WorkoutRegistration[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/${workoutId}/registrations`, {
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to fetch registrations');
    }
    const json = await res.json();
    // Backend returns { success: true, data: { items: [...] } }
    return json.data?.items || [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
}

export async function getWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
  token?: string,
): Promise<WorkoutRegistration> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error('Failed to fetch registration');
    }
    const json = await res.json();
    // Backend returns { success: true, data: { registration: {...} } }
    return json.data?.registration as WorkoutRegistration;
  } catch (error) {
    console.error('Error fetching registration:', error);
    throw error;
  }
}

export async function createWorkoutRegistration(
  accountId: string,
  workoutId: string,
  dto: WorkoutRegistrationDTO,
  token?: string,
): Promise<WorkoutRegistration> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/${workoutId}/registrations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error('Failed to create registration');
    }
    const json = await res.json();
    // Backend returns { success: true, data: { registration: {...} } }
    return json.data?.registration as WorkoutRegistration;
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
  token?: string,
): Promise<WorkoutRegistration> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(dto),
      },
    );
    if (!res.ok) {
      throw new Error('Failed to update registration');
    }
    const json = await res.json();
    // Backend returns { success: true, data: { registration: {...} } }
    return json.data?.registration as WorkoutRegistration;
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

export async function deleteWorkoutRegistration(
  accountId: string,
  workoutId: string,
  registrationId: string,
  token?: string,
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `/api/accounts/${accountId}/workouts/${workoutId}/registrations/${registrationId}`,
      {
        method: 'DELETE',
        headers,
      },
    );
    if (!res.ok) {
      throw new Error('Failed to delete registration');
    }
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
    const res = await fetch(`/api/accounts/${accountId}/workouts/sources`);
    if (!res.ok) {
      throw new Error('Failed to fetch workout sources');
    }
    const json = await res.json();
    return json.data as WorkoutSources;
  } catch (error) {
    console.error('Error fetching workout sources:', error);
    throw error;
  }
}

export async function putSources(
  accountId: string,
  data: WorkoutSources,
  token?: string,
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/accounts/${accountId}/workouts/sources`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to update workout sources');
    }
  } catch (error) {
    console.error('Error updating workout sources:', error);
    throw error;
  }
}
