import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { isoDateTimeSchema } from './date.js';

extendZodWithOpenApi(z);

const schedulerIdSchema = z.string().trim().min(1).openapi({ example: '123' });

export const SchedulerGameDurationsSchema = z
  .object({
    defaultMinutes: z.number().int().positive().optional().openapi({ example: 75 }),
    weekendMinutes: z.number().int().positive().optional().openapi({ example: 90 }),
    weekdayMinutes: z.number().int().positive().optional().openapi({ example: 60 }),
  })
  .optional()
  .openapi({ title: 'SchedulerGameDurations' });

export const SchedulerSeasonConfigSchema = z
  .object({
    id: schedulerIdSchema,
    name: z.string().trim().min(1).openapi({ example: 'Spring 2026' }),
    startDate: z.string().trim().min(1).openapi({ example: '2026-04-01' }),
    endDate: z.string().trim().min(1).openapi({ example: '2026-08-31' }),
    gameDurations: SchedulerGameDurationsSchema,
  })
  .openapi({ title: 'SchedulerSeasonConfig' });

export const SchedulerLeagueRefSchema = z
  .object({
    id: schedulerIdSchema,
    name: z.string().trim().min(1).optional().openapi({ example: 'Open' }),
  })
  .openapi({ title: 'SchedulerLeagueRef' });

export const SchedulerTeamSchema = z
  .object({
    id: schedulerIdSchema,
    teamSeasonId: schedulerIdSchema,
    divisionSeasonId: schedulerIdSchema.optional(),
    league: SchedulerLeagueRefSchema,
  })
  .openapi({ title: 'SchedulerTeam' });

export const SchedulerFieldSchema = z
  .object({
    id: schedulerIdSchema,
    name: z.string().trim().min(1).openapi({ example: 'Field 1' }),
    properties: z
      .object({
        hasLights: z.boolean().optional(),
        maxParallelGames: z.number().int().positive().optional(),
      })
      .optional(),
  })
  .openapi({ title: 'SchedulerField' });

export const SchedulerUmpireSchema = z
  .object({
    id: schedulerIdSchema,
    name: z.string().trim().min(1).optional(),
    maxGamesPerDay: z.number().int().positive().optional(),
  })
  .openapi({ title: 'SchedulerUmpire' });

export const SchedulerGameRequestSchema = z
  .object({
    id: schedulerIdSchema,
    leagueSeasonId: schedulerIdSchema,
    homeTeamSeasonId: schedulerIdSchema,
    visitorTeamSeasonId: schedulerIdSchema,
    requiredUmpires: z.number().int().nonnegative().optional().openapi({ example: 1 }),
    preferredFieldIds: schedulerIdSchema.array().optional(),
    earliestStart: isoDateTimeSchema.optional(),
    latestEnd: isoDateTimeSchema.optional(),
    durationMinutes: z.number().int().positive().optional(),
  })
  .openapi({ title: 'SchedulerGameRequest' });

export const SchedulerFieldSlotSchema = z
  .object({
    id: z.string().trim().min(1).openapi({ example: 'slot-1' }),
    fieldId: schedulerIdSchema,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
  })
  .openapi({ title: 'SchedulerFieldSlot' });

export const SchedulerUmpireAvailabilitySchema = z
  .object({
    umpireId: schedulerIdSchema,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
  })
  .openapi({ title: 'SchedulerUmpireAvailability' });

export const SchedulerTeamBlackoutSchema = z
  .object({
    teamSeasonId: schedulerIdSchema,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
  })
  .openapi({ title: 'SchedulerTeamBlackout' });

export const SchedulerHardConstraintsSchema = z
  .object({
    respectTeamBlackouts: z.boolean().optional(),
    respectUmpireAvailability: z.boolean().optional(),
    respectFieldSlots: z.boolean().optional(),
    maxGamesPerTeamPerDay: z.number().int().positive().optional(),
    maxGamesPerUmpirePerDay: z.number().int().positive().optional(),
    noTeamOverlap: z.boolean().optional(),
    noUmpireOverlap: z.boolean().optional(),
    noFieldOverlap: z.boolean().optional(),
  })
  .openapi({ title: 'SchedulerHardConstraints' });

export const SchedulerSoftConstraintsSchema = z
  .object({
    avoidBackToBackGames: z
      .object({
        enabled: z.boolean(),
        minRestMinutes: z.number().int().nonnegative(),
        weight: z.number().int().nonnegative().optional(),
      })
      .optional(),
    balanceEarlyVsLate: z
      .object({
        enabled: z.boolean(),
        weight: z.number().int().nonnegative().optional(),
      })
      .optional(),
    spreadGamesAcrossDays: z
      .object({
        enabled: z.boolean(),
        weight: z.number().int().nonnegative().optional(),
      })
      .optional(),
  })
  .openapi({ title: 'SchedulerSoftConstraints' });

export const SchedulerConstraintsSchema = z
  .object({
    hard: SchedulerHardConstraintsSchema.optional(),
    soft: SchedulerSoftConstraintsSchema.optional(),
  })
  .optional()
  .openapi({ title: 'SchedulerConstraints' });

export const SchedulerObjectivesSchema = z
  .object({
    primary: z.enum(['maximize_scheduled_games', 'minimize_conflicts']).optional(),
    secondary: z.string().trim().min(1).array().optional(),
  })
  .optional()
  .openapi({ title: 'SchedulerObjectives' });

export const SchedulerProblemSpecSchema = z
  .object({
    season: SchedulerSeasonConfigSchema,
    teams: SchedulerTeamSchema.array(),
    fields: SchedulerFieldSchema.array(),
    umpires: SchedulerUmpireSchema.array(),
    games: SchedulerGameRequestSchema.array().min(1),
    fieldSlots: SchedulerFieldSlotSchema.array().min(1),
    umpireAvailability: SchedulerUmpireAvailabilitySchema.array().optional(),
    teamBlackouts: SchedulerTeamBlackoutSchema.array().optional(),
    constraints: SchedulerConstraintsSchema,
    objectives: SchedulerObjectivesSchema,
    runId: z.string().trim().min(1).optional().openapi({ example: 'sched_account_42_ab12cd34' }),
  })
  .openapi({
    title: 'SchedulerProblemSpec',
    description:
      'Self-contained scheduling problem specification. The solver treats this input as authoritative and does not perform DB lookups.',
    example: {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 75, weekendMinutes: 90, weekdayMinutes: 60 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [
        { id: 'field-1', name: 'Field 1', properties: { hasLights: true, maxParallelGames: 1 } },
      ],
      umpires: [{ id: 'ump-1', name: 'Alice', maxGamesPerDay: 3 }],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          requiredUmpires: 1,
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      constraints: {
        hard: {
          respectFieldSlots: true,
          respectTeamBlackouts: true,
          respectUmpireAvailability: true,
          noFieldOverlap: true,
          noTeamOverlap: true,
          noUmpireOverlap: true,
        },
      },
      objectives: { primary: 'maximize_scheduled_games' },
    },
  });

export const SchedulerAssignmentSchema = z
  .object({
    gameId: schedulerIdSchema,
    fieldId: schedulerIdSchema,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    umpireIds: schedulerIdSchema.array(),
  })
  .openapi({ title: 'SchedulerAssignment' });

export const SchedulerUnscheduledReasonSchema = z
  .object({
    gameId: schedulerIdSchema,
    reason: z.string().trim().min(1),
  })
  .openapi({ title: 'SchedulerUnscheduledReason' });

export const SchedulerMetricsSchema = z
  .object({
    totalGames: z.number().int().nonnegative(),
    scheduledGames: z.number().int().nonnegative(),
    unscheduledGames: z.number().int().nonnegative(),
    objectiveValue: z.number().optional(),
  })
  .openapi({ title: 'SchedulerMetrics' });

export const SchedulerRunStatusSchema = z
  .enum(['completed', 'partial', 'infeasible', 'failed'])
  .openapi({ title: 'SchedulerRunStatus' });

export const SchedulerSolveResultSchema = z
  .object({
    runId: z.string().trim().min(1),
    status: SchedulerRunStatusSchema,
    metrics: SchedulerMetricsSchema,
    assignments: SchedulerAssignmentSchema.array(),
    unscheduled: SchedulerUnscheduledReasonSchema.array(),
  })
  .openapi({
    title: 'SchedulerSolveResult',
    description:
      'Proposal-only solve output. Persisting assignments is handled by a follow-up apply endpoint.',
    example: {
      runId: 'sched_account_42_ab12cd34ef56gh78',
      status: 'completed',
      metrics: { totalGames: 1, scheduledGames: 1, unscheduledGames: 0, objectiveValue: 1 },
      assignments: [
        {
          gameId: 'game-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: ['ump-1'],
        },
      ],
      unscheduled: [],
    },
  });

export const SchedulerApplyModeSchema = z
  .enum(['all', 'subset'])
  .openapi({
    title: 'SchedulerApplyMode',
    description: 'Whether to apply all assignments or only a subset.',
  });

export const SchedulerApplyRequestSchema = z
  .object({
    runId: z.string().trim().min(1),
    mode: SchedulerApplyModeSchema,
    assignments: SchedulerAssignmentSchema.array().min(1),
    gameIds: schedulerIdSchema.array().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'subset' && (!data.gameIds || data.gameIds.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['gameIds'],
        message: 'gameIds is required when mode is subset',
      });
    }
  })
  .openapi({
    title: 'SchedulerApplyRequest',
    description:
      'Apply a scheduling proposal to persist assignments. This is a follow-up to /scheduler/solve and writes to the database.',
    example: {
      runId: 'sched_account_42_ab12cd34ef56gh78',
      mode: 'subset',
      gameIds: ['123', '124'],
      assignments: [
        {
          gameId: '123',
          fieldId: '44',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: ['10'],
        },
      ],
    },
  });

export const SchedulerApplySkippedSchema = z
  .object({
    gameId: schedulerIdSchema,
    reason: z.string().trim().min(1),
  })
  .openapi({ title: 'SchedulerApplySkipped' });

export const SchedulerApplyStatusSchema = z
  .enum(['applied', 'partial', 'failed'])
  .openapi({ title: 'SchedulerApplyStatus' });

export const SchedulerApplyResultSchema = z
  .object({
    runId: z.string().trim().min(1),
    status: SchedulerApplyStatusSchema,
    appliedGameIds: schedulerIdSchema.array(),
    skipped: SchedulerApplySkippedSchema.array(),
  })
  .openapi({
    title: 'SchedulerApplyResult',
    description: 'Outcome of persisting a scheduling proposal.',
    example: {
      runId: 'sched_account_42_ab12cd34ef56gh78',
      status: 'partial',
      appliedGameIds: ['123'],
      skipped: [{ gameId: '124', reason: 'Field is already booked for this date and time' }],
    },
  });

export type SchedulerSeasonConfig = z.infer<typeof SchedulerSeasonConfigSchema>;
export type SchedulerTeam = z.infer<typeof SchedulerTeamSchema>;
export type SchedulerField = z.infer<typeof SchedulerFieldSchema>;
export type SchedulerUmpire = z.infer<typeof SchedulerUmpireSchema>;
export type SchedulerGameRequest = z.infer<typeof SchedulerGameRequestSchema>;
export type SchedulerFieldSlot = z.infer<typeof SchedulerFieldSlotSchema>;
export type SchedulerUmpireAvailability = z.infer<typeof SchedulerUmpireAvailabilitySchema>;
export type SchedulerTeamBlackout = z.infer<typeof SchedulerTeamBlackoutSchema>;
export type SchedulerHardConstraints = z.infer<typeof SchedulerHardConstraintsSchema>;
export type SchedulerSoftConstraints = z.infer<typeof SchedulerSoftConstraintsSchema>;
export type SchedulerConstraints = z.infer<typeof SchedulerConstraintsSchema>;
export type SchedulerObjectives = z.infer<typeof SchedulerObjectivesSchema>;
export type SchedulerProblemSpec = z.infer<typeof SchedulerProblemSpecSchema>;
export type SchedulerAssignment = z.infer<typeof SchedulerAssignmentSchema>;
export type SchedulerUnscheduledReason = z.infer<typeof SchedulerUnscheduledReasonSchema>;
export type SchedulerMetrics = z.infer<typeof SchedulerMetricsSchema>;
export type SchedulerRunStatus = z.infer<typeof SchedulerRunStatusSchema>;
export type SchedulerSolveResult = z.infer<typeof SchedulerSolveResultSchema>;
export type SchedulerApplyMode = z.infer<typeof SchedulerApplyModeSchema>;
export type SchedulerApplyRequest = z.infer<typeof SchedulerApplyRequestSchema>;
export type SchedulerApplySkipped = z.infer<typeof SchedulerApplySkippedSchema>;
export type SchedulerApplyStatus = z.infer<typeof SchedulerApplyStatusSchema>;
export type SchedulerApplyResult = z.infer<typeof SchedulerApplyResultSchema>;
