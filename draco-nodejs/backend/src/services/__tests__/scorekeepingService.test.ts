import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ScorekeepingService, type ScoreEventPayload, type ScoreMutationRequest } from '../scorekeepingService.js';
import type { ScorekeepingGateway } from '../scorekeepingGateway.js';
import { ConflictError, NotFoundError } from '../../utils/customErrors.js';

describe('ScorekeepingService', () => {
  let service: ScorekeepingService;
  const broadcast = vi.fn();

  const gateway = {
    broadcast,
  } as unknown as ScorekeepingGateway;

  beforeEach(() => {
    broadcast.mockReset();
    service = new ScorekeepingService(gateway);
  });

  const baseEvent = (overrides: Partial<ScoreEventPayload> = {}): ScoreEventPayload => ({
    id: 'client-1',
    clientEventId: 'client-1',
    sequence: 1,
    gameId: 'game-1',
    createdAt: new Date().toISOString(),
    createdBy: 'Tester',
    deviceId: 'device-1',
    notation: 'S7',
    summary: 'Single to left',
    input: { type: 'at_bat' },
    inning: 1,
    half: 'top',
    outsBefore: 0,
    outsAfter: 0,
    scoreAfter: { home: 0, away: 0 },
    basesAfter: { first: null, second: null, third: null },
    ...overrides,
  });

  const baseMutation = (overrides: Partial<ScoreMutationRequest> = {}): ScoreMutationRequest => ({
    type: 'create',
    clientEventId: 'client-1',
    sequence: 1,
    audit: { userName: 'Tester', deviceId: 'device-1', timestamp: new Date().toISOString() },
    event: baseEvent(),
    ...overrides,
  });

  it('stores and returns new score events', () => {
    const result = service.ingestMutation('acct', 'game-1', baseMutation());
    expect(result.serverEventId).toBeDefined();
    expect(result.event?.id).toBe('client-1');
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('prevents conflicting sequences', () => {
    service.ingestMutation('acct', 'game-1', baseMutation());
    expect(() =>
      service.ingestMutation(
        'acct',
        'game-1',
        baseMutation({
          clientEventId: 'client-2',
          event: baseEvent({ id: 'client-2', clientEventId: 'client-2' }),
        }),
      ),
    ).toThrow(ConflictError);
  });

  it('updates existing events', () => {
    const created = service.ingestMutation('acct', 'game-1', baseMutation());
    const updated = service.ingestMutation('acct', 'game-1', {
      type: 'update',
      clientEventId: 'client-1',
      serverEventId: created.serverEventId,
      sequence: 2,
      audit: { userName: 'Tester', deviceId: 'device-1', timestamp: new Date().toISOString() },
      event: baseEvent({ sequence: 2, summary: 'Updated summary' }),
    });

    expect(updated.event?.sequence).toBe(2);
    expect(updated.event?.summary).toBe('Updated summary');
  });

  it('throws when updating missing events', () => {
    expect(() =>
      service.ingestMutation('acct', 'game-1', {
        type: 'update',
        clientEventId: 'missing',
        sequence: 1,
        audit: { userName: 'Tester', deviceId: 'device-1', timestamp: new Date().toISOString() },
        event: baseEvent({ id: 'missing', clientEventId: 'missing' }),
      }),
    ).toThrow(NotFoundError);
  });

  it('removes events on delete', () => {
    const created = service.ingestMutation('acct', 'game-1', baseMutation());
    const result = service.ingestMutation('acct', 'game-1', {
      type: 'delete',
      clientEventId: 'client-1',
      serverEventId: created.serverEventId,
      sequence: created.sequence,
      audit: { userName: 'Tester', deviceId: 'device-1', timestamp: new Date().toISOString() },
    });

    expect(result.event).toBeNull();
    expect(service.listEvents('acct', 'game-1')).toHaveLength(0);
  });
});
