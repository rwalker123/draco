/**
 * Utility functions for mapping workout-related data structures
 */

import { availablefields } from '@prisma/client';

/**
 * Configuration constants for workout operations
 */
export const WORKOUT_CONSTANTS = {
  DEFAULT_WORKOUTS_LIMIT: 25,
  DEFAULT_REGISTRATIONS_LIMIT: 50,
  MAX_REGISTRATIONS_EXPORT: 10000 as number,
  MAX_SOURCE_OPTION_LENGTH: 25,
} as const;

/**
 * Standard field selection for availablefields join
 */
export const FIELD_SELECT = {
  id: true,
  name: true,
  address: true,
} as const;

/**
 * Maps a Prisma availablefields object to the API field format
 * @param field - The availablefields object from Prisma or null
 * @returns Formatted field object or null
 */
export function mapWorkoutField(field: Pick<availablefields, 'id' | 'name' | 'address'> | null) {
  if (!field) return null;

  return {
    id: field.id.toString(),
    name: field.name,
    address: field.address,
  };
}

/**
 * Standard availablefields include for Prisma queries
 */
export const FIELD_INCLUDE = {
  availablefields: {
    select: FIELD_SELECT,
  },
} as const;
