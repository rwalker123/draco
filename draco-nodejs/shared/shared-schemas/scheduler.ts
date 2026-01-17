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
        startIncrementMinutes: z.number().int().positive().optional(),
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

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
  .openapi({ type: 'string', format: 'date', example: '2026-04-01' });

const hhmmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be formatted as HH:mm')
  .openapi({ example: '18:30' });

const SchedulerFieldAvailabilityRuleBaseSchema = z.object({
  id: schedulerIdSchema,
  seasonId: schedulerIdSchema,
  fieldId: schedulerIdSchema,
  startDate: isoDateSchema
    .optional()
    .openapi({ description: 'Optional. When omitted, treated as season start date.' }),
  endDate: isoDateSchema
    .optional()
    .openapi({ description: 'Optional. When omitted, treated as season end date.' }),
  daysOfWeekMask: z.number().int().min(1).max(127).openapi({
    example: 21,
    description: 'Bitmask for days of week where bit 0=Mon ... bit 6=Sun.',
  }),
  startTimeLocal: hhmmSchema,
  endTimeLocal: hhmmSchema,
  enabled: z.boolean(),
});

const fieldAvailabilityRuleRefinement = (
  data: { startDate?: string; endDate?: string; startTimeLocal: string; endTimeLocal: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['startDate'],
      message: 'startDate must be on or before endDate',
    });
  }

  if (data.startTimeLocal >= data.endTimeLocal) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTimeLocal'],
      message: 'startTimeLocal must be before endTimeLocal',
    });
  }
};

export const SchedulerFieldAvailabilityRuleSchema =
  SchedulerFieldAvailabilityRuleBaseSchema.superRefine(fieldAvailabilityRuleRefinement).openapi({
    title: 'SchedulerFieldAvailabilityRule',
  });

export const SchedulerFieldAvailabilityRuleUpsertSchema =
  SchedulerFieldAvailabilityRuleBaseSchema.omit({ id: true })
    .superRefine(fieldAvailabilityRuleRefinement)
    .openapi({ title: 'SchedulerFieldAvailabilityRuleUpsert' });

export const SchedulerFieldAvailabilityRulesSchema = z
  .object({
    rules: SchedulerFieldAvailabilityRuleSchema.array(),
  })
  .openapi({ title: 'SchedulerFieldAvailabilityRules' });

export const SchedulerFieldExclusionDateSchema = z
  .object({
    id: schedulerIdSchema,
    seasonId: schedulerIdSchema,
    fieldId: schedulerIdSchema,
    date: isoDateSchema,
    note: z.string().trim().min(1).max(255).optional(),
    enabled: z.boolean(),
  })
  .openapi({
    title: 'SchedulerFieldExclusionDate',
    description:
      'A date-only exclusion for a field. When enabled, no fieldSlots will be generated for the field on this date.',
  });

export const SchedulerFieldExclusionDateUpsertSchema = SchedulerFieldExclusionDateSchema.omit({
  id: true,
}).openapi({ title: 'SchedulerFieldExclusionDateUpsert' });

export const SchedulerFieldExclusionDatesSchema = z
  .object({
    exclusions: SchedulerFieldExclusionDateSchema.array(),
  })
  .openapi({ title: 'SchedulerFieldExclusionDates' });

export const SchedulerSeasonWindowConfigSchema = z
  .object({
    seasonId: schedulerIdSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    leagueSeasonIds: schedulerIdSchema
      .array()
      .min(1)
      .optional()
      .openapi({
        description:
          'League-season IDs selected for scheduling. When omitted, the frontend should treat this as "all leagues".',
        example: ['55', '56'],
      }),
    umpiresPerGame: z.number().int().min(1).max(4).optional().openapi({
      example: 2,
      description: 'Default required umpire count per game for season-scoped scheduling runs.',
    }),
    maxGamesPerUmpirePerDay: z.number().int().positive().nullable().optional().openapi({
      example: 2,
      description:
        'Optional global max games/day limit per umpire for season-scoped scheduling runs. Use null to clear.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.startDate > data.endDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'startDate must be on or before endDate',
      });
    }
  })
  .openapi({
    title: 'SchedulerSeasonWindowConfig',
    description:
      'Explicit season scheduling window used as the default date bounds when expanding field availability rules into fieldSlots.',
  });

export const SchedulerSeasonWindowConfigUpsertSchema = SchedulerSeasonWindowConfigSchema.openapi({
  title: 'SchedulerSeasonWindowConfigUpsert',
});

const SchedulerSeasonExclusionBaseSchema = z.object({
  id: schedulerIdSchema,
  seasonId: schedulerIdSchema,
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  note: z.string().trim().min(1).max(255).optional(),
  enabled: z.boolean(),
});

const seasonExclusionRefinement = (
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'startTime must be before endTime',
    });
  }
};

export const SchedulerSeasonExclusionSchema = SchedulerSeasonExclusionBaseSchema.superRefine(
  seasonExclusionRefinement,
).openapi({
  title: 'SchedulerSeasonExclusion',
  description:
    'Season-level exclusion window. When enabled, games must not be scheduled within the excluded time range.',
});

export const SchedulerSeasonExclusionUpsertSchema = SchedulerSeasonExclusionBaseSchema.omit({
  id: true,
})
  .superRefine(seasonExclusionRefinement)
  .openapi({ title: 'SchedulerSeasonExclusionUpsert' });

export const SchedulerSeasonExclusionsSchema = z
  .object({
    exclusions: SchedulerSeasonExclusionSchema.array(),
  })
  .openapi({ title: 'SchedulerSeasonExclusions' });

const SchedulerTeamExclusionBaseSchema = z.object({
  id: schedulerIdSchema,
  seasonId: schedulerIdSchema,
  teamSeasonId: schedulerIdSchema,
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  note: z.string().trim().min(1).max(255).optional(),
  enabled: z.boolean(),
});

const teamExclusionRefinement = (
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'startTime must be before endTime',
    });
  }
};

export const SchedulerTeamExclusionSchema = SchedulerTeamExclusionBaseSchema.superRefine(
  teamExclusionRefinement,
).openapi({
  title: 'SchedulerTeamExclusion',
  description:
    'Team-season exclusion window. When enabled, the team must not be scheduled within the excluded time range.',
});

export const SchedulerTeamExclusionUpsertSchema = SchedulerTeamExclusionBaseSchema.omit({
  id: true,
})
  .superRefine(teamExclusionRefinement)
  .openapi({ title: 'SchedulerTeamExclusionUpsert' });

export const SchedulerTeamExclusionsSchema = z
  .object({
    exclusions: SchedulerTeamExclusionSchema.array(),
  })
  .openapi({ title: 'SchedulerTeamExclusions' });

const SchedulerUmpireExclusionBaseSchema = z.object({
  id: schedulerIdSchema,
  seasonId: schedulerIdSchema,
  umpireId: schedulerIdSchema,
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  note: z.string().trim().min(1).max(255).optional(),
  enabled: z.boolean(),
});

const umpireExclusionRefinement = (
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'startTime must be before endTime',
    });
  }
};

export const SchedulerUmpireExclusionSchema = SchedulerUmpireExclusionBaseSchema.superRefine(
  umpireExclusionRefinement,
).openapi({
  title: 'SchedulerUmpireExclusion',
  description:
    'Umpire exclusion window. When enabled, the umpire must not be assigned within the excluded time range.',
});

export const SchedulerUmpireExclusionUpsertSchema = SchedulerUmpireExclusionBaseSchema.omit({
  id: true,
})
  .superRefine(umpireExclusionRefinement)
  .openapi({ title: 'SchedulerUmpireExclusionUpsert' });

export const SchedulerUmpireExclusionsSchema = z
  .object({
    exclusions: SchedulerUmpireExclusionSchema.array(),
  })
  .openapi({ title: 'SchedulerUmpireExclusions' });

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

const SchedulerRequireLightsAfterConstraintSchema = z
  .object({
    enabled: z.boolean(),
    startHourLocal: z.number().int().min(0).max(23),
    timeZone: z.string().trim().min(1).openapi({ example: 'America/Chicago' }),
  })
  .openapi({ title: 'SchedulerRequireLightsAfterConstraint' });

const SchedulerRequireLightsAfterOverrideSchema = SchedulerRequireLightsAfterConstraintSchema.omit({
  timeZone: true,
}).openapi({
  title: 'SchedulerRequireLightsAfterOverride',
  description:
    'DB-sourced solve requests omit the timeZone; the backend uses the account timezoneid.',
});

export const SchedulerHardConstraintsSchema = z
  .object({
    respectTeamBlackouts: z.boolean().optional(),
    respectUmpireAvailability: z.boolean().optional(),
    respectFieldSlots: z.boolean().optional(),
    maxGamesPerTeamPerDay: z.number().int().positive().optional(),
    maxGamesPerUmpirePerDay: z.number().int().positive().optional(),
    requireLightsAfter: SchedulerRequireLightsAfterConstraintSchema.optional().openapi({
      description:
        'When enabled, slots whose local start time is at/after startHourLocal must use a field with hasLights=true.',
    }),
  })
  .openapi({ title: 'SchedulerHardConstraints' });

export const SchedulerHardConstraintsOverrideSchema = SchedulerHardConstraintsSchema.extend({
  requireLightsAfter: SchedulerRequireLightsAfterOverrideSchema.optional().openapi({
    description:
      'When enabled, slots whose local start time is at/after startHourLocal must use a field with hasLights=true. The backend will use the account timezoneid.',
  }),
}).openapi({ title: 'SchedulerHardConstraintsOverride' });

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

export const SchedulerConstraintsOverrideSchema = z
  .object({
    hard: SchedulerHardConstraintsOverrideSchema.optional(),
    soft: SchedulerSoftConstraintsSchema.optional(),
  })
  .optional()
  .openapi({ title: 'SchedulerConstraintsOverride' });

export const SchedulerConstraintsOverrideRequiredSchema = z
  .object({
    hard: SchedulerHardConstraintsOverrideSchema.optional(),
    soft: SchedulerSoftConstraintsSchema.optional(),
  })
  .openapi({
    title: 'SchedulerConstraintsOverrideRequired',
    description: 'Constraints overrides are required for season-scoped apply requests.',
  });

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
    seasonExclusions: SchedulerSeasonExclusionSchema.array().optional(),
    teamExclusions: SchedulerTeamExclusionSchema.array().optional(),
    umpireExclusions: SchedulerUmpireExclusionSchema.array().optional(),
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
        },
      },
      objectives: { primary: 'maximize_scheduled_games' },
    },
  });

export const SchedulerSeasonSolveRequestSchema = z
  .object({
    constraints: SchedulerConstraintsOverrideSchema,
    objectives: SchedulerObjectivesSchema,
    gameIds: schedulerIdSchema.array().min(1).optional(),
    umpiresPerGame: z.number().int().min(1).max(4).optional().openapi({
      example: 2,
      description:
        'Optional override for required umpire count per game. When provided, all games in the solve request require exactly this many umpires.',
    }),
  })
  .openapi({
    title: 'SchedulerSeasonSolveRequest',
    description:
      'DB-sourced solve request. The backend assembles teams/games/fields/umpires/fieldSlots from the database; the caller may provide optional constraint/objective overrides.',
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

export const SchedulerApplyModeSchema = z.enum(['all', 'subset']).openapi({
  title: 'SchedulerApplyMode',
  description: 'Whether to apply all assignments or only a subset.',
});

export const SchedulerApplyRequestSchema = z
  .object({
    runId: z.string().trim().min(1),
    mode: SchedulerApplyModeSchema,
    assignments: SchedulerAssignmentSchema.array().min(1),
    constraints: SchedulerConstraintsSchema,
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

export const SchedulerSeasonApplyRequestSchema = z
  .object({
    runId: z.string().trim().min(1),
    mode: SchedulerApplyModeSchema,
    assignments: SchedulerAssignmentSchema.array().min(1),
    constraints: SchedulerConstraintsOverrideRequiredSchema,
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
    title: 'SchedulerSeasonApplyRequest',
    description:
      'DB-sourced apply request. Persists the proposed assignments for the season using DB-derived data plus constraint overrides.',
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
export type SchedulerFieldAvailabilityRule = z.infer<typeof SchedulerFieldAvailabilityRuleSchema>;
export type SchedulerFieldAvailabilityRuleUpsert = z.infer<
  typeof SchedulerFieldAvailabilityRuleUpsertSchema
>;
export type SchedulerFieldAvailabilityRules = z.infer<typeof SchedulerFieldAvailabilityRulesSchema>;
export type SchedulerFieldExclusionDate = z.infer<typeof SchedulerFieldExclusionDateSchema>;
export type SchedulerFieldExclusionDateUpsert = z.infer<
  typeof SchedulerFieldExclusionDateUpsertSchema
>;
export type SchedulerFieldExclusionDates = z.infer<typeof SchedulerFieldExclusionDatesSchema>;
export type SchedulerSeasonWindowConfig = z.infer<typeof SchedulerSeasonWindowConfigSchema>;
export type SchedulerSeasonWindowConfigUpsert = z.infer<
  typeof SchedulerSeasonWindowConfigUpsertSchema
>;
export type SchedulerSeasonExclusion = z.infer<typeof SchedulerSeasonExclusionSchema>;
export type SchedulerSeasonExclusionUpsert = z.infer<typeof SchedulerSeasonExclusionUpsertSchema>;
export type SchedulerSeasonExclusions = z.infer<typeof SchedulerSeasonExclusionsSchema>;
export type SchedulerTeamExclusion = z.infer<typeof SchedulerTeamExclusionSchema>;
export type SchedulerTeamExclusionUpsert = z.infer<typeof SchedulerTeamExclusionUpsertSchema>;
export type SchedulerTeamExclusions = z.infer<typeof SchedulerTeamExclusionsSchema>;
export type SchedulerUmpireExclusion = z.infer<typeof SchedulerUmpireExclusionSchema>;
export type SchedulerUmpireExclusionUpsert = z.infer<typeof SchedulerUmpireExclusionUpsertSchema>;
export type SchedulerUmpireExclusions = z.infer<typeof SchedulerUmpireExclusionsSchema>;
export type SchedulerGameRequest = z.infer<typeof SchedulerGameRequestSchema>;
export type SchedulerFieldSlot = z.infer<typeof SchedulerFieldSlotSchema>;
export type SchedulerUmpireAvailability = z.infer<typeof SchedulerUmpireAvailabilitySchema>;
export type SchedulerTeamBlackout = z.infer<typeof SchedulerTeamBlackoutSchema>;
export type SchedulerHardConstraints = z.infer<typeof SchedulerHardConstraintsSchema>;
export type SchedulerSoftConstraints = z.infer<typeof SchedulerSoftConstraintsSchema>;
export type SchedulerConstraints = z.infer<typeof SchedulerConstraintsSchema>;
export type SchedulerConstraintsOverrideRequired = z.infer<
  typeof SchedulerConstraintsOverrideRequiredSchema
>;
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
export type SchedulerSeasonSolveRequest = z.infer<typeof SchedulerSeasonSolveRequestSchema>;
export type SchedulerSeasonApplyRequest = z.infer<typeof SchedulerSeasonApplyRequestSchema>;

export const SchedulerProblemSpecPreviewSchema = z
  .object({
    season: SchedulerSeasonConfigSchema,
    teams: SchedulerTeamSchema.array(),
    fields: SchedulerFieldSchema.array(),
    umpires: SchedulerUmpireSchema.array(),
    games: SchedulerGameRequestSchema.array(),
    fieldSlots: SchedulerFieldSlotSchema.array(),
    fieldAvailabilityRules: SchedulerFieldAvailabilityRuleSchema.array(),
    fieldExclusionDates: SchedulerFieldExclusionDateSchema.array(),
    seasonWindowConfig: SchedulerSeasonWindowConfigSchema.optional(),
    seasonExclusions: SchedulerSeasonExclusionSchema.array().optional(),
    teamExclusions: SchedulerTeamExclusionSchema.array().optional(),
    umpireExclusions: SchedulerUmpireExclusionSchema.array().optional(),
  })
  .openapi({
    title: 'SchedulerProblemSpecPreview',
    description:
      'DB-assembled scheduling problem spec preview. Uses field availability rules expanded into concrete fieldSlots.',
  });

export type SchedulerProblemSpecPreview = z.infer<typeof SchedulerProblemSpecPreviewSchema>;
