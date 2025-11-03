import type { RegisterContext } from '../../openapiTypes.js';

export default function register({ registry, z }: RegisterContext): void {
  const BaseRunnerSchema = z
    .object({
      id: z.string().openapi({ example: 'runner-1' }),
      name: z.string().openapi({ example: 'Jamie Runner' }),
    })
    .openapi('RunnerState');

  const BasesStateSchema = z
    .object({
      first: BaseRunnerSchema.nullable(),
      second: BaseRunnerSchema.nullable(),
      third: BaseRunnerSchema.nullable(),
    })
    .openapi('BasesState');

  const ScoreEventSchema = z
    .object({
      id: z.string(),
      clientEventId: z.string().optional(),
      serverId: z.string().optional(),
      sequence: z.number(),
      gameId: z.string(),
      createdAt: z.string(),
      createdBy: z.string(),
      deviceId: z.string(),
      notation: z.string(),
      summary: z.string(),
      input: z.unknown(),
      inning: z.number(),
      half: z.enum(['top', 'bottom']),
      outsBefore: z.number(),
      outsAfter: z.number(),
      scoreAfter: z.object({ home: z.number(), away: z.number() }),
      basesAfter: BasesStateSchema,
    })
    .openapi('ScoreEventPayload');

  const ScoreMutationAuditSchema = z
    .object({
      userName: z.string(),
      deviceId: z.string(),
      timestamp: z.string(),
    })
    .openapi('ScoreMutationAudit');

  const ScoreMutationSchema = z
    .object({
      type: z.enum(['create', 'update', 'delete']),
      clientEventId: z.string(),
      serverEventId: z.string().optional(),
      sequence: z.number(),
      event: ScoreEventSchema.optional(),
      audit: ScoreMutationAuditSchema,
    })
    .openapi('ScoreMutationRequest');

  const ScoreMutationResponseSchema = z
    .object({
      serverEventId: z.string(),
      sequence: z.number(),
      event: ScoreEventSchema.extend({
        syncStatus: z.literal('synced'),
        syncError: z.null(),
        deleted: z.boolean().optional(),
      }).nullable(),
    })
    .openapi('ScoreMutationResponse');

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/score-events',
    tags: ['Scorekeeping'],
    summary: 'Submit a scoring mutation for a game',
    request: {
      params: z.object({
        accountId: z.string(),
        gameId: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: ScoreMutationSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Mutation accepted',
        content: {
          'application/json': {
            schema: ScoreMutationResponseSchema,
          },
        },
      },
      201: {
        description: 'Mutation accepted',
        content: {
          'application/json': {
            schema: ScoreMutationResponseSchema,
          },
        },
      },
    },
  });
}
