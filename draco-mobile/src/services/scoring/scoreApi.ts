import { requestJson } from '../api/httpClient';
import type { ScoreEvent, ScoreEventMutation } from '../../types/scoring';

export type SubmitScoreMutationResponse = {
  serverEventId: string;
  sequence: number;
  event: ScoreEvent | null;
};

export async function submitScoreMutation(
  token: string,
  mutation: ScoreEventMutation,
): Promise<SubmitScoreMutationResponse> {
  const path = `/api/accounts/${mutation.accountId}/games/${mutation.gameId}/score-events`;
  const body: Record<string, unknown> = {
    type: mutation.type,
    clientEventId: mutation.eventId,
    sequence: mutation.sequence,
    audit: mutation.audit,
  };

  if (mutation.serverId) {
    body.serverEventId = mutation.serverId;
  }

  if (mutation.payload) {
    const event = mutation.payload;
    const serializedEvent: ScoreEvent = {
      id: event.id,
      clientEventId: event.clientEventId ?? event.id,
      serverId: event.serverId,
      sequence: event.sequence,
      gameId: event.gameId,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
      deviceId: event.deviceId,
      notation: event.notation,
      summary: event.summary,
      input: event.input,
      inning: event.inning,
      half: event.half,
      outsBefore: event.outsBefore,
      outsAfter: event.outsAfter,
      scoreAfter: event.scoreAfter,
      basesAfter: event.basesAfter,
      syncStatus: event.syncStatus,
      syncError: event.syncError,
    };
    body.event = serializedEvent;
  }

  return requestJson<SubmitScoreMutationResponse>(path, {
    method: 'POST',
    token,
    body,
  });
}
