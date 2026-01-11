import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

// Live Scoring Session Status
export const LiveScoringStatusSchema = z
  .enum(['active', 'paused', 'finalized', 'stopped'])
  .openapi({
    title: 'LiveScoringStatus',
    description: 'Status of a live scoring session',
  });

// SSE Event Types
export const LiveScoringEventTypeSchema = z
  .enum([
    'connected',
    'state',
    'session_started',
    'score_update',
    'hole_advanced',
    'session_finalized',
    'session_stopped',
    'ping',
    'error',
  ])
  .openapi({
    title: 'LiveScoringEventType',
    description: 'Types of SSE events for live scoring',
  });

// Start Live Scoring Request
export const StartLiveScoringSchema = z
  .object({
    startingHole: z.number().int().min(1).max(18).optional().default(1),
    holesPlayed: z.union([z.literal(9), z.literal(18)]).default(18),
  })
  .openapi({
    title: 'StartLiveScoring',
    description: 'Request to start a live scoring session',
  });

// Submit Live Hole Score Request
export const SubmitLiveHoleScoreSchema = z
  .object({
    golferId: bigintToStringSchema,
    holeNumber: z.number().int().min(1).max(18),
    score: z.number().int().min(1).max(20),
  })
  .openapi({
    title: 'SubmitLiveHoleScore',
    description: 'Request to submit a single hole score during live scoring',
  });

// Advance Hole Request
export const AdvanceHoleSchema = z
  .object({
    holeNumber: z.number().int().min(1).max(18),
  })
  .openapi({
    title: 'AdvanceHole',
    description: 'Request to advance to a specific hole',
  });

// Finalize Live Scoring Request
export const FinalizeLiveScoringSchema = z
  .object({
    confirm: z.literal(true),
  })
  .openapi({
    title: 'FinalizeLiveScoring',
    description: 'Request to finalize a live scoring session and save scores permanently',
  });

// Live Hole Score Response
export const LiveHoleScoreSchema = z
  .object({
    id: bigintToStringSchema,
    golferId: bigintToStringSchema,
    golferName: z.string(),
    teamId: bigintToStringSchema.optional(),
    holeNumber: z.number().int(),
    score: z.number().int(),
    netScore: z.number().int().optional(),
    enteredBy: z.string(),
    enteredAt: z.string().datetime(),
  })
  .openapi({
    title: 'LiveHoleScore',
    description: 'A single hole score in a live scoring session',
  });

// Team Points for live scoring
export const LiveTeamPointsSchema = z
  .object({
    team1Name: z.string(),
    team1Points: z.number(),
    team2Name: z.string(),
    team2Points: z.number(),
  })
  .openapi({
    title: 'LiveTeamPoints',
    description: 'Accumulated team points during live scoring',
  });

// Live Scoring Session State
export const LiveScoringStateSchema = z
  .object({
    sessionId: bigintToStringSchema,
    matchId: bigintToStringSchema,
    status: LiveScoringStatusSchema,
    currentHole: z.number().int(),
    holesPlayed: z.number().int(),
    startedAt: z.string().datetime(),
    startedBy: z.string(),
    viewerCount: z.number().int().optional(),
    scores: z.array(LiveHoleScoreSchema),
    coursePars: z.array(z.number().int()).optional(),
    courseHandicaps: z.record(z.string(), z.number().int()).optional(),
    teamPoints: LiveTeamPointsSchema.optional(),
  })
  .openapi({
    title: 'LiveScoringState',
    description: 'Current state of a live scoring session',
  });

// SSE Score Update Event Payload
export const ScoreUpdateEventSchema = z
  .object({
    golferId: bigintToStringSchema,
    golferName: z.string(),
    teamId: bigintToStringSchema.optional(),
    holeNumber: z.number().int(),
    score: z.number().int(),
    enteredBy: z.string(),
    timestamp: z.string().datetime(),
    teamPoints: LiveTeamPointsSchema.optional(),
  })
  .openapi({
    title: 'ScoreUpdateEvent',
    description: 'SSE event payload for a score update',
  });

// SSE Session Started Event Payload
export const SessionStartedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    matchId: bigintToStringSchema,
    startedBy: z.string(),
    startedAt: z.string().datetime(),
  })
  .openapi({
    title: 'SessionStartedEvent',
    description: 'SSE event payload when a live scoring session starts',
  });

// SSE Session Finalized Event Payload
export const SessionFinalizedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    matchId: bigintToStringSchema,
    finalizedBy: z.string(),
    finalizedAt: z.string().datetime(),
  })
  .openapi({
    title: 'SessionFinalizedEvent',
    description: 'SSE event payload when a live scoring session is finalized',
  });

// Stop Live Scoring Request
export const StopLiveScoringSchema = z
  .object({
    confirm: z.literal(true),
  })
  .openapi({
    title: 'StopLiveScoring',
    description: 'Request to stop a live scoring session without saving scores',
  });

// SSE Session Stopped Event Payload
export const SessionStoppedEventSchema = z
  .object({
    sessionId: bigintToStringSchema,
    matchId: bigintToStringSchema,
    stoppedBy: z.string(),
    stoppedAt: z.string().datetime(),
  })
  .openapi({
    title: 'SessionStoppedEvent',
    description: 'SSE event payload when a live scoring session is stopped/cancelled',
  });

// Check if match has active live session (lightweight response)
export const LiveSessionStatusSchema = z
  .object({
    hasActiveSession: z.boolean(),
    sessionId: bigintToStringSchema.optional(),
    viewerCount: z.number().int().optional(),
  })
  .openapi({
    title: 'LiveSessionStatus',
    description: 'Lightweight status check for whether a match has an active live session',
  });

// SSE Role (scorer can enter scores, watcher can only view)
export const GolfSseRoleSchema = z.enum(['scorer', 'watcher']).openapi({
  title: 'GolfSseRole',
  description: 'Role for SSE connection - scorer can enter scores, watcher can only view',
});

// Get Live Scoring Ticket Request
export const GetLiveScoringTicketSchema = z
  .object({
    role: GolfSseRoleSchema.optional().default('watcher'),
  })
  .openapi({
    title: 'GetLiveScoringTicket',
    description: 'Request to get SSE connection ticket with optional role',
  });

// SSE Ticket Response
export const SseTicketResponseSchema = z
  .object({
    ticket: z.string(),
    expiresIn: z.number().int(),
  })
  .openapi({
    title: 'SseTicketResponse',
    description: 'Response containing a short-lived ticket for SSE subscription',
  });

// Type exports
export type LiveScoringStatusType = z.infer<typeof LiveScoringStatusSchema>;
export type LiveScoringEventTypeType = z.infer<typeof LiveScoringEventTypeSchema>;
export type StartLiveScoringType = z.infer<typeof StartLiveScoringSchema>;
export type SubmitLiveHoleScoreType = z.infer<typeof SubmitLiveHoleScoreSchema>;
export type AdvanceHoleType = z.infer<typeof AdvanceHoleSchema>;
export type FinalizeLiveScoringType = z.infer<typeof FinalizeLiveScoringSchema>;
export type StopLiveScoringType = z.infer<typeof StopLiveScoringSchema>;
export type LiveHoleScoreType = z.infer<typeof LiveHoleScoreSchema>;
export type LiveTeamPointsType = z.infer<typeof LiveTeamPointsSchema>;
export type LiveScoringStateType = z.infer<typeof LiveScoringStateSchema>;
export type ScoreUpdateEventType = z.infer<typeof ScoreUpdateEventSchema>;
export type SessionStartedEventType = z.infer<typeof SessionStartedEventSchema>;
export type SessionFinalizedEventType = z.infer<typeof SessionFinalizedEventSchema>;
export type SessionStoppedEventType = z.infer<typeof SessionStoppedEventSchema>;
export type LiveSessionStatusType = z.infer<typeof LiveSessionStatusSchema>;
export type GolfSseRoleType = z.infer<typeof GolfSseRoleSchema>;
export type GetLiveScoringTicketType = z.infer<typeof GetLiveScoringTicketSchema>;
export type SseTicketResponseType = z.infer<typeof SseTicketResponseSchema>;
