/**
 * Field-related constants
 */

/**
 * Default increment in minutes between game start times for scheduler field slots.
 * This value is used when a field doesn't have a custom schedulerStartIncrementMinutes configured.
 *
 * 165 minutes = 2 hours 45 minutes (typical game duration + buffer time)
 *
 * Note: This constant is also used as @default(165) in prisma/schema.prisma
 * for the availablefields.schedulerstartincrementminutes field.
 */
export const DEFAULT_FIELD_START_INCREMENT_MINUTES = 165;
