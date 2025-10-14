import {
  WorkoutType,
  WorkoutSummaryType,
  WorkoutRegistrationType,
  WorkoutRegistrationsType,
  FieldType,
} from '@draco/shared-schemas';
import {
  dbWorkoutWithField,
  dbWorkoutWithRegistrationCount,
  dbWorkoutRegistration,
} from '../repositories/types/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import { formatFieldFromAvailableField } from './fieldFormatterUtils.js';

export class WorkoutResponseFormatter {
  static formatWorkouts(
    workouts: Array<dbWorkoutWithField | dbWorkoutWithRegistrationCount>,
  ): WorkoutSummaryType[] {
    return workouts.map((workout) => this.formatWorkoutSummary(workout));
  }

  static formatWorkoutSummary(
    workout: dbWorkoutWithField | dbWorkoutWithRegistrationCount,
  ): WorkoutSummaryType {
    const summary: WorkoutSummaryType = {
      id: workout.id.toString(),
      workoutDesc: workout.workoutdesc,
      workoutDate: DateUtils.formatDateTimeForResponse(workout.workoutdate) || '',
      field: this.mapWorkoutField(workout.availablefields),
    };

    if ('_count' in workout && workout._count) {
      summary.registrationCount = workout._count.workoutregistration;
    }

    return summary;
  }

  static formatWorkout(workout: dbWorkoutWithField): WorkoutType {
    return {
      id: workout.id.toString(),
      accountId: workout.accountid.toString(),
      workoutDesc: workout.workoutdesc,
      workoutDate: DateUtils.formatDateTimeForResponse(workout.workoutdate) || '',
      field: this.mapWorkoutField(workout.availablefields),
      comments: workout.comments,
    };
  }

  static formatRegistration(registration: dbWorkoutRegistration): WorkoutRegistrationType {
    return {
      id: registration.id.toString(),
      workoutId: registration.workoutid.toString(),
      name: registration.name,
      email: registration.email,
      age: registration.age,
      phone1: registration.phone1 ?? '',
      phone2: registration.phone2 ?? '',
      phone3: registration.phone3 ?? '',
      phone4: registration.phone4 ?? '',
      positions: registration.positions,
      isManager: registration.ismanager,
      whereHeard: registration.whereheard,
      dateRegistered: DateUtils.formatDateTimeForResponse(registration.dateregistered) || '',
    };
  }

  static formatRegistrations(registrations: dbWorkoutRegistration[]): WorkoutRegistrationsType {
    return {
      registrations: registrations.map((registration) => this.formatRegistration(registration)),
    };
  }

  private static mapWorkoutField(
    field:
      | dbWorkoutWithField['availablefields']
      | dbWorkoutWithRegistrationCount['availablefields'],
  ): FieldType | null {
    const formatted = formatFieldFromAvailableField(field);

    return formatted ?? null;
  }
}
