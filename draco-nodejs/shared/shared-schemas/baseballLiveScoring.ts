import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

// Baseball Live Scoring Session Status
export const BaseballLiveScoringStatusSchema = z
  .enum(['active', 'paused', 'finalized', 'stopped'])
  .openapi({
    title: 'BaseballLiveScoringStatus',
    description: 'Status of a baseball live scoring session',
  });

// SSE Event Types for Baseball
export const BaseballLiveScoringEventTypeSchema = z
  .enum([
    'connected',
    'state',
    'session_started',
    'score_update',
    'inning_advanced',
    'session_finalized',
    'session_stopped',
    'viewer_count',
    'ping',
    'error',
  ])
  .openapi({
    title: 'BaseballLiveScoringEventType',
    description: 'Types of SSE events for baseball live scoring',
  });

// Start Baseball Live Scoring Request - no configuration needed
export const StartBaseballLiveScoringSchema = z.object({}).openapi({
  title: 'StartBaseballLiveScoring',
  description: 'Request to start a baseball live scoring session',
});

// Submit Baseball Live Inning Score Request
export const SubmitBaseballLiveInningScoreSchema = z
  .object({
    inningNumber: z.number().int().min(1).max(99),
    isHomeTeam: z.boolean(),
    runs: z.number().int().min(0).max(99),
  })
  .openapi({
    title: 'SubmitBaseballLiveInningScore',
    description: 'Request to submit runs for a specific inning and team during live scoring',
  });

// Advance Inning Request
export const AdvanceBaseballInningSchema = z
  .object({
    inningNumber: z.number().int().min(1).max(99),
  })
  .openapi({
    title: 'AdvanceBaseballInning',
    description: 'Request to advance to a specific inning',
  });

// Finalize Baseball Live Scoring Request
export const FinalizeBaseballLiveScoringSchema = z
  .object({
    confirm: z.literal(true),
  })
  .openapi({
    title: 'FinalizeBaseballLiveScoring',
    description: 'Request to finalize a baseball live scoring session and save scores permanently',
  });

// Stop Baseball Live Scoring Request
export const StopBaseballLiveScoringSchema = z
  .object({
    confirm: z.literal(true),
  })
  .openapi({
    title: 'StopBaseballLiveScoring',
    description: 'Request to stop a baseball live scoring session without saving scores',
  });

// Baseball Live Inning Score Response
export const BaseballLiveInningScoreSchema = z
  .object({
    id: bigintToStringSchema,
    inningNumber: z.number().int(),
    isHomeTeam: z.boolean(),
    runs: z.number().int(),
    enteredBy: z.string(),
    enteredAt: z.string().datetime(),
  })
  .openapi({
    title: 'BaseballLiveInningScore',
    description: 'A single inning score in a baseball live scoring session',
  });

// Baseball Live Scoring Session State
export const BaseballLiveScoringStateSchema = z
  .object({
    sessionId: bigintToStringSchema,
    gameId: bigintToStringSchema,
    status: BaseballLiveScoringStatusSchema,
    currentInning: z.number().int(),
    startedAt: z.string().datetime(),
    startedBy: z.string(),
    viewerCount: z.number().int().optional(),
    scores: z.array(BaseballLiveInningScoreSchema),
    homeTeamTotal: z.number().int(),
    visitorTeamTotal: z.number().int(),
  })
  .openapi({
    title: 'BaseballLiveScoringState',
    description: 'Current state of a baseball live scoring session',
  });

// SSE Score Update Event Payload
export const BaseballScoreUpdateEventSchema = z
  .object({
    inningNumber: z.number().int(),
    isHomeTeam: z.boolean(),
    runs: z.number().int(),
    enteredBy: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi({
    title: 'BaseballScoreUpdateEvent',
    description: 'SSE event payload for a baseball score update',
  });

// SSE Session Started Event Payload
export const BaseballSessionStartedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    gameId: bigintToStringSchema,
    startedBy: z.string(),
    startedAt: z.string().datetime(),
  })
  .openapi({
    title: 'BaseballSessionStartedEvent',
    description: 'SSE event payload when a baseball live scoring session starts',
  });

// SSE Session Finalized Event Payload
export const BaseballSessionFinalizedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    gameId: bigintToStringSchema,
    finalizedBy: z.string(),
    finalizedAt: z.string().datetime(),
    homeTeamTotal: z.number().int(),
    visitorTeamTotal: z.number().int(),
  })
  .openapi({
    title: 'BaseballSessionFinalizedEvent',
    description: 'SSE event payload when a baseball live scoring session is finalized',
  });

// SSE Session Stopped Event Payload
export const BaseballSessionStoppedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    gameId: bigintToStringSchema,
    stoppedBy: z.string(),
    stoppedAt: z.string().datetime(),
  })
  .openapi({
    title: 'BaseballSessionStoppedEvent',
    description: 'SSE event payload when a baseball live scoring session is stopped/cancelled',
  });

// Check if game has active live session (lightweight response)
export const BaseballLiveSessionStatusSchema = z
  .object({
    hasActiveSession: z.boolean(),
    sessionId: bigintToStringSchema.optional(),
    viewerCount: z.number().int().optional(),
  })
  .openapi({
    title: 'BaseballLiveSessionStatus',
    description: 'Lightweight status check for whether a game has an active live session',
  });

// Type exports
export type BaseballLiveScoringStatusType = z.infer<typeof BaseballLiveScoringStatusSchema>;
export type BaseballLiveScoringEventTypeType = z.infer<typeof BaseballLiveScoringEventTypeSchema>;
export type StartBaseballLiveScoringType = z.infer<typeof StartBaseballLiveScoringSchema>;
export type SubmitBaseballLiveInningScoreType = z.infer<typeof SubmitBaseballLiveInningScoreSchema>;
export type AdvanceBaseballInningType = z.infer<typeof AdvanceBaseballInningSchema>;
export type FinalizeBaseballLiveScoringType = z.infer<typeof FinalizeBaseballLiveScoringSchema>;
export type StopBaseballLiveScoringType = z.infer<typeof StopBaseballLiveScoringSchema>;
export type BaseballLiveInningScoreType = z.infer<typeof BaseballLiveInningScoreSchema>;
export type BaseballLiveScoringStateType = z.infer<typeof BaseballLiveScoringStateSchema>;
export type BaseballScoreUpdateEventType = z.infer<typeof BaseballScoreUpdateEventSchema>;
export type BaseballSessionStartedEventType = z.infer<typeof BaseballSessionStartedEventSchema>;
export type BaseballSessionFinalizedEventType = z.infer<typeof BaseballSessionFinalizedEventSchema>;
export type BaseballSessionStoppedEventType = z.infer<typeof BaseballSessionStoppedEventSchema>;
export type BaseballLiveSessionStatusType = z.infer<typeof BaseballLiveSessionStatusSchema>;
