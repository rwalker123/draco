export interface WorkoutField {
  id: string;
  name: string;
  address: string;
}

export interface Workout {
  id: string;
  accountId: string;
  workoutDesc: string;
  workoutDate: string; // ISO string
  fieldId?: string | null;
  field?: WorkoutField | null;
  comments: string;
}

export interface WorkoutCreateDTO {
  workoutDesc: string;
  workoutDate: string; // ISO
  fieldId?: string | null;
  comments?: string;
}

export interface WorkoutUpdateDTO {
  workoutDesc?: string;
  workoutDate?: string; // ISO
  fieldId?: string | null;
  comments?: string | null;
}

export interface WorkoutSummary {
  id: string;
  workoutDesc: string;
  workoutDate: string; // ISO
  fieldId?: string | null;
  field?: WorkoutField | null;
  registrationCount?: number;
}

export interface WorkoutRegistrationDTO {
  name: string;
  email: string;
  age: number;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  positions: string;
  isManager: boolean;
  whereHeard: string;
}

export interface WorkoutRegistration extends WorkoutRegistrationDTO {
  id: string;
  workoutId: string;
  dateRegistered: string; // ISO
}

export interface WorkoutSources {
  options: string[];
}

export interface ListWorkoutsFilter {
  status?: 'upcoming' | 'past' | 'all';
  limit?: number;
  before?: string; // ISO
  after?: string; // ISO
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}
