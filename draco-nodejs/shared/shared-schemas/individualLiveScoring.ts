import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { LiveScoringStatusSchema } from './liveScoring.js';

extendZodWithOpenApi(z);

export const StartIndividualLiveScoringSchema = z
  .object({
    courseId: z.string(),
    teeId: z.string(),
    datePlayed: z.string(),
    startingHole: z.number().int().min(1).max(18).optional().default(1),
    holesPlayed: z
      .union([z.literal(9), z.literal(18)])
      .optional()
      .default(18),
  })
  .openapi({
    title: 'StartIndividualLiveScoring',
    description: 'Request to start an individual live scoring session',
  });

export const SubmitIndividualLiveHoleScoreSchema = z
  .object({
    holeNumber: z.number().int().min(1).max(18),
    score: z.number().int().min(1).max(20),
  })
  .openapi({
    title: 'SubmitIndividualLiveHoleScore',
    description: 'Request to submit a single hole score during individual live scoring',
  });

export const AdvanceIndividualLiveHoleSchema = z
  .object({
    holeNumber: z.number().int().min(1).max(18),
  })
  .openapi({
    title: 'AdvanceIndividualLiveHole',
    description: 'Request to advance to a specific hole in individual live scoring',
  });

export const IndividualLiveHoleScoreSchema = z
  .object({
    id: bigintToStringSchema,
    holeNumber: z.number().int(),
    score: z.number().int(),
    enteredBy: z.string(),
    enteredAt: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualLiveHoleScore',
    description: 'A single hole score in an individual live scoring session',
  });

export const IndividualLiveScoringStateSchema = z
  .object({
    sessionId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    status: LiveScoringStatusSchema,
    currentHole: z.number().int(),
    holesPlayed: z.number().int(),
    courseId: bigintToStringSchema,
    courseName: z.string(),
    teeId: bigintToStringSchema,
    teeName: z.string(),
    datePlayed: z.string(),
    startedAt: z.string().datetime(),
    startedBy: z.string(),
    viewerCount: z.number().int().optional(),
    scores: z.array(IndividualLiveHoleScoreSchema),
  })
  .openapi({
    title: 'IndividualLiveScoringState',
    description: 'Current state of an individual live scoring session',
  });

export const IndividualLiveSessionStatusSchema = z
  .object({
    hasActiveSession: z.boolean(),
    sessionId: bigintToStringSchema.optional(),
    viewerCount: z.number().int().optional(),
  })
  .openapi({
    title: 'IndividualLiveSessionStatus',
    description:
      'Lightweight status check for whether an account has an active individual live session',
  });

export const IndividualScoreUpdateEventSchema = z
  .object({
    holeNumber: z.number().int(),
    score: z.number().int(),
    enteredBy: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualScoreUpdateEvent',
    description: 'SSE event payload for a score update in individual live scoring',
  });

export const IndividualSessionStartedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    startedBy: z.string(),
    startedAt: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualSessionStartedEvent',
    description: 'SSE event payload when an individual live scoring session starts',
  });

export const IndividualSessionFinalizedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    finalizedBy: z.string(),
    finalizedAt: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualSessionFinalizedEvent',
    description: 'SSE event payload when an individual live scoring session is finalized',
  });

export const IndividualSessionStoppedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    stoppedBy: z.string(),
    stoppedAt: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualSessionStoppedEvent',
    description: 'SSE event payload when an individual live scoring session is stopped/cancelled',
  });

export const IndividualHoleAdvancedEventSchema = z
  .object({
    holeNumber: z.number().int(),
    advancedBy: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi({
    title: 'IndividualHoleAdvancedEvent',
    description: 'SSE event payload when the current hole is advanced in individual live scoring',
  });

export const IndividualSseTicketResponseSchema = z
  .object({
    ticket: z.string(),
    expiresIn: z.number().int(),
  })
  .openapi({
    title: 'IndividualSseTicketResponse',
    description: 'SSE connection ticket response for individual live scoring',
  });

export type StartIndividualLiveScoringType = z.infer<typeof StartIndividualLiveScoringSchema>;
export type SubmitIndividualLiveHoleScoreType = z.infer<typeof SubmitIndividualLiveHoleScoreSchema>;
export type AdvanceIndividualLiveHoleType = z.infer<typeof AdvanceIndividualLiveHoleSchema>;
export type IndividualLiveHoleScoreType = z.infer<typeof IndividualLiveHoleScoreSchema>;
export type IndividualLiveScoringStateType = z.infer<typeof IndividualLiveScoringStateSchema>;
export type IndividualLiveSessionStatusType = z.infer<typeof IndividualLiveSessionStatusSchema>;
export type IndividualScoreUpdateEventType = z.infer<typeof IndividualScoreUpdateEventSchema>;
export type IndividualSessionStartedEventType = z.infer<typeof IndividualSessionStartedEventSchema>;
export type IndividualSessionFinalizedEventType = z.infer<
  typeof IndividualSessionFinalizedEventSchema
>;
export type IndividualSessionStoppedEventType = z.infer<typeof IndividualSessionStoppedEventSchema>;
export type IndividualHoleAdvancedEventType = z.infer<typeof IndividualHoleAdvancedEventSchema>;
export type IndividualSseTicketResponseType = z.infer<typeof IndividualSseTicketResponseSchema>;
